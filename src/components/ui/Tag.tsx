import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONES = {
  neutral: "border border-line bg-surface text-ink/80",
  soft: "bg-sunken text-ink",
  accent: "bg-accent-soft text-accent",
  positive: "bg-positive-soft text-positive",
  glass: "bg-canvas/85 text-ink backdrop-blur-md",
  inverse: "border border-canvas/25 text-canvas/90",
} as const;

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Nhãn nhỏ dạng mono, viết hoa — dùng cho hạng photographer, mã trường… */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[11px] uppercase tracking-[0.18em]", className)}>{children}</span>;
}
