// Lớp truy cập dữ liệu. Toàn bộ đọc/ghi database nằm trong file này.
// Kết nối tới đâu (Cloudflare D1, Turso hay file SQLite trên máy) do lib/sql.ts quyết định.
import "server-only";
import {
  type Addon,
  EMPTY_HOME_MEDIA,
  HERO_SLOTS,
  type HomeMedia,
  type Package,
  type Photographer,
  type Province,
  type School,
  type Settings,
  type Tier,
  VIBES,
} from "./constants";
import {
  SEED_ADDONS,
  SEED_PACKAGES,
  SEED_PHOTOGRAPHERS,
  SEED_PROVINCES,
  SEED_SCHOOLS,
  SEED_SETTINGS,
  SEED_TIERS,
} from "./seed";
import { CREATE_MIGRATIONS_TABLE, MIGRATIONS, MIGRATIONS_TABLE } from "./migrations";
import { type Row, type Statement, sql, sqlKind } from "./sql";

export { sqlKind };

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tiers (
    key TEXT PRIMARY KEY, label TEXT NOT NULL, price_from INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS photographers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    tier TEXT NOT NULL, city TEXT NOT NULL DEFAULT '', rating REAL NOT NULL DEFAULT 5,
    sessions INTEGER NOT NULL DEFAULT 0, price_from INTEGER NOT NULL DEFAULT 0,
    vibes TEXT NOT NULL DEFAULT '[]', categories TEXT NOT NULL DEFAULT '[]', services TEXT NOT NULL DEFAULT '{}',
    availability TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', album_url TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0, photos TEXT NOT NULL DEFAULT '[]', sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL DEFAULT 0, description TEXT NOT NULL DEFAULT '', includes TEXT NOT NULL DEFAULT '[]',
    image TEXT NOT NULL DEFAULT '', featured INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS addons (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    short TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT '', photos TEXT NOT NULL DEFAULT '[]',
    photographers TEXT NOT NULL DEFAULT '[]', sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS provinces (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, fee INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0)`,
];

/**
 * Tạo bảng + nạp dữ liệu mẫu nếu database còn trống. Chạy một lần mỗi tiến trình.
 * Trên Cloudflare D1 bỏ qua bước này: bảng và dữ liệu được đẩy lên bằng
 * `npm run cf:db:push` (xem scripts/cloudflare.mjs).
 */
const g = globalThis as unknown as { __dbReady?: Promise<void> };
function ready(): Promise<void> {
  if (sqlKind() === "d1") return Promise.resolve();
  g.__dbReady ??= (async () => {
    await sql().batch(SCHEMA.map((s) => ({ sql: s })));
    await applyMigrations();
    await seedIfEmpty();
  })().catch((e) => {
    g.__dbReady = undefined; // lỗi thì lần sau thử lại
    throw e;
  });
  return g.__dbReady;
}

/** Chạy các migration chưa áp dụng (xem lib/migrations.ts). */
async function applyMigrations() {
  await sql().query({ sql: CREATE_MIGRATIONS_TABLE });
  const done = new Set((await sql().query({ sql: `SELECT name FROM ${MIGRATIONS_TABLE}` })).map((r) => String(r.name)));
  for (const m of MIGRATIONS) {
    if (done.has(m.name)) continue;
    await sql().batch([
      ...m.statements.map((s) => ({ sql: s })),
      { sql: `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES (?)`, args: [m.name] },
    ]);
  }
}

async function seedIfEmpty() {
  const [{ n }] = await sql().query({ sql: "SELECT COUNT(*) AS n FROM settings" });
  if (Number(n) > 0) return;
  const stmts: Statement[] = [
    ...Object.entries(SEED_SETTINGS).map(([k, v]) => ({ sql: "INSERT INTO settings (key, value) VALUES (?, ?)", args: [k, v] })),
    ...SEED_TIERS.map((t, i) => tierInsert({ ...t, sort: i })),
    ...SEED_PHOTOGRAPHERS.map((p, i) => photographerInsert({ ...p, sort: i })),
    ...SEED_PACKAGES.map((p, i) => packageInsert({ ...p, sort: i })),
    ...SEED_ADDONS.map((a, i) => addonInsert({ ...a, sort: i })),
    ...SEED_SCHOOLS.map((s, i) => schoolInsert({ ...s, sort: i })),
    ...SEED_PROVINCES.map((p, i) => provinceInsert({ ...p, sort: i })),
  ];
  try {
    await sql().batch(stmts); // một giao dịch: chạy song song hai lần thì lần sau lỗi khoá chính và bị huỷ
  } catch (e) {
    const [{ n: again }] = await sql().query({ sql: "SELECT COUNT(*) AS n FROM settings" });
    if (Number(again) === 0) throw e;
  }
}

// ---------- Tiện ích ----------
const json = <T>(v: unknown, fallback: T): T => {
  try {
    return JSON.parse(String(v)) as T;
  } catch {
    return fallback;
  }
};

async function query(stmt: Statement) {
  await ready();
  return sql().query(stmt);
}
async function batch(stmts: Statement[]) {
  await ready();
  return sql().batch(stmts);
}
async function all<T>(text: string, map: (r: Row) => T, args: (string | number)[] = []) {
  return (await query({ sql: text, args })).map(map);
}
async function one<T>(text: string, map: (r: Row) => T, args: (string | number)[] = []) {
  const [row] = await query({ sql: text, args });
  return row ? map(row) : undefined;
}
async function run(text: string, args: (string | number)[] = []) {
  return query({ sql: text, args });
}
async function nextSort(table: string) {
  const [r] = await run(`SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM ${table}`);
  return Number(r.n);
}

// ---------- Mappers: hàng trong database → object thường ----------
const toTier = (r: Row): Tier => ({
  key: String(r.key),
  label: String(r.label),
  priceFrom: Number(r.price_from),
  description: String(r.description),
  sort: Number(r.sort),
});
const toPhotographer = (r: Row): Photographer => ({
  id: Number(r.id),
  slug: String(r.slug),
  name: String(r.name),
  tier: String(r.tier),
  city: String(r.city),
  rating: Number(r.rating),
  sessions: Number(r.sessions),
  priceFrom: Number(r.price_from),
  vibes: json(r.vibes, []),
  categories: json(r.categories, []),
  services: json(r.services, {} as Photographer["services"]),
  availability: String(r.availability),
  bio: String(r.bio),
  albumUrl: String(r.album_url),
  featured: Number(r.featured) === 1,
  photos: json(r.photos, []),
  zalo: String(r.zalo ?? ""),
  messenger: String(r.messenger ?? ""),
  instagram: String(r.instagram ?? ""),
  zaloQr: String(r.zalo_qr ?? ""),
  bookedDates: json(r.booked_dates ?? "[]", []),
  sort: Number(r.sort),
});
const toPackage = (r: Row): Package => ({
  id: Number(r.id),
  name: String(r.name),
  category: String(r.category),
  price: Number(r.price),
  description: String(r.description),
  includes: json(r.includes, []),
  image: String(r.image),
  featured: Number(r.featured) === 1,
  sort: Number(r.sort),
});
const toAddon = (r: Row): Addon => ({
  id: Number(r.id),
  name: String(r.name),
  price: Number(r.price),
  description: String(r.description),
  image: String(r.image),
  sort: Number(r.sort),
});
const toSchool = (r: Row): School => ({
  id: Number(r.id),
  slug: String(r.slug),
  name: String(r.name),
  short: String(r.short),
  type: String(r.type),
  photos: json(r.photos, []),
  photographers: json(r.photographers, []),
  sort: Number(r.sort),
});
const toProvince = (r: Row): Province => ({
  id: Number(r.id),
  name: String(r.name),
  fee: Number(r.fee),
  sort: Number(r.sort),
});

// ---------- Settings ----------
export async function getSettings(): Promise<Settings> {
  const rows = await all("SELECT key, value FROM settings", (r) => [String(r.key), String(r.value)] as const);
  const s = { ...SEED_SETTINGS };
  // Chỉ nhận các khoá của Settings (bảng settings còn chứa dữ liệu khác, VD ảnh trang chủ)
  for (const [k, v] of rows) if (k in s) (s as Record<string, string>)[k] = v;
  return s;
}
export async function saveSettings(s: Settings) {
  await batch(
    Object.entries(s).map(([k, v]) => ({
      sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [k, v],
    })),
  );
}

// ---------- Ảnh trang chủ ----------
const HOME_MEDIA_KEY = "home_media";
const text = (v: unknown) => (typeof v === "string" ? v : "");

export async function getHomeMedia(): Promise<HomeMedia> {
  const raw = await one("SELECT value FROM settings WHERE key = ?", (r) => String(r.value), [HOME_MEDIA_KEY]);
  if (!raw) return EMPTY_HOME_MEDIA;
  let data: Partial<Record<keyof HomeMedia, unknown>>;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_HOME_MEDIA;
  }
  const hero = Array.isArray(data.hero) ? data.hero : [];
  const vibes = (data.vibes ?? {}) as Record<string, unknown>;
  return {
    hero: hero.slice(0, HERO_SLOTS).map((h: { photo?: unknown; photographer?: unknown }) => ({
      photo: text(h?.photo),
      photographer: text(h?.photographer),
    })),
    strip: (Array.isArray(data.strip) ? data.strip : []).map(text).filter(Boolean),
    vibes: Object.fromEntries(VIBES.map((v) => [v, text(vibes[v])]).filter(([, src]) => src)),
  };
}
export async function saveHomeMedia(m: HomeMedia) {
  await run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [HOME_MEDIA_KEY, JSON.stringify(m)],
  );
}

// ---------- Tiers (hạng / bảng giá) ----------
const tierInsert = (t: Tier): Statement => ({
  sql: "INSERT INTO tiers (key, label, price_from, description, sort) VALUES (?, ?, ?, ?, ?)",
  args: [t.key, t.label, t.priceFrom, t.description, t.sort],
});
export const listTiers = () => all("SELECT * FROM tiers ORDER BY sort, key", toTier);
export const getTier = (key: string) => one("SELECT * FROM tiers WHERE key = ?", toTier, [key]);
export async function createTier(t: Omit<Tier, "sort">) {
  await query(tierInsert({ ...t, sort: await nextSort("tiers") }));
}
export async function updateTier(key: string, t: Omit<Tier, "key" | "sort">) {
  await run("UPDATE tiers SET label = ?, price_from = ?, description = ? WHERE key = ?", [t.label, t.priceFrom, t.description, key]);
}
export async function countPhotographersInTier(key: string) {
  const [r] = await run("SELECT COUNT(*) AS n FROM photographers WHERE tier = ?", [key]);
  return Number(r.n);
}
export async function deleteTier(key: string) {
  await run("DELETE FROM tiers WHERE key = ?", [key]);
}

// ---------- Photographers ----------
type PhotographerInput = Omit<Photographer, "id">;
const photographerInsert = (p: PhotographerInput): Statement => ({
  sql: `INSERT INTO photographers (slug, name, tier, city, rating, sessions, price_from, vibes, categories, services,
        availability, bio, album_url, featured, photos, zalo, messenger, instagram, zalo_qr, booked_dates, sort)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [
    p.slug, p.name, p.tier, p.city, p.rating, p.sessions, p.priceFrom, JSON.stringify(p.vibes),
    JSON.stringify(p.categories), JSON.stringify(p.services), p.availability, p.bio, p.albumUrl,
    p.featured ? 1 : 0, JSON.stringify(p.photos), p.zalo, p.messenger, p.instagram, p.zaloQr,
    JSON.stringify(p.bookedDates), p.sort,
  ],
});
export const listPhotographers = () => all("SELECT * FROM photographers ORDER BY sort, id", toPhotographer);
export const getPhotographerBySlug = (slug: string) =>
  one("SELECT * FROM photographers WHERE slug = ?", toPhotographer, [slug]);
export const getPhotographerById = (id: number) => one("SELECT * FROM photographers WHERE id = ?", toPhotographer, [id]);
export async function slugTaken(table: "photographers" | "schools", slug: string, exceptId?: number) {
  const rows = await run(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, [slug, exceptId ?? -1]);
  return rows.length > 0;
}
export async function createPhotographer(p: Omit<PhotographerInput, "sort">) {
  await query(photographerInsert({ ...p, sort: await nextSort("photographers") }));
}

/** Câu lệnh cập nhật danh sách photographer của các trường khi đổi slug / xoá photographer */
async function schoolLinkUpdates(oldSlug: string, newSlug: string | null): Promise<Statement[]> {
  const schools = await listSchools();
  return schools
    .filter((s) => s.photographers.includes(oldSlug))
    .map((s) => ({
      sql: "UPDATE schools SET photographers = ? WHERE id = ?",
      args: [
        JSON.stringify(newSlug ? s.photographers.map((x) => (x === oldSlug ? newSlug : x)) : s.photographers.filter((x) => x !== oldSlug)),
        s.id,
      ],
    }));
}

export async function updatePhotographer(id: number, p: Omit<PhotographerInput, "sort">) {
  const old = await getPhotographerById(id);
  const links = old && old.slug !== p.slug ? await schoolLinkUpdates(old.slug, p.slug) : [];
  await batch(
    [
      {
        sql: `UPDATE photographers SET slug = ?, name = ?, tier = ?, city = ?, rating = ?, sessions = ?, price_from = ?,
              vibes = ?, categories = ?, services = ?, availability = ?, bio = ?, album_url = ?, featured = ?, photos = ?,
              zalo = ?, messenger = ?, instagram = ?, zalo_qr = ?, booked_dates = ?
              WHERE id = ?`,
        args: [
          p.slug, p.name, p.tier, p.city, p.rating, p.sessions, p.priceFrom, JSON.stringify(p.vibes),
          JSON.stringify(p.categories), JSON.stringify(p.services), p.availability, p.bio, p.albumUrl,
          p.featured ? 1 : 0, JSON.stringify(p.photos), p.zalo, p.messenger, p.instagram, p.zaloQr,
          JSON.stringify(p.bookedDates), id,
        ],
      },
      ...links,
    ],
  );
}
export async function deletePhotographer(id: number) {
  const p = await getPhotographerById(id);
  if (!p) return;
  const links = await schoolLinkUpdates(p.slug, null);
  await batch([{ sql: "DELETE FROM photographers WHERE id = ?", args: [id] }, ...links]);
}

// ---------- Packages (gói chụp) ----------
type PackageInput = Omit<Package, "id">;
const packageInsert = (p: PackageInput): Statement => ({
  sql: "INSERT INTO packages (name, category, price, description, includes, image, featured, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  args: [p.name, p.category, p.price, p.description, JSON.stringify(p.includes), p.image, p.featured ? 1 : 0, p.sort],
});
export const listPackages = () => all("SELECT * FROM packages ORDER BY sort, id", toPackage);
export const getPackage = (id: number) => one("SELECT * FROM packages WHERE id = ?", toPackage, [id]);
export async function createPackage(p: Omit<PackageInput, "sort">) {
  await query(packageInsert({ ...p, sort: await nextSort("packages") }));
}
export async function updatePackage(id: number, p: Omit<PackageInput, "sort">) {
  await run(
    "UPDATE packages SET name = ?, category = ?, price = ?, description = ?, includes = ?, image = ?, featured = ? WHERE id = ?",
    [p.name, p.category, p.price, p.description, JSON.stringify(p.includes), p.image, p.featured ? 1 : 0, id],
  );
}
export async function deletePackage(id: number) {
  await run("DELETE FROM packages WHERE id = ?", [id]);
}

// ---------- Addons (đồ bán kèm) ----------
type AddonInput = Omit<Addon, "id">;
const addonInsert = (a: AddonInput): Statement => ({
  sql: "INSERT INTO addons (name, price, description, image, sort) VALUES (?, ?, ?, ?, ?)",
  args: [a.name, a.price, a.description, a.image, a.sort],
});
export const listAddons = () => all("SELECT * FROM addons ORDER BY sort, id", toAddon);
export const getAddon = (id: number) => one("SELECT * FROM addons WHERE id = ?", toAddon, [id]);
export async function createAddon(a: Omit<AddonInput, "sort">) {
  await query(addonInsert({ ...a, sort: await nextSort("addons") }));
}
export async function updateAddon(id: number, a: Omit<AddonInput, "sort">) {
  await run("UPDATE addons SET name = ?, price = ?, description = ?, image = ? WHERE id = ?", [a.name, a.price, a.description, a.image, id]);
}
export async function deleteAddon(id: number) {
  await run("DELETE FROM addons WHERE id = ?", [id]);
}

// ---------- Schools (trường) ----------
type SchoolInput = Omit<School, "id">;
const schoolInsert = (s: SchoolInput): Statement => ({
  sql: "INSERT INTO schools (slug, name, short, type, photos, photographers, sort) VALUES (?, ?, ?, ?, ?, ?, ?)",
  args: [s.slug, s.name, s.short, s.type, JSON.stringify(s.photos), JSON.stringify(s.photographers), s.sort],
});
export const listSchools = () => all("SELECT * FROM schools ORDER BY sort, id", toSchool);
export const getSchool = (id: number) => one("SELECT * FROM schools WHERE id = ?", toSchool, [id]);
export async function createSchool(s: Omit<SchoolInput, "sort">) {
  await query(schoolInsert({ ...s, sort: await nextSort("schools") }));
}
export async function updateSchool(id: number, s: Omit<SchoolInput, "sort">) {
  await run("UPDATE schools SET slug = ?, name = ?, short = ?, type = ?, photos = ?, photographers = ? WHERE id = ?", [
    s.slug, s.name, s.short, s.type, JSON.stringify(s.photos), JSON.stringify(s.photographers), id,
  ]);
}
export async function deleteSchool(id: number) {
  await run("DELETE FROM schools WHERE id = ?", [id]);
}

// ---------- Provinces (phụ phí tỉnh) ----------
const provinceInsert = (p: Omit<Province, "id">): Statement => ({
  sql: "INSERT INTO provinces (name, fee, sort) VALUES (?, ?, ?)",
  args: [p.name, p.fee, p.sort],
});
export const listProvinces = () => all("SELECT * FROM provinces ORDER BY sort, id", toProvince);
export async function createProvince(p: Omit<Province, "id" | "sort">) {
  await query(provinceInsert({ ...p, sort: await nextSort("provinces") }));
}
export async function updateProvince(id: number, p: Omit<Province, "id" | "sort">) {
  await run("UPDATE provinces SET name = ?, fee = ? WHERE id = ?", [p.name, p.fee, id]);
}
export async function deleteProvince(id: number) {
  await run("DELETE FROM provinces WHERE id = ?", [id]);
}

// ---------- Sắp xếp thứ tự (lên/xuống) ----------
export async function moveRow(
  table: "photographers" | "packages" | "addons" | "schools" | "provinces",
  id: number,
  dir: -1 | 1,
) {
  const ids = await all(`SELECT id FROM ${table} ORDER BY sort, id`, (r) => Number(r.id));
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await batch(
    ids.map((rid, idx) => ({ sql: `UPDATE ${table} SET sort = ? WHERE id = ?`, args: [idx, rid] })),
  );
}

export async function counts() {
  const tables = ["photographers", "packages", "addons", "schools", "provinces", "tiers"] as const;
  const rs = await batch(tables.map((t) => ({ sql: `SELECT COUNT(*) AS n FROM ${t}` })));
  return Object.fromEntries(tables.map((t, i) => [t, Number(rs[i][0]?.n ?? 0)])) as Record<(typeof tables)[number], number>;
}
