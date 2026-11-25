// Logo tạm: khung ngắm máy ảnh + chấm nhấn. Thay bằng logo thật (SVG) khi có —
// giữ nguyên tên component để header, footer và trang quản trị tự đổi theo.
import { cn } from "@/lib/cn";

export function Logo({ className, inverse }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("shrink-0", className)} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="12" className={inverse ? "fill-canvas" : "fill-ink"} />
      <path
        d="M11 16v-3a2 2 0 0 1 2-2h3M24 11h3a2 2 0 0 1 2 2v3M29 24v3a2 2 0 0 1-2 2h-3M16 29h-3a2 2 0 0 1-2-2v-3"
        fill="none"
        className={inverse ? "stroke-ink" : "stroke-canvas"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="3.6" className="fill-accent" />
    </svg>
  );
}
