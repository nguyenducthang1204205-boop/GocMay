// Lịch trống của photographer. Quản trị tích các ngày ĐÃ CÓ LỊCH (bookedDates);
// ngày không tích là còn trống. Mọi ngày dạng "YYYY-MM-DD" theo giờ Việt Nam.
// Hàm thuần — dùng chung cho server, trình duyệt và trang quản trị.

export const TIME_ZONE = "Asia/Ho_Chi_Minh";
/** "Còn lịch sớm" = có ít nhất một ngày trống trong khoảng này */
export const SOON_DAYS = 14;
/** Tìm ngày trống gần nhất trong khoảng này */
const LOOKAHEAD_DAYS = 120;

export type ISODate = string; // "2026-11-25"

/** Hôm nay theo giờ Việt Nam */
export function todayVN(now = new Date()): ISODate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** Cộng/trừ ngày trên chuỗi ISO (tính theo UTC để không lệch múi giờ) */
export function addDays(date: ISODate, n: number): ISODate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = Chủ nhật … 6 = Thứ bảy */
export function weekday(date: ISODate) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** "T7, 29/11" */
export function formatShort(date: ISODate) {
  const [, m, d] = date.split("-");
  return `${WEEKDAY_SHORT[weekday(date)]}, ${d}/${m}`;
}

/** Ngày trống gần nhất từ hôm nay (null nếu kín cả khoảng tìm) */
export function nextFreeDate(booked: Iterable<ISODate>, today = todayVN()): ISODate | null {
  const set = new Set(booked);
  for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
    const d = addDays(today, i);
    if (!set.has(d)) return d;
  }
  return null;
}

export type Availability = {
  /** Có ngày trống trong SOON_DAYS ngày tới */
  soon: boolean;
  nextFree: ISODate | null;
  /** Nhãn ngắn hiển thị trên thẻ */
  label: string;
};

export function availabilityOf(booked: ISODate[], today = todayVN()): Availability {
  const next = nextFreeDate(booked, today);
  const soon = !!next && next <= addDays(today, SOON_DAYS - 1);
  let label: string;
  if (!next) label = "Kín lịch";
  else if (next === today) label = "Còn lịch hôm nay";
  else if (next === addDays(today, 1)) label = "Còn lịch ngày mai";
  else label = `Trống từ ${formatShort(next)}`;
  return { soon, nextFree: next, label };
}

/** Bỏ ngày đã qua, bỏ trùng, sắp xếp — gọi trước khi lưu để dữ liệu gọn */
export function cleanBookedDates(dates: unknown, today = todayVN()): ISODate[] {
  if (!Array.isArray(dates)) return [];
  const valid = dates.filter((d): d is ISODate => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today);
  return [...new Set(valid)].sort();
}

/** Các ô của một tháng để vẽ lịch (tuần bắt đầu Thứ hai). null = ô trống đầu tháng. */
export function monthGrid(year: number, month: number): (ISODate | null)[] {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const offset = (weekday(first) + 6) % 7; // Thứ hai = 0
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))];
}

export const WEEK_HEADER = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function monthLabel(year: number, month: number) {
  return `Tháng ${month}/${year}`;
}

/** Tháng kế tiếp/trước: { year, month } */
export function shiftMonth(year: number, month: number, n: number) {
  const idx = year * 12 + (month - 1) + n;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}
