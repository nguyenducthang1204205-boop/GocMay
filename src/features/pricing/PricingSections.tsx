import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Label, Tag } from "@/components/ui/Tag";
import { photographersFiltered } from "@/config/site";
import { type Addon, type Package, type Photographer, type Tier, formatVND } from "@/lib/constants";
import { cn } from "@/lib/cn";

/** 3 hạng giá — hạng giữa được làm nổi bật. */
export function TierCards({ tiers, photographers }: { tiers: Tier[]; photographers: Photographer[] }) {
  const highlight = tiers.length > 2 ? 1 : -1;
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {tiers.map((tier, i) => {
        const hi = i === highlight;
        const count = photographers.filter((p) => p.tier === tier.key).length;
        return (
          <li
            key={tier.key}
            className={cn(
              "reveal flex flex-col rounded-[28px] p-7 md:p-8",
              hi ? "grain bg-ink text-canvas" : "border border-line bg-surface",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <Label className={hi ? "text-canvas/70" : "text-muted"}>Hạng {String(i + 1).padStart(2, "0")}</Label>
              {hi && (
                <Tag tone="inverse">
                  <Icon name="star" filled className="h-3 w-3 text-accent-bright" />
                  Được chọn nhiều
                </Tag>
              )}
            </div>
            <h3 className="mt-8 font-serif text-4xl tracking-tight">{tier.label}</h3>
            <p className={cn("mt-6 text-sm", hi ? "text-canvas/60" : "text-muted")}>Từ</p>
            <p className="font-serif text-4xl tabular-nums tracking-tight md:text-5xl">{formatVND(tier.priceFrom)}</p>
            <p className={cn("mt-5 flex-1 leading-relaxed", hi ? "text-canvas/75" : "text-muted")}>{tier.description}</p>
            <ButtonLink
              href={photographersFiltered({ tier: tier.key })}
              variant={hi ? "inverse" : "primary"}
              block
              className="mt-8"
              icon="arrowRight"
            >
              Xem {count} photographer
            </ButtonLink>
          </li>
        );
      })}
    </ul>
  );
}

export function PackageGrid({ packages }: { packages: Package[] }) {
  return (
    <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <li key={pkg.id} className="reveal flex flex-col">
          <div className="relative overflow-hidden rounded-2xl">
            <Photo src={pkg.image} alt={pkg.name} ratio="landscape" />
            {pkg.featured && (
              <Tag tone="glass" className="absolute left-3 top-3">
                Được chọn nhiều
              </Tag>
            )}
          </div>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              {pkg.category && <Label className="text-accent">{pkg.category}</Label>}
              <h3 className="mt-2 font-serif text-2xl leading-tight">{pkg.name}</h3>
            </div>
            <p className="shrink-0 font-serif text-2xl tabular-nums">{formatVND(pkg.price)}</p>
          </div>
          {pkg.description && <p className="mt-3 leading-relaxed text-muted">{pkg.description}</p>}
          {pkg.includes.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-line pt-4 text-[15px]">
              {pkg.includes.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <Icon name="check" className="mt-0.5 h-4 w-4 text-positive" />
                  {line}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AddonGrid({ addons }: { addons: Addon[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {addons.map((a) => (
        <li key={a.id} className="reveal flex items-center gap-4 rounded-2xl border border-line bg-surface p-3">
          <Photo src={a.image} alt={a.name} ratio="square" className="w-20 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <h3 className="font-semibold">{a.name}</h3>
            <p className="mt-0.5 font-mono text-sm tabular-nums text-accent">+{formatVND(a.price)}</p>
            {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
