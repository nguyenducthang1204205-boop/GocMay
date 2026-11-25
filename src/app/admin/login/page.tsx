import type { Metadata } from "next";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-7 shadow-sm">
        <Logo className="h-11 w-11" />
        <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">Quản trị website</h1>
        <p className="mt-1 text-sm text-muted">Nhập mật khẩu quản trị để tiếp tục.</p>
        <LoginForm />
      </div>
    </div>
  );
}
