import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhotoGrid } from "@/components/media/PhotoGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { Label, Tag } from "@/components/ui/Tag";
import { routes } from "@/config/site";
import { BookingDialogButton } from "@/features/booking/BookingDialogButton";
import { findSimilar } from "@/features/photographers/filters";
import { AvailabilityCalendar } from "@/features/photographers/AvailabilityCalendar";
import { DirectContactCard } from "@/features/photographers/DirectContactCard";
import { AvailabilityTag } from "@/features/photographers/PhotographerCard";
import { PhotographerGrid } from "@/features/photographers/PhotographerGrid";
import { todayVN } from "@/lib/availability";
import { SERVICES, formatVND } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { getPhotographer, getPhotographers, getProvinces, getSettings, getTiers } from "@/lib/content";

// Dựng lại trang mỗi giờ để nhãn lịch ("Còn lịch hôm nay"…) luôn theo đúng ngày
export const revalidate = 3600;

export async function generateStaticParams() {
  const list = await getPhotographers();
  return list.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/photographer/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getPhotographer(slug);
  if (!p) return {};
  return {
    title: `${p.name} — Photographer ${p.city}`,
    description: p.bio,
    openGraph: { images: p.photos[0] ? [p.photos[0]] : undefined },
  };
}

export default function PhotographerPage(props: PageProps<"/photographer/[slug]">) {
  // Đọc params bên trong Suspense để khung trang hiện ngay khi chuyển trang
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PhotographerDetail params={props.params} />
    </Suspense>
  );
}

async function PhotographerDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPhotographer(slug);
  if (!p) notFound();

  const [all, tiers, provinces, settings] = await Promise.all([
    getPhotographers(),
    getTiers(),
    getProvinces(),
    getSettings(),
  ]);
  const tierLabels = Object.fromEntries(tiers.map((t) => [t.key, t.label]));
  const tier = tiers.find((t) => t.key === p.tier) ?? { label: p.tier, description: "" };
  const similar = findSimilar(all, p);
  const booking = {
    settings,
    provinces,
    recipient: p.name,
    direct: { zalo: p.zalo, messenger: p.messenger, zaloQr: p.zaloQr },
  };

  return (
    <div>
      <Container className="pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
          <ol className="flex items-center gap-2">
            <li>
              <Link href={routes.photographers} className="hover:text-ink">
                Chọn Photo
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {p.name}
            </li>
          </ol>
        </nav>

        {/* Tên + thông tin nhanh */}
        <header className="mt-8 flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="accent">
                <Label>Hạng {tier.label}</Label>
              </Tag>
              <AvailabilityTag p={p} tone="neutral" />
            </div>
            <h1 className="mt-5 font-serif text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.9] tracking-[-0.04em]">{p.name}</h1>
          </div>
          <dl className="flex gap-8 md:gap-10">
            {[
              { label: "Đánh giá", value: `${p.rating.toFixed(1)}★` },
              { label: "Buổi đã chụp", value: p.sessions },
              { label: "Khu vực", value: p.city },
            ].map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-1">
                <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">{s.label}</dt>
                <dd className="font-serif text-2xl tabular-nums md:text-3xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Portfolio */}
          <div className="lg:col-span-7 xl:col-span-8">
            <PhotoGrid photos={p.photos} title={`Portfolio ${p.name}`} priorityCount={3} />
            <div className="mt-8">
              <AvailabilityCalendar {...booking} bookedDates={p.bookedDates} serverToday={todayVN()} />
            </div>
            {p.albumUrl && (
              <ButtonLink href={p.albumUrl} variant="outline" block className="mt-6" icon="arrowUpRight">
                Xem album đầy đủ của {p.name}
              </ButtonLink>
            )}
          </div>

          {/* Thông tin + đặt lịch */}
          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="space-y-8 lg:sticky lg:top-28">
              <p className="font-serif text-2xl leading-snug">“{p.bio}”</p>

              <div className="flex flex-wrap gap-1.5">
                {p.vibes.map((v) => (
                  <Tag key={v} tone="soft">
                    {v}
                  </Tag>
                ))}
                {p.categories.map((c) => (
                  <Tag key={c}>{c}</Tag>
                ))}
              </div>

              <div className="rounded-3xl bg-ink p-6 text-canvas">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/60">Giá khởi điểm / buổi</p>
                <p className="mt-2 font-serif text-4xl tabular-nums">{formatVND(p.priceFrom)}</p>
                <p className="mt-2 text-sm text-canvas/65">
                  Báo giá chính xác theo số người, địa điểm và concept khi bạn nhắn.
                </p>
                <BookingDialogButton {...booking} label={`Nhắn cho ${p.name}`} variant="inverse" block className="mt-6" />
              </div>

              <DirectContactCard p={p} />

              <div>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Dịch vụ đi kèm</h2>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {SERVICES.map((s) => {
                    const has = p.services[s.key];
                    return (
                      <li key={s.key} className="flex items-center justify-between gap-3 py-3.5 text-[15px]">
                        <span className={cn(!has && "text-muted line-through decoration-line-strong")}>{s.label}</span>
                        <Icon
                          name={has ? "check" : "minus"}
                          className={cn("h-4 w-4", has ? "text-positive" : "text-muted")}
                          label={has ? "Có sẵn trong gói" : "Không có"}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>

              {tier.description && (
                <p className="rounded-2xl bg-sunken p-5 text-sm leading-relaxed">
                  <b>Hạng {tier.label}:</b> {tier.description}
                </p>
              )}
            </div>
          </aside>
        </div>
      </Container>

      {similar.length > 0 && (
        <Section tone="surface" className="mt-24" labelledBy="similar-title">
          <Container>
            <SectionHeader
              id="similar-title"
              eyebrow="Có thể bạn cũng thích"
              title={
                <>
                  Cùng vibe với <em className="text-accent">{p.name}</em>
                </>
              }
            />
            <PhotographerGrid photographers={similar} tierLabels={tierLabels} />
          </Container>
        </Section>
      )}

      {/* Thanh đặt lịch dính đáy màn hình trên điện thoại */}
      <div className="sticky bottom-0 z-30 border-t border-line bg-canvas/90 backdrop-blur-xl lg:hidden">
        <Container className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Từ</p>
            <p className="font-serif text-xl leading-tight tabular-nums">{formatVND(p.priceFrom)}</p>
          </div>
          <BookingDialogButton {...booking} label="Đặt lịch" size="md" />
        </Container>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Container className="animate-pulse pt-10">
      <span className="sr-only">Đang tải…</span>
      <div className="h-3 w-40 rounded bg-sunken" />
      <div className="mt-10 h-24 w-72 rounded-xl bg-sunken" />
      <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="col-span-2 row-span-2 aspect-[3/4] rounded-2xl bg-sunken" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-sunken" />
        ))}
      </div>
    </Container>
  );
}
