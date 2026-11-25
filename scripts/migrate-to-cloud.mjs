// Chuyển dữ liệu đang có trên máy (data/app.db + data/uploads) lên Turso và Cloudflare R2.
//
// Cách chạy (sau khi đã điền TURSO_* và R2_* vào .env.local):
//   npm run migrate:cloud
//
// Tuỳ chọn:
//   --overwrite     xoá dữ liệu đang có trên Turso rồi chép lại (mặc định: dừng nếu Turso đã có dữ liệu)
//   --skip-images   không tải ảnh lên R2, giữ nguyên đường dẫn ảnh (chỉ dùng để thử)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@libsql/client";

const args = new Set(process.argv.slice(2));
const OVERWRITE = args.has("--overwrite");
const SKIP_IMAGES = args.has("--skip-images");
const env = process.env;

function need(names) {
  const missing = names.filter((n) => !env[n]);
  if (missing.length) {
    console.error(`Thiếu ${missing.join(", ")} trong .env.local`);
    process.exit(1);
  }
}
need(["TURSO_DATABASE_URL"]);
if (!SKIP_IMAGES) need(["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"]);

const TABLES = ["settings", "tiers", "photographers", "packages", "addons", "schools", "provinces"];
const local = createClient({ url: "file:data/app.db" });
const remote = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

// ---------- 1. Kiểm tra Turso ----------
const hasSettings = await remote.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'",
);
if (hasSettings.rows.length) {
  const n = Number((await remote.execute("SELECT COUNT(*) AS n FROM settings")).rows[0].n);
  if (n > 0 && !OVERWRITE) {
    console.error("Turso đã có dữ liệu. Chạy lại với --overwrite nếu muốn ghi đè bằng dữ liệu trên máy.");
    process.exit(1);
  }
}

// ---------- 2. Tải ảnh lên R2 ----------
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const publicUrl = (env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
const MIME = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif" };
let uploaded = 0;
if (!SKIP_IMAGES) {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
  let files = [];
  try {
    files = await readdir(UPLOAD_DIR);
  } catch {
    // chưa có ảnh nào được tải lên
  }
  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (!MIME[ext]) continue;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: `uploads/${name}`,
        Body: await readFile(path.join(UPLOAD_DIR, name)),
        ContentType: MIME[ext],
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    uploaded++;
    process.stdout.write(`\rĐã tải ${uploaded}/${files.length} ảnh lên R2`);
  }
  if (files.length) process.stdout.write("\n");
}

/** Đổi đường dẫn ảnh trên máy (/uploads/x) thành link R2 */
function rewrite(value) {
  if (SKIP_IMAGES || typeof value !== "string") return value;
  if (value.startsWith("/uploads/")) return publicUrl + value;
  return value.includes('"/uploads/') ? value.replaceAll('"/uploads/', `"${publicUrl}/uploads/`) : value;
}

// ---------- 3. Chép bảng ----------
const stmts = [];
for (const table of TABLES) {
  const ddl = await local.execute({ sql: "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?", args: [table] });
  if (!ddl.rows.length) continue;
  if (OVERWRITE) stmts.push(`DROP TABLE IF EXISTS ${table}`);
  stmts.push(String(ddl.rows[0].sql).replace(/^CREATE TABLE /i, "CREATE TABLE IF NOT EXISTS "));

  const rows = await local.execute(`SELECT * FROM ${table}`);
  const cols = rows.columns;
  for (const row of rows.rows) {
    stmts.push({
      sql: `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      args: cols.map((c) => rewrite(row[c])),
    });
  }
  console.log(`${table}: ${rows.rows.length} dòng`);
}
await remote.batch(stmts, "write");

console.log(`\nXong! Đã chép ${TABLES.length} bảng lên Turso${SKIP_IMAGES ? "" : ` và ${uploaded} ảnh lên R2`}.`);
console.log("Khởi động lại `npm run dev` để web dùng Turso + R2.");
