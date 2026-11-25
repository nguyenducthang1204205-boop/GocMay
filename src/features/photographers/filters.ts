// Logic lọc/sắp xếp photographer — hàm thuần, không phụ thuộc giao diện.
// Trạng thái lọc được lưu trên URL (?vibe=Film&tier=pro…) để khách chia sẻ được link.
import { type Photographer, isAvailableSoon, normalize } from "@/lib/constants";

export const SORTS = [
  { value: "featured", label: "Nổi bật" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "sessions", label: "Nhiều buổi nhất" },
  { value: "rating", label: "Đánh giá cao" },
] as const;

export type SortKey = (typeof SORTS)[number]["value"];

export type Filters = {
  q: string;
  cats: string[];
  vibes: string[];
  tiers: string[];
  available: boolean;
  sort: SortKey;
};

export const EMPTY_FILTERS: Filters = { q: "", cats: [], vibes: [], tiers: [], available: false, sort: "featured" };

/** Tên tham số trên URL */
const KEYS = { q: "q", cats: "cat", vibes: "vibe", tiers: "tier", available: "available", sort: "sort" } as const;

export function parseFilters(params: URLSearchParams): Filters {
  const sort = params.get(KEYS.sort) as SortKey | null;
  return {
    q: params.get(KEYS.q) ?? "",
    cats: params.getAll(KEYS.cats),
    vibes: params.getAll(KEYS.vibes),
    tiers: params.getAll(KEYS.tiers),
    available: params.get(KEYS.available) === "1",
    sort: sort && SORTS.some((s) => s.value === sort) ? sort : "featured",
  };
}

export function serializeFilters(f: Filters): string {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set(KEYS.q, f.q.trim());
  f.cats.forEach((v) => params.append(KEYS.cats, v));
  f.vibes.forEach((v) => params.append(KEYS.vibes, v));
  f.tiers.forEach((v) => params.append(KEYS.tiers, v));
  if (f.available) params.set(KEYS.available, "1");
  if (f.sort !== "featured") params.set(KEYS.sort, f.sort);
  return params.toString();
}

/** Số bộ lọc đang bật (không tính ô tìm kiếm và sắp xếp) */
export function countActive(f: Filters) {
  return f.cats.length + f.vibes.length + f.tiers.length + (f.available ? 1 : 0);
}

export function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/**
 * Quy tắc lọc:
 * - Danh mục: phải nhận TẤT CẢ danh mục đã chọn (VD: Kỷ yếu + Nhận đi tỉnh)
 * - Vibe / hạng: khớp ÍT NHẤT MỘT lựa chọn
 */
export function applyFilters(list: Photographer[], f: Filters): Photographer[] {
  const q = normalize(f.q.trim());
  const result = list.filter((p) => {
    if (q && !normalize([p.name, ...p.vibes, ...p.categories, p.bio].join(" ")).includes(q)) return false;
    if (f.cats.length && !f.cats.every((c) => p.categories.includes(c))) return false;
    if (f.vibes.length && !f.vibes.some((v) => p.vibes.includes(v))) return false;
    if (f.tiers.length && !f.tiers.includes(p.tier)) return false;
    if (f.available && !isAvailableSoon(p)) return false;
    return true;
  });
  return sortPhotographers(result, f.sort);
}

export function sortPhotographers(list: Photographer[], sort: SortKey): Photographer[] {
  const sorted = [...list];
  const compare: Record<SortKey, (a: Photographer, b: Photographer) => number> = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort,
    "price-asc": (a, b) => a.priceFrom - b.priceFrom,
    "price-desc": (a, b) => b.priceFrom - a.priceFrom,
    sessions: (a, b) => b.sessions - a.sessions,
    rating: (a, b) => b.rating - a.rating || b.sessions - a.sessions,
  };
  return sorted.sort(compare[sort]);
}

/** Photographer cùng vibe — dùng cho mục "Cùng vibe" ở trang chi tiết */
export function findSimilar(list: Photographer[], target: Photographer, limit = 4) {
  return list
    .filter((o) => o.slug !== target.slug)
    .map((o) => ({ o, score: o.vibes.filter((v) => target.vibes.includes(v)).length + (o.tier === target.tier ? 0.5 : 0) }))
    .filter(({ score }) => score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ o }) => o);
}
