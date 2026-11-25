// Ảnh chuẩn của web: giữ chỗ theo tỉ lệ (không nhảy layout), lazy-load mặc định,
// nền placeholder khi đang tải. Ảnh lấy từ R2 hoặc /uploads nên dùng <img> thường.
import { cn } from "@/lib/cn";

export const PLACEHOLDER_SRC = "/placeholder.svg";

const RATIOS = {
  portrait: "aspect-[4/5]",
  tall: "aspect-[3/4]",
  square: "aspect-square",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/10]",
  auto: "",
} as const;

export type PhotoRatio = keyof typeof RATIOS;

export function Photo({
  src,
  alt,
  ratio = "portrait",
  priority,
  className,
  imgClassName,
  sizes,
}: {
  src?: string | null;
  alt: string;
  ratio?: PhotoRatio;
  /** Ảnh nằm trong màn hình đầu tiên → tải ngay */
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  sizes?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-sunken", RATIOS[ratio], className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || PLACEHOLDER_SRC}
        alt={alt}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={cn("absolute inset-0 h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
