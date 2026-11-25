import type { Photographer } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { PhotographerCard } from "./PhotographerCard";

/** Lưới thẻ photographer chuẩn — dùng ở trang chủ, danh sách, mục "cùng vibe". */
export function PhotographerGrid({
  photographers,
  tierLabels,
  priorityCount = 0,
  className,
}: {
  photographers: Photographer[];
  tierLabels: Record<string, string>;
  priorityCount?: number;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14", className)}>
      {photographers.map((p, i) => (
        <li key={p.slug}>
          <PhotographerCard p={p} tierLabel={tierLabels[p.tier]} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
