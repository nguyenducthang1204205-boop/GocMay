// Driver database: một giao diện chung, nhiều nơi lưu.
//
//   Cloudflare D1    — khi chạy trên Cloudflare Workers (binding DB trong wrangler.jsonc)
//   Turso (libSQL)   — khi có TURSO_DATABASE_URL (VD: chạy trên Vercel)
//   File SQLite      — còn lại: data/app.db trên máy (đổi bằng LOCAL_DB_FILE)
//
// db.ts chỉ gọi query() và batch() nên không cần biết đang dùng loại nào.
// Thêm nơi lưu mới = viết thêm một SqlDriver.
import "server-only";
import { cloudflareEnv } from "./runtime";

export type SqlValue = string | number | null;
export type Statement = { sql: string; args?: SqlValue[] };
export type Row = Record<string, unknown>;

export interface SqlDriver {
  readonly kind: "d1" | "turso" | "file";
  query(stmt: Statement): Promise<Row[]>;
  /** Chạy nhiều câu lệnh trong một giao dịch: lỗi một câu thì huỷ tất cả. */
  batch(stmts: Statement[]): Promise<Row[][]>;
}

export function localDbFile() {
  return process.env.LOCAL_DB_FILE || "data/app.db";
}

/** Loại database đang dùng (hiển thị ở trang Tổng quan của quản trị). */
export function sqlKind(): SqlDriver["kind"] {
  if (cloudflareEnv()?.DB) return "d1";
  return process.env.TURSO_DATABASE_URL ? "turso" : "file";
}

// ---------- Cloudflare D1 ----------
function d1Driver(d1: D1Database): SqlDriver {
  const prepare = (s: Statement) => d1.prepare(s.sql).bind(...(s.args ?? []));
  return {
    kind: "d1",
    async query(stmt) {
      return (await prepare(stmt).all<Row>()).results;
    },
    async batch(stmts) {
      if (!stmts.length) return [];
      const results = await d1.batch<Row>(stmts.map(prepare));
      return results.map((r) => r.results ?? []);
    },
  };
}

// ---------- Turso (qua HTTP, bản @libsql/client/web — chạy được mọi nơi) ----------
type TursoClient = import("@libsql/client/web").Client;
const g = globalThis as unknown as { __turso?: TursoClient; __sqlite?: Promise<import("node:sqlite").DatabaseSync> };

async function tursoClient(): Promise<TursoClient> {
  if (!g.__turso) {
    const { createClient } = await import("@libsql/client/web");
    g.__turso = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return g.__turso;
}

/** Hàng của libSQL là object đặc biệt — chuyển về object thường cho giống D1. */
const plain = (rs: { columns: string[]; rows: ArrayLike<unknown>[] }): Row[] =>
  rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));

function tursoDriver(): SqlDriver {
  return {
    kind: "turso",
    async query(stmt) {
      return plain(await (await tursoClient()).execute({ sql: stmt.sql, args: stmt.args ?? [] }));
    },
    async batch(stmts) {
      if (!stmts.length) return [];
      const rs = await (await tursoClient()).batch(
        stmts.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
        "write",
      );
      return rs.map(plain);
    },
  };
}

// ---------- File SQLite trên máy (node:sqlite có sẵn trong Node.js, không cần cài thêm) ----------
function sqliteFile() {
  g.__sqlite ??= (async () => {
    const [{ DatabaseSync }, { mkdirSync }, path] = await Promise.all([
      import("node:sqlite"),
      import("node:fs"),
      import("node:path"),
    ]);
    const file = path.resolve(localDbFile());
    mkdirSync(path.dirname(file), { recursive: true });
    const db = new DatabaseSync(file);
    db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    return db;
  })();
  return g.__sqlite;
}

function fileDriver(): SqlDriver {
  const exec = (db: import("node:sqlite").DatabaseSync, s: Statement) =>
    db.prepare(s.sql).all(...(s.args ?? [])) as Row[];
  return {
    kind: "file",
    async query(stmt) {
      return exec(await sqliteFile(), stmt);
    },
    async batch(stmts) {
      const db = await sqliteFile();
      // DatabaseSync chạy đồng bộ: từ BEGIN tới COMMIT không có await nên không xen truy vấn khác
      db.exec("BEGIN IMMEDIATE");
      try {
        const out = stmts.map((s) => exec(db, s));
        db.exec("COMMIT");
        return out;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

/** Lấy driver theo môi trường hiện tại. Gọi mỗi lần truy vấn (binding D1 gắn theo request). */
export function sql(): SqlDriver {
  const d1 = cloudflareEnv()?.DB;
  if (d1) return d1Driver(d1);
  return process.env.TURSO_DATABASE_URL ? tursoDriver() : fileDriver();
}
