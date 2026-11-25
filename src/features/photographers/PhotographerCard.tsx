import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Label, Tag } from "@/components/ui/Tag";
import { routes } from "@/config/site";
import { availabilityOf } from "@/lib/availability";
import { type Photographer, formatVND } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function PhotographerCard({
  p,
  tierLabel,
  priority,
  className,
}: {
  p: Photographer;
  tierLabel?: string;
  priority?: boolean;
  className?: string;
}) {
  const [cover, hover] = p.photos;
  return (
    <Link href={routes.photographer(p.slug)} className={cn("group block", className)}>
      <div className="relative overflow-hidden rounded-2xl">
        <Photo
          src={cover}
          alt={`Ảnh portfolio của ${p.name}`}
          priority={priority}
          imgClassName="transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-[1.05]"
        />
        {/* Ảnh thứ hai hiện ra khi rê chuột — xem nhanh thêm một khung hình */}
        {hover && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <Photo src={hover} alt="" ratio="auto" className="h-full" imgClassName="scale-[1.05]" />
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <Tag tone="glass">
            <Label>{tierLabel ?? p.tier}</Label>
          </Tag>
        </div>
        <div className="absolute inset-x-3 bottom-3">
          <AvailabilityTag p={p} />
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="font-serif text-2xl leading-none tracking-tight">{p.name}</h3>
        <p className="flex items-center gap-1 text-sm tabular-nums">
          <Icon name="star" filled className="h-3.5 w-3.5 text-accent" />
          <span className="font-semibold">{p.rating.toFixed(1)}</span>
          <span className="sr-only">trên 5 sao</span>
        </p>
      </div>
      <p className="mt-2 truncate text-sm text-muted">{p.vibes.join(" · ")}</p>
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3 text-sm">
        <p>
          <span className="hidden text-muted sm:inline">Từ </span>
          <span className="font-semibold tabular-nums">{formatVND(p.priceFrom)}</span>
        </p>
        <p className="hidden font-mono text-xs text-muted tabular-nums sm:block">{p.sessions} buổi</p>
      </div>
    </Link>
  );
}

export function AvailabilityTag({ p, tone = "glass" }: { p: Photographer; tone?: "glass" | "neutral" }) {
  const { soon: available, label } = availabilityOf(p.bookedDates);
  return (
    <Tag tone={tone} className="max-w-full">
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", available ? "bg-positive" : "bg-muted")}
      />
      <span className={cn("truncate", available ? "text-ink" : "text-muted")}>{label}</span>
    </Tag>
  );
}
