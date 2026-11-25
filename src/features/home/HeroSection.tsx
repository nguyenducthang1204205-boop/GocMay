import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container, Eyebrow } from "@/components/ui/Layout";
import { Photo } from "@/components/ui/Photo";
import { Label, Tag } from "@/components/ui/Tag";
import { routes } from "@/config/site";
import { type Settings, formatVND } from "@/lib/constants";
import type { HeroItem } from "./homeMedia";

type Stats = { total: number; available: number; sessions: number; minPrice: number; rating: number };

export function HeroSection({
  settings,
  stats,
  showcase,
}: {
  settings: Settings;
  stats: Stats;
  /** Tối đa 4 ảnh dựng collage (quản trị chọn, hoặc tự lấy — xem homeMedia.ts) */
  showcase: HeroItem[];
}) {
  const [a, b, c, d] = showcase;

  return (
    <section aria-labelledby="hero-title" className="overflow-hidden pb-16 pt-8 md:pb-24 md:pt-14">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Chữ */}
          <div className="lg:col-span-7">
            <Eyebrow index="Est.">Kỷ yếu · Chụp nhóm · Chụp cá nhân — {settings.city}</Eyebrow>
            <h1
              id="hero-title"
              className="mt-7 font-serif text-[clamp(2.9rem,7.2vw,6.6rem)] leading-[0.95] tracking-[-0.03em] text-balance"
            >
              Chọn người chụp <em className="whitespace-nowrap text-accent">hợp gu</em> trước khi đặt lịch.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              Không cần đặt cả ekip rồi mới biết ai sẽ chụp mình. Xem portfolio, màu ảnh và giá của từng photographer —
              rồi nhắn thẳng cho người bạn thích.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={routes.photographers} size="lg" icon="arrowRight">
                Xem {stats.total} photographer
              </ButtonLink>
              <ButtonLink href={routes.pricing} size="lg" variant="outline">
                Bảng giá & phụ phí tỉnh
              </ButtonLink>
            </div>
            <Link
              href={routes.schools}
              className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <Icon name="mapPin" className="h-4 w-4" />
              Xem ảnh thật tại trường của bạn
              <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Collage ảnh */}
          {a && (
            <div className="relative lg:col-span-5">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 pt-12 sm:space-y-4">
                  <HeroPhoto item={a} priority />
                  {c && <HeroPhoto item={c} />}
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {b && <HeroPhoto item={b} priority />}
                  {d && <HeroPhoto item={d} />}
                </div>
              </div>
              {/* Thẻ đánh giá nổi */}
              <div className="absolute -left-2 bottom-10 hidden rounded-2xl border border-line bg-surface/95 p-4 shadow-[0_20px_50px_-20px_rgb(20_19_16/0.35)] backdrop-blur sm:block lg:-left-10">
                <p className="flex items-center gap-1 text-accent" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="star" filled className="h-3.5 w-3.5" />
                  ))}
                </p>
                <p className="mt-2 font-serif text-3xl leading-none">{stats.rating.toFixed(1)}/5</p>
                <p className="mt-1 text-xs text-muted">từ {stats.sessions.toLocaleString("vi-VN")} buổi chụp</p>
              </div>
            </div>
          )}
        </div>

        {/* Số liệu */}
        <dl className="mt-20 grid grid-cols-2 gap-px overflow-hidden border-y border-line bg-line md:mt-28 md:grid-cols-4">
          {[
            { label: "Photographer đang nhận lịch", value: stats.available },
            { label: "Buổi chụp đã hoàn thành", value: stats.sessions.toLocaleString("vi-VN") },
            { label: "Giá khởi điểm / buổi", value: formatVND(stats.minPrice) },
            { label: "Đánh giá trung bình", value: `${stats.rating.toFixed(1)}★` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-2 bg-canvas px-1 py-7 sm:px-6">
              <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">{s.label}</dt>
              <dd className="font-serif text-3xl tabular-nums tracking-tight md:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function HeroPhoto({ item, priority }: { item: HeroItem; priority?: boolean }) {
  const photo = (
    <Photo
      src={item.src}
      alt={item.name ? `Ảnh của photographer ${item.name}` : ""}
      ratio="tall"
      priority={priority}
      sizes="(min-width: 1024px) 20vw, 45vw"
      imgClassName="transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-105"
    />
  );
  const box = "group relative block overflow-hidden rounded-2xl md:rounded-3xl";
  // Ảnh không gắn photographer: chỉ để trang trí, không bấm được
  if (!item.href) return <div className={box}>{photo}</div>;
  return (
    <Link href={item.href} className={box}>
      {photo}
      <Tag tone="glass" className="absolute bottom-3 left-3">
        <Label>{item.name}</Label>
        {item.vibe && <span className="text-muted">· {item.vibe}</span>}
      </Tag>
    </Link>
  );
}
