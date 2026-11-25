"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Tổng quan", exact: true },
  { href: "/admin/home", label: "Ảnh trang chủ" },
  { href: "/admin/photographers", label: "Photographer" },
  { href: "/admin/packages", label: "Gói chụp" },
  { href: "/admin/addons", label: "Đồ bán kèm" },
  { href: "/admin/schools", label: "Trường" },
  { href: "/admin/pricing", label: "Bảng giá & tỉnh" },
  { href: "/admin/settings", label: "Cài đặt chung" },
];

export function AdminNav() {
  const pathname = usePathname();
  return <NavList pathname={pathname} />;
}

/** Bản không đánh dấu mục đang mở — hiện trong lúc chờ đường dẫn hiện tại */
export function AdminNavFallback() {
  return <NavList pathname="" />;
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-ink text-white" : "text-ink/80 hover:bg-canvas hover:text-accent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
