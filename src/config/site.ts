// Cấu hình tĩnh của web: đường dẫn, menu, URL gốc.
// Nội dung thay đổi thường xuyên (tên thương hiệu, Zalo…) nằm trong database
// và được sửa ở /admin/settings — không đặt ở đây.

/** URL gốc khi deploy, dùng cho SEO (sitemap, Open Graph). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Mọi đường dẫn nội bộ đi qua đây — đổi URL chỉ cần sửa một chỗ. */
export const routes = {
  home: "/",
  photographers: "/photographer",
  photographer: (slug: string) => `/photographer/${slug}`,
  schools: "/truong",
  school: (slug: string) => `/truong#${slug}`,
  pricing: "/bang-gia",
  provinceFees: "/bang-gia#phu-phi",
  contact: "/lien-he",
} as const;

/** Tạo link danh sách photographer đã lọc sẵn, VD: ?vibe=Film */
export function photographersFiltered(filters: { vibe?: string; cat?: string; tier?: string }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.append(key, value);
  const qs = params.toString();
  return qs ? `${routes.photographers}?${qs}` : routes.photographers;
}

export const MAIN_NAV = [
  { href: routes.photographers, label: "Chọn Photo" },
  { href: routes.schools, label: "Chọn trường" },
  { href: routes.pricing, label: "Bảng giá" },
] as const;

/** Công tắc giữa 2 cách khám phá: theo người chụp hoặc theo trường */
export const DISCOVER_TABS = [
  { href: routes.photographers, label: "Chọn Photo" },
  { href: routes.schools, label: "Chọn trường" },
];

export const BOOKING_CTA = { href: routes.contact, label: "Đặt lịch ngay" } as const;
