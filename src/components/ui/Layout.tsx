// Khối bố cục dùng chung: Container (độ rộng), Section (nền + khoảng cách),
// SectionHeader (tiêu đề chuẩn của mỗi phần), Eyebrow (nhãn nhỏ phía trên tiêu đề).
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({
  children,
  className,
  size = "page",
}: {
  children: ReactNode;
  className?: string;
  size?: "page" | "narrow" | "prose";
}) {
  const width = { page: "max-w-page", narrow: "max-w-5xl", prose: "max-w-3xl" }[size];
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-10", width, className)}>{children}</div>;
}

const TONES = {
  canvas: "bg-canvas text-ink",
  surface: "bg-surface text-ink",
  ink: "bg-ink text-canvas grain",
} as const;

export type SectionTone = keyof typeof TONES;

export function Section({
  children,
  tone = "canvas",
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  tone?: SectionTone;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-20 py-20 md:py-28", TONES[tone], className)}>
      {children}
    </section>
  );
}

/** Nhãn nhỏ kiểu tạp chí: "01 — Đi tỉnh" */
export function Eyebrow({ children, index, className }: { children: ReactNode; index?: string; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] opacity-75", className)}>
      {index && (
        <>
          <span>{index}</span>
          <span aria-hidden className="h-px w-8 bg-current opacity-50" />
        </>
      )}
      <span>{children}</span>
    </p>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  index,
  title,
  description,
  action,
  align = "split",
  className,
}: {
  id?: string;
  eyebrow?: ReactNode;
  index?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "split" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <header
      className={cn(
        "reveal mb-12 flex flex-col gap-6 md:mb-16",
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && <Eyebrow index={index} className={cn("mb-5", centered && "justify-center")}>{eyebrow}</Eyebrow>}
        <h2 id={id} className="font-serif text-4xl leading-[1.05] tracking-tight text-balance md:text-5xl lg:text-6xl">
          {title}
        </h2>
        {description && <p className="mt-5 max-w-xl text-base leading-relaxed opacity-75 md:text-lg">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
