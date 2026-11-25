import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/layout/Logo";
import { AdminNav, AdminNavFallback } from "@/components/admin/AdminNav";
import { logoutAction } from "../actions";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s · Quản trị" },
  robots: { index: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-serif text-lg font-semibold text-ink">Quản trị</span>
          </Link>
          <Link href="/" target="_blank" className="text-xs font-medium text-muted hover:text-accent md:hidden">
            Xem web ↗
          </Link>
        </div>
        <Suspense fallback={<AdminNavFallback />}>
          <AdminNav />
        </Suspense>
        <div className="hidden space-y-1 px-3 pb-4 md:absolute md:inset-x-0 md:bottom-0 md:block">
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-accent">
            Xem website ↗
          </Link>
          <form action={logoutAction}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-canvas hover:text-red-700">
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        <Suspense fallback={<p className="text-sm text-muted">Đang tải…</p>}>{children}</Suspense>
        <form action={logoutAction} className="mt-10 md:hidden">
          <button className="text-sm text-muted hover:text-red-700">Đăng xuất</button>
        </form>
      </main>
    </div>
  );
}
