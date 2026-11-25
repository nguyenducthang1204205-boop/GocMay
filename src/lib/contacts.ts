// Chuẩn hoá thông tin liên hệ người quản trị nhập vào: cho phép nhập số điện thoại,
// @tên hoặc link đầy đủ — luôn lưu thành link mở được.

const withHttps = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);

/** "0961 120 879" | "zalo.me/0961120879" | link → https://zalo.me/0961120879 */
export function normalizeZalo(input: string) {
  const v = input.trim();
  if (!v) return "";
  if (/zalo\.me\//i.test(v)) return withHttps(v);
  const digits = v.replace(/[^\d]/g, "");
  if (digits.length >= 9 && /^[\d\s.+()-]+$/.test(v)) return `https://zalo.me/${digits}`;
  return withHttps(v);
}

/** "ten.trang" | "m.me/ten.trang" | link facebook → link mở Messenger */
export function normalizeMessenger(input: string) {
  const v = input.trim().replace(/^@/, "");
  if (!v) return "";
  if (/^(https?:\/\/)?([\w-]+\.)?(m\.me|messenger\.com|facebook\.com|fb\.com)\//i.test(v)) return withHttps(v);
  if (/^[\w.]+$/.test(v)) return `https://m.me/${v}`;
  return withHttps(v);
}

/** "@ten.ig" | "ten.ig" | link → https://instagram.com/ten.ig */
export function normalizeInstagram(input: string) {
  const v = input.trim().replace(/^@/, "");
  if (!v) return "";
  if (/instagram\.com\//i.test(v)) return withHttps(v);
  if (/^[\w.]+$/.test(v)) return `https://instagram.com/${v}`;
  return withHttps(v);
}

/** Phần dễ đọc của link để hiển thị: https://instagram.com/abc → @abc */
export function contactHandle(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (/instagram\.com$/i.test(u.hostname)) return path ? `@${path}` : u.hostname;
    return path || u.hostname;
  } catch {
    return url;
  }
}
