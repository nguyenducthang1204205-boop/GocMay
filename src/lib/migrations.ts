// Thay đổi cấu trúc database theo thời gian. Nguồn duy nhất cho mọi nơi lưu:
//   - File SQLite / Turso: lib/db.ts tự áp dụng khi web khởi động.
//   - Cloudflare D1: `npm run cf:deploy` tự áp dụng trước khi build (scripts/cloudflare.mjs).
// Mỗi migration chỉ chạy một lần, được ghi lại trong bảng app_migrations.
//
// Thêm thay đổi mới: thêm một mục vào CUỐI danh sách, tên tăng dần. KHÔNG sửa mục đã có.
// (File chỉ dùng cú pháp TypeScript đơn giản để Node.js chạy thẳng được trong script.)

export type Migration = { name: string; statements: string[] };

export const MIGRATIONS_TABLE = "app_migrations";

export const MIGRATIONS: Migration[] = [
  {
    name: "0001_photographer_contacts",
    statements: [
      "ALTER TABLE photographers ADD COLUMN zalo TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE photographers ADD COLUMN messenger TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE photographers ADD COLUMN instagram TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE photographers ADD COLUMN zalo_qr TEXT NOT NULL DEFAULT ''",
    ],
  },
  {
    // Lịch: danh sách ngày đã có lịch, JSON ["2026-12-01", …]
    name: "0002_photographer_booked_dates",
    statements: ["ALTER TABLE photographers ADD COLUMN booked_dates TEXT NOT NULL DEFAULT '[]'"],
  },
];

export const CREATE_MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
  name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
