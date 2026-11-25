import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container, Eyebrow } from "./Layout";

/** Phần đầu chuẩn của các trang con (danh sách, bảng giá, trường, liên hệ). */
export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  tabs,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Nội dung bên phải (số liệu nhanh) */
  aside?: ReactNode;
  /** Thanh chuyển qua lại giữa các trang anh em */
  tabs?: ReactNode;
}) {
  return (
    <header className="pb-10 pt-10 md:pb-14 md:pt-16">
      <Container>
        {tabs && <div className="mb-10">{tabs}</div>}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-6 font-serif text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.98] tracking-[-0.03em] text-balance">
              {title}
            </h1>
            {description && <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{description}</p>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      </Container>
    </header>
  );
}

/** Công tắc dạng viên thuốc giữa 2–3 trang liên quan (VD: Chọn Photo / Chọn trường). */
export function PageTabs({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav aria-label="Chế độ xem" className="inline-flex rounded-full border border-line bg-surface p-1">
      {items.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors",
              active ? "bg-ink text-canvas" : "text-muted hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Cặp số liệu nhỏ dùng ở phần aside của PageHeader */
export function QuickStats({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex gap-8 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col-reverse gap-1">
          <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">{s.label}</dt>
          <dd className="font-serif text-3xl tabular-nums tracking-tight">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
