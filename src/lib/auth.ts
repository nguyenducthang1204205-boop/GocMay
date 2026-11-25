// Đăng nhập quản trị bằng một mật khẩu (ADMIN_PASSWORD trong .env.local).
// Phiên đăng nhập là cookie httpOnly có chữ ký HMAC, hết hạn sau 7 ngày.
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("Thiếu SESSION_SECRET (ít nhất 32 ký tự) trong .env.local");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  // So sánh băm để hai chuỗi luôn cùng độ dài, tránh lộ thông tin qua thời gian chạy
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Thiếu ADMIN_PASSWORD trong .env.local");
  return safeEqual(input, expected);
}

export async function startSession() {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  const value = `${expires}.${sign(String(expires))}`;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  await connection(); // luôn kiểm tra lúc có request, không bao giờ prerender
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, sig] = value.split(".");
  if (!expires || !sig) return false;
  if (Number(expires) < Date.now() / 1000) return false;
  return safeEqual(sig, sign(expires));
}

/** Gọi ở đầu mọi trang và mọi server action của quản trị */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
