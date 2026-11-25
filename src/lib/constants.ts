import { availabilityOf } from "./availability";

// Các danh sách cố định và kiểu dữ liệu dùng chung cho cả web và trang quản trị.

export const CATEGORIES = [
  "Kỷ yếu Đại học",
  "Kỷ yếu THPT",
  "Chụp nhóm",
  "Chụp cá nhân",
  "Nhận đi tỉnh",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const VIBES = ["Film", "Trong trẻo", "Cá tính", "Cổ điển", "Năng động", "Nắng ấm"] as const;
export type Vibe = (typeof VIBES)[number];

/** Số ô ảnh trong collage đầu trang chủ */
export const HERO_SLOTS = 4;
/** Dải ảnh chạy ngang cần ít nhất chừng này ảnh mới chạy liền mạch */
export const STRIP_MIN = 4;

/** Một ô collage: ảnh riêng và/hoặc photographer được gắn (slug, rỗng = không gắn) */
export type HeroSlot = { photo: string; photographer: string };

/**
 * Ảnh trang chủ do quản trị chọn. Phần nào để trống thì web tự lấy ảnh từ portfolio.
 * Lưu dạng JSON trong bảng settings (key "home_media") — không cần thêm bảng.
 */
export type HomeMedia = {
  hero: HeroSlot[];
  strip: string[];
  vibes: Partial<Record<Vibe, string>>;
};
export const EMPTY_HOME_MEDIA: HomeMedia = { hero: [], strip: [], vibes: {} };

export const SERVICES = [
  { key: "effects", label: "Súng bắn bong bóng / khói màu" },
  { key: "lighting", label: "Đèn (flash & đèn liên tục)" },
  { key: "styling", label: "Hỗ trợ trang phục / phụ kiện" },
  { key: "assistant", label: "Trợ lý đi kèm" },
  { key: "raw", label: "Trả file ảnh gốc" },
] as const;
export type ServiceKey = (typeof SERVICES)[number]["key"];

export const SCHOOL_TYPES = ["Đại học", "THPT"] as const;

export type Settings = {
  name: string;
  tagline: string;
  city: string;
  zalo: string;
  messenger: string;
  instagram: string;
  depositPolicy: string;
};

export type Tier = {
  key: string;
  label: string;
  priceFrom: number;
  description: string;
  sort: number;
};

export type Photographer = {
  id: number;
  slug: string;
  name: string;
  tier: string;
  city: string;
  rating: number;
  sessions: number;
  priceFrom: number;
  vibes: string[];
  categories: string[];
  services: Record<ServiceKey, boolean>;
  /** Ô chữ cũ — không còn hiển thị, thay bằng bookedDates. Giữ để không mất dữ liệu cũ. */
  availability: string;
  /** Các ngày ĐÃ CÓ LỊCH ("YYYY-MM-DD", giờ Việt Nam). Ngày không có trong danh sách = còn trống. */
  bookedDates: string[];
  bio: string;
  albumUrl: string;
  featured: boolean;
  photos: string[];
  /** Liên hệ trực tiếp — để trống thì dùng liên hệ của studio */
  zalo: string;
  messenger: string;
  instagram: string;
  /** Ảnh mã QR Zalo (khi không có link Zalo) */
  zaloQr: string;
  sort: number;
};

export type Package = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  includes: string[];
  image: string;
  featured: boolean;
  sort: number;
};

export type Addon = {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  sort: number;
};

export type School = {
  id: number;
  slug: string;
  name: string;
  short: string;
  type: string;
  photos: string[];
  photographers: string[]; // slug của photographer
  sort: number;
};

export type Province = { id: number; name: string; fee: number; sort: number };

export function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

/** Bỏ dấu tiếng Việt, chữ thường — dùng cho tìm kiếm và tạo slug */
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function slugify(s: string) {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Còn ngày trống trong 2 tuần tới (theo lịch đã tích) */
export function isAvailableSoon(p: Pick<Photographer, "bookedDates">, today?: string) {
  return availabilityOf(p.bookedDates, today).soon;
}
