import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Dải chạy ngang vô tận. Dừng khi rê chuột; đứng yên nếu người dùng tắt chuyển động. */
export function Marquee({
  items,
  reverse,
  duration = 40,
  className,
}: {
  items: ReactNode[];
  reverse?: boolean;
  /** Số giây cho một vòng */
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "marquee flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div
        className="marquee-track flex w-max shrink-0"
        data-reverse={reverse || undefined}
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {/* Lặp danh sách 2 lần để vòng chạy liền mạch; bản sao bị ẩn khỏi trình đọc màn hình */}
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 gap-3 pr-3">
            {items.map((item, i) => (
              <li key={i} className="shrink-0">
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
