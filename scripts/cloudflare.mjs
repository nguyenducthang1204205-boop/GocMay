// Triển khai web lên Cloudflare Workers (OpenNext + D1 + R2).
//
//   npm run cf:setup          Tạo database D1, kho ảnh R2 và lưu mật khẩu quản trị lên Cloudflare (chạy 1 lần)
//   npm run cf:db:push        Đẩy dữ liệu + ảnh trên máy (data/app.db, data/uploads) lên Cloudflare
//                             Thêm -- --yes để ghi đè khi Cloudflare đã có dữ liệu
//   npm run cf:db:migrate     Áp dụng thay đổi cấu trúc database (src/lib/migrations.ts) lên D1
//                             — cf:deploy tự chạy bước này, ít khi cần gọi riêng
//   npm run cf:preview        Chạy thử bản Cloudflare ngay trên máy (http://localhost:8787)
//   npm run cf:deploy         Build và đưa web lên Cloudflare
//
// Lần đầu: npx wrangler login → npm run cf:setup → npm run cf:db:push → npm run cf:deploy
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
// Node.js 24 chạy thẳng được file .ts đơn giản — dùng chung danh sách migration với web
import { CREATE_MIGRATIONS_TABLE, MIGRATIONS, MIGRATIONS_TABLE } from "../src/lib/migrations.ts";

const ROOT = process.cwd();
const WRANGLER_CONFIG = path.join(ROOT, "wrangler.jsonc");
const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000000";
const DB_NAME = "goc-may-db";
const MEDIA_BUCKET = "goc-may-media";
const CACHE_BUCKET = "goc-may-cache";
const LOCAL_DB = "data/app.db";
const LOCAL_UPLOADS = "data/uploads";
const WORK_DIR = ".wrangler/cf-build";
const TABLES = ["settings", "tiers", "photographers", "packages", "addons", "schools", "provinces", MIGRATIONS_TABLE];
const SECRETS = ["ADMIN_PASSWORD", "SESSION_SECRET"];
// Các file chứa bí mật — tạm ẩn khi build vì OpenNext nhúng mọi file .env* vào code worker
const SECRET_ENV_FILES = [".env.local", ".env.production.local"];

const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest);

// ---------- Tiện ích ----------
const log = (msg) => console.log(`\n▸ ${msg}`);
function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

/** Chạy lệnh, hiện output ra màn hình. */
function run(bin, args, { env, input, capture } = {}) {
  const res = spawnSync(process.execPath, [bin, ...args], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    input,
    stdio: capture ? ["pipe", "pipe", "pipe"] : input ? ["pipe", "inherit", "inherit"] : "inherit",
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: res.status === 0, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}
const WRANGLER = path.join(ROOT, "node_modules/wrangler/bin/wrangler.js");
const OPENNEXT = path.join(ROOT, "node_modules/@opennextjs/cloudflare/dist/cli/index.js");
const wrangler = (args, opts) => run(WRANGLER, args, opts);
const opennext = (args, opts) => run(OPENNEXT, args, opts);

function readDotEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

/** Vài dòng cuối của output lệnh — để hiện lỗi gốc từ wrangler */
const tail = (res, n = 15) => `${res.stderr}\n${res.stdout}`.trim().split(/\r?\n/).slice(-n).join("\n");

function ensureLogin() {
  // Chạy trên máy chủ build (Cloudflare Workers Builds / CI): đã có sẵn token, không cần đăng nhập.
  // Token đó có thể không có quyền đọc thông tin người dùng nên bỏ qua bước "whoami";
  // nếu token thiếu quyền, các lệnh sau sẽ báo lỗi cụ thể.
  if (process.env.CLOUDFLARE_API_TOKEN) return;
  const res = wrangler(["whoami"], { capture: true });
  if (!res.ok || /not authenticated|not logged in/i.test(res.stdout + res.stderr)) {
    fail(
      process.env.CLOUDFLARE_API_TOKEN
        ? `API token Cloudflare không dùng được (sai, hết hạn hoặc thiếu quyền):\n${tail(res)}`
        : "Chưa đăng nhập Cloudflare. Chạy: npx wrangler login",
    );
  }
}

function databaseIdConfigured() {
  return !readFileSync(WRANGLER_CONFIG, "utf8").includes(PLACEHOLDER_ID);
}

/** Tạm ẩn các file .env chứa bí mật trong lúc chạy fn, luôn trả lại dù có lỗi. */
function withSecretsHidden(fn) {
  const moved = [];
  const restore = () => {
    for (const f of moved.splice(0)) if (existsSync(`${f}.cf-hidden`)) renameSync(`${f}.cf-hidden`, f);
  };
  process.once("SIGINT", () => {
    restore();
    process.exit(130);
  });
  try {
    for (const f of SECRET_ENV_FILES) {
      if (existsSync(f)) {
        renameSync(f, `${f}.cf-hidden`);
        moved.push(f);
      }
    }
    return fn();
  } finally {
    restore();
  }
}

/** Build bản Cloudflare. dbFile = file SQLite dùng để dựng sẵn các trang tĩnh. */
function buildWorker(dbFile) {
  log("Build bản Cloudflare (next build + OpenNext)…");
  const ok = withSecretsHidden(() => opennext(["build"], { env: { LOCAL_DB_FILE: dbFile } }).ok);
  if (!ok) fail("Build thất bại — xem lỗi phía trên.");
}

// ---------- Xuất dữ liệu trên máy ra SQL ----------
const sqlValue = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

async function dumpLocalDb() {
  if (!existsSync(LOCAL_DB)) fail(`Không thấy ${LOCAL_DB}. Chạy npm run dev một lần để tạo dữ liệu.`);
  const db = createClient({ url: `file:${LOCAL_DB}` });
  const lines = ["PRAGMA defer_foreign_keys = TRUE;"];
  for (const table of TABLES) {
    const schema = await db.execute({ sql: "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?", args: [table] });
    if (!schema.rows.length) continue;
    lines.push(`DROP TABLE IF EXISTS ${table};`, `${schema.rows[0].sql};`);
    const rs = await db.execute(`SELECT * FROM ${table}`);
    for (const row of rs.rows) {
      const values = rs.columns.map((_, i) => sqlValue(row[i]));
      lines.push(`INSERT INTO ${table} (${rs.columns.join(", ")}) VALUES (${values.join(", ")});`);
    }
  }
  db.close();
  return lines.join("\n") + "\n";
}

function remoteHasData(target) {
  const res = wrangler(["d1", "execute", DB_NAME, target, "--json", "--command", "SELECT COUNT(*) AS n FROM settings"], {
    capture: true,
  });
  if (!res.ok) {
    if (/no such table/i.test(res.stdout + res.stderr)) return false; // database mới, chưa có bảng
    // Lỗi khác (mạng, thiếu quyền D1…) KHÔNG có nghĩa là database trống — dừng hẳn,
    // tránh khuyên chạy cf:db:push làm ghi đè dữ liệu thật
    fail(`Không đọc được database ${DB_NAME} — kiểm tra kết nối và quyền "D1: Edit" của token:\n${tail(res)}`);
  }
  try {
    return Number(JSON.parse(res.stdout)[0].results[0].n) > 0;
  } catch {
    return false;
  }
}

/** Áp dụng các migration chưa chạy lên D1. target: "--remote" | "--local" */
function applyD1Migrations(target) {
  const list = wrangler(
    ["d1", "execute", DB_NAME, target, "--json", "--command", `${CREATE_MIGRATIONS_TABLE}; SELECT name FROM ${MIGRATIONS_TABLE};`],
    { capture: true },
  );
  if (!list.ok) fail(`Không đọc được danh sách migration trên D1.\n${list.stderr}`);
  const results = JSON.parse(list.stdout);
  const done = new Set((results.at(-1)?.results ?? []).map((r) => r.name));
  const pending = MIGRATIONS.filter((m) => !done.has(m.name));
  if (!pending.length) {
    console.log("  Database đã ở bản mới nhất.");
    return;
  }
  mkdirSync(WORK_DIR, { recursive: true });
  for (const m of pending) {
    const file = path.join(WORK_DIR, `${m.name}.sql`);
    const statements = [...m.statements, `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (${sqlValue(m.name)})`];
    writeFileSync(file, statements.map((s) => `${s};`).join("\n") + "\n");
    if (!wrangler(["d1", "execute", DB_NAME, target, "--file", file, "--yes"], { capture: true }).ok) {
      fail(`Migration ${m.name} thất bại.`);
    }
    console.log(`  ✓ ${m.name}`);
  }
}

// ---------- Lệnh ----------
async function setup() {
  ensureLogin();

  log(`Tạo database D1 "${DB_NAME}"…`);
  if (databaseIdConfigured()) {
    console.log("  Đã có database_id trong wrangler.jsonc — bỏ qua.");
  } else {
    const list = wrangler(["d1", "list", "--json"], { capture: true });
    let id = list.ok ? JSON.parse(list.stdout).find((d) => d.name === DB_NAME)?.uuid : undefined;
    if (!id) {
      const created = wrangler(["d1", "create", DB_NAME], { capture: true });
      process.stdout.write(created.stdout);
      id = created.stdout.match(/"database_id":\s*"([0-9a-f-]{36})"/)?.[1] ?? created.stdout.match(/([0-9a-f]{8}-[0-9a-f-]{27})/)?.[1];
      if (!created.ok || !id) fail(`Không tạo được database D1.\n${created.stderr}`);
    }
    writeFileSync(WRANGLER_CONFIG, readFileSync(WRANGLER_CONFIG, "utf8").replaceAll(PLACEHOLDER_ID, id));
    console.log(`  database_id = ${id} (đã ghi vào wrangler.jsonc)`);
  }

  for (const bucket of [MEDIA_BUCKET, CACHE_BUCKET]) {
    log(`Tạo kho R2 "${bucket}"…`);
    const res = wrangler(["r2", "bucket", "create", bucket], { capture: true });
    if (res.ok) console.log("  Đã tạo.");
    else if (/already exists|already own/i.test(res.stdout + res.stderr)) console.log("  Đã có — bỏ qua.");
    else fail(`Không tạo được kho R2 ${bucket}. Có thể cần bật R2 trong Cloudflare Dashboard trước.\n${res.stderr}`);
  }

  log("Lưu mật khẩu quản trị lên Cloudflare (secret, được mã hoá)…");
  const env = readDotEnv(".env.local");
  for (const name of SECRETS) {
    const value = env[name];
    if (!value) fail(`Thiếu ${name} trong .env.local`);
    if (name === "ADMIN_PASSWORD" && value === "doi-mat-khau-nay") fail("Hãy đổi ADMIN_PASSWORD trong .env.local trước khi đưa lên mạng.");
    if (name === "SESSION_SECRET" && value.length < 32) fail("SESSION_SECRET phải dài ít nhất 32 ký tự.");
    if (!wrangler(["secret", "put", name], { input: value }).ok) fail(`Không lưu được ${name}.`);
  }

  console.log("\n✓ Xong. Tiếp theo: npm run cf:db:push rồi npm run cf:deploy\n");
}

async function dbPush() {
  const local = flags.has("--local");
  const target = local ? "--local" : "--remote";
  if (!local) {
    ensureLogin();
    if (!databaseIdConfigured()) fail("Chưa có database D1. Chạy npm run cf:setup trước.");
    if (remoteHasData(target) && !flags.has("--yes")) {
      fail("Database trên Cloudflare đã có dữ liệu. Chạy lại với: npm run cf:db:push -- --yes để GHI ĐÈ bằng dữ liệu trên máy.");
    }
  }

  log(`Đẩy dữ liệu ${LOCAL_DB} lên D1 (${local ? "bản chạy thử trên máy" : "Cloudflare"})…`);
  mkdirSync(WORK_DIR, { recursive: true });
  const file = path.join(WORK_DIR, "push.sql");
  writeFileSync(file, await dumpLocalDb());
  if (!wrangler(["d1", "execute", DB_NAME, target, "--file", file, "--yes"]).ok) fail("Không đẩy được dữ liệu lên D1.");

  const images = existsSync(LOCAL_UPLOADS) ? readdirSync(LOCAL_UPLOADS).filter((f) => /\.(jpg|png|webp|avif|gif)$/.test(f)) : [];
  if (images.length) log(`Tải ${images.length} ảnh lên R2 "${MEDIA_BUCKET}"…`);
  const types = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif" };
  for (const name of images) {
    const res = wrangler(
      ["r2", "object", "put", `${MEDIA_BUCKET}/uploads/${name}`, "--file", path.join(LOCAL_UPLOADS, name), "--content-type", types[path.extname(name)], target],
      { capture: true },
    );
    if (!res.ok) fail(`Không tải được ảnh ${name}.\n${res.stderr}`);
    console.log(`  ✓ ${name}`);
  }
  console.log("\n✓ Đã đẩy dữ liệu.\n");
}

async function preview() {
  // Bí mật cho bản chạy thử lấy từ .dev.vars (wrangler đọc file này), tạo từ .env.local
  if (!existsSync(".dev.vars")) {
    const env = readDotEnv(".env.local");
    writeFileSync(".dev.vars", SECRETS.map((k) => `${k}=${env[k] ?? ""}`).join("\n") + "\n");
    log("Đã tạo .dev.vars từ .env.local");
  }
  flags.add("--local");
  await dbPush();
  log("Cập nhật cấu trúc database (bản chạy thử)…");
  applyD1Migrations("--local");
  buildWorker(LOCAL_DB);
  log("Chạy thử tại http://localhost:8787 (Ctrl+C để dừng)…");
  opennext(["preview"]);
}

async function deploy() {
  ensureLogin();
  if (!databaseIdConfigured()) fail("Chưa có database D1. Chạy npm run cf:setup trước.");
  if (!remoteHasData("--remote")) fail("Database trên Cloudflare còn trống. Chạy npm run cf:db:push trước.");

  log("Cập nhật cấu trúc database trên D1…");
  applyD1Migrations("--remote");

  // Các trang tĩnh được dựng sẵn lúc build → dựng bằng dữ liệu THẬT đang có trên Cloudflare,
  // không phải dữ liệu trên máy, để deploy lại không làm web hiện nội dung cũ.
  log("Tải dữ liệu hiện tại từ D1 về để dựng trang…");
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });
  const sqlFile = path.join(WORK_DIR, "prod.sql");
  if (!wrangler(["d1", "export", DB_NAME, "--remote", "--output", sqlFile]).ok) fail("Không tải được dữ liệu từ D1.");
  const dbFile = path.join(WORK_DIR, "prod.db");
  const db = createClient({ url: `file:${dbFile}` });
  await db.executeMultiple(readFileSync(sqlFile, "utf8"));
  db.close();

  buildWorker(dbFile);

  log("Đưa lên Cloudflare…");
  if (!opennext(["deploy"]).ok) fail("Deploy thất bại — xem lỗi phía trên.");
  console.log("\n✓ Đã deploy. Link web nằm ở dòng *.workers.dev phía trên.\n");
}

async function dbMigrate() {
  const target = flags.has("--local") ? "--local" : "--remote";
  if (target === "--remote") ensureLogin();
  log("Cập nhật cấu trúc database trên D1…");
  applyD1Migrations(target);
}

const COMMANDS = { setup, "db:push": dbPush, "db:migrate": dbMigrate, preview, deploy };
if (!COMMANDS[command]) fail(`Lệnh không hợp lệ: ${command ?? "(trống)"}. Dùng: ${Object.keys(COMMANDS).join(", ")}`);
await COMMANDS[command]();
