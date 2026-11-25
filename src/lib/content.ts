// Dữ liệu cho web công khai, được cache (gắn tag CONTENT_TAG, không tự hết hạn).
// Trang quản trị gọi updateTag(CONTENT_TAG) sau mỗi lần thêm/sửa/xoá để web cập nhật ngay.
//
// Dùng unstable_cache thay cho "use cache" vì Cache Components chưa chạy ổn định trên
// Cloudflare Workers (OpenNext). Khi OpenNext hỗ trợ xong có thể chuyển lại.
import "server-only";
import { unstable_cache } from "next/cache";
import { isAvailableSoon } from "./constants";
import * as db from "./db";

export const CONTENT_TAG = "content";

/** Bọc một hàm đọc dữ liệu bằng cache có tag. */
function cached<Args extends unknown[], R>(key: string, fn: (...args: Args) => Promise<R>) {
  return unstable_cache(fn, [key], { tags: [CONTENT_TAG], revalidate: false });
}

export const getSettings = cached("settings", () => db.getSettings());
export const getTiers = cached("tiers", () => db.listTiers());
export const getPhotographers = cached("photographers", () => db.listPhotographers());
export const getPhotographer = cached("photographer", async (slug: string) => (await db.getPhotographerBySlug(slug)) ?? null);
export const getPackages = cached("packages", () => db.listPackages());
export const getAddons = cached("addons", () => db.listAddons());
export const getSchools = cached("schools", () => db.listSchools());
export const getProvinces = cached("provinces", () => db.listProvinces());
export const getHomeMedia = cached("home-media", () => db.getHomeMedia());

export async function getStats() {
  const list = await getPhotographers();
  return {
    total: list.length,
    available: list.filter((p) => isAvailableSoon(p)).length,
    sessions: list.reduce((s, p) => s + p.sessions, 0),
    minPrice: list.length ? Math.min(...list.map((p) => p.priceFrom)) : 0,
    rating: list.length ? list.reduce((s, p) => s + p.rating, 0) / list.length : 0,
  };
}

/** Map key hạng → nhãn hiển thị, dùng cho thẻ photographer */
export async function getTierLabels() {
  const tiers = await getTiers();
  return Object.fromEntries(tiers.map((t) => [t.key, t.label]));
}
