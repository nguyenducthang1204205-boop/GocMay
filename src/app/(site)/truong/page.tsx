import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGrid } from "@/components/media/PhotoGrid";
import { Container } from "@/components/ui/Layout";
import { PageHeader, PageTabs, QuickStats } from "@/components/ui/PageHeader";
import { Photo } from "@/components/ui/Photo";
import { Label } from "@/components/ui/Tag";
import { DISCOVER_TABS, routes } from "@/config/site";
import { FinalCta } from "@/features/home/FinalCta";
import { SCHOOL_TYPES } from "@/lib/constants";
import { getPhotographers, getSchools } from "@/lib/content";

export const metadata: Metadata = {
  title: "Chọn trường",
  description: "Xem ảnh thật đã chụp tại trường của bạn và photographer đã chụp ở đó.",
};

export default async function SchoolsPage() {
  const [schools, photographers] = await Promise.all([getSchools(), getPhotographers()]);
  const bySlug = new Map(photographers.map((p) => [p.slug, p]));
  const groups = [...SCHOOL_TYPES, ""]
    .map((type) => ({
      type: type || "Khác",
      items: schools.filter((s) => (type ? s.type === type : !SCHOOL_TYPES.includes(s.type as never))),
    }))
    .filter((g) => g.items.length);

  return (
    <>
      <PageHeader
        tabs={<PageTabs items={DISCOVER_TABS} current={routes.schools} />}
        eyebrow="Ảnh thật tại trường"
        title={
          <>
            Chụp ở trường bạn <em className="text-accent">trông thế nào?</em>
          </>
        }
        description="Xem bộ ảnh đã chụp ở từng trường để hình dung góc máy, ánh sáng — và biết photographer nào rành địa điểm đó."
        aside={
          <QuickStats
            items={[
              { label: "Trường", value: schools.length },
              { label: "Ảnh thật", value: schools.reduce((n, s) => n + s.photos.length, 0) },
            ]}
          />
        }
      />

      {schools.length === 0 ? (
        <Container className="pb-24">
          <p className="rounded-3xl border border-dashed border-line-strong p-12 text-center text-muted">
            Chưa có trường nào. Thêm trường trong trang quản trị.
          </p>
        </Container>
      ) : (
        <>
          {/* Mục lục dính đầu trang */}
          <nav aria-label="Danh sách trường" className="sticky top-16 z-20 border-y border-line bg-canvas/90 backdrop-blur-xl md:top-20">
            <Container>
              <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                {groups.map((g, gi) => (
                  <div key={g.type} className="flex shrink-0 items-center gap-2">
                    <Label className="pr-1 text-muted">{g.type}</Label>
                    {g.items.map((s) => (
                      <a
                        key={s.slug}
                        href={`#${s.slug}`}
                        className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-line bg-surface px-4 text-sm transition-colors hover:border-ink"
                      >
                        {s.short || s.name}
                      </a>
                    ))}
                    {gi < groups.length - 1 && <span aria-hidden className="mx-2 h-5 w-px bg-line" />}
                  </div>
                ))}
              </div>
            </Container>
          </nav>

          <Container className="pb-24">
            {schools.map((s, i) => {
              const shooters = s.photographers.map((slug) => bySlug.get(slug)).filter((p) => p !== undefined);
              return (
                <section key={s.slug} id={s.slug} aria-labelledby={`${s.slug}-title`} className="reveal scroll-mt-40 border-b border-line py-14 md:py-20">
                  <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                      <Label className="text-muted">
                        {String(i + 1).padStart(2, "0")} · {s.type}
                        {s.short && ` · ${s.short}`}
                      </Label>
                      <h2 id={`${s.slug}-title`} className="mt-3 font-serif text-3xl leading-tight tracking-tight md:text-5xl">
                        {s.name}
                      </h2>
                    </div>
                    {shooters.length > 0 && (
                      <div>
                        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">Photographer đã chụp</p>
                        <ul className="flex flex-wrap gap-2">
                          {shooters.map((p) => (
                            <li key={p.slug}>
                              <Link
                                href={routes.photographer(p.slug)}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-4 text-sm font-medium transition-colors hover:border-ink"
                              >
                                <Photo src={p.photos[0]} alt="" ratio="square" className="w-8 rounded-full" />
                                {p.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <PhotoGrid photos={s.photos} title={`Ảnh chụp tại ${s.name}`} layout="strip" />
                </section>
              );
            })}
          </Container>
        </>
      )}

      <FinalCta />
    </>
  );
}
