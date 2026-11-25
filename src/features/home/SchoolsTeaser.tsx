import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { Photo } from "@/components/ui/Photo";
import { routes } from "@/config/site";
import type { School } from "@/lib/constants";

/** Danh sách trường dạng "mục lục tạp chí" trên nền tối. */
export function SchoolsTeaser({ schools }: { schools: School[] }) {
  if (!schools.length) return null;
  const list = schools.slice(0, 6);

  return (
    <Section tone="ink" labelledBy="schools-title">
      <Container>
        <SectionHeader
          id="schools-title"
          index="03"
          eyebrow="Chọn trường"
          title={
            <>
              Ảnh thật <em className="text-accent-bright">tại trường bạn</em>
            </>
          }
          description="Xem bộ ảnh đã chụp ở từng trường để hình dung góc máy, ánh sáng — và biết photographer nào rành địa điểm đó."
          action={
            <ButtonLink href={routes.schools} variant="outline-inverse" icon="arrowRight">
              Tất cả {schools.length} trường
            </ButtonLink>
          }
        />
        <ul className="reveal border-t border-canvas/15">
          {list.map((s, i) => (
            <li key={s.slug} className="border-b border-canvas/15">
              <Link
                href={routes.school(s.slug)}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:gap-8 md:py-7"
              >
                <span className="w-8 font-mono text-xs text-canvas/50">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate font-serif text-2xl transition-transform duration-500 ease-(--ease-out-expo) group-hover:translate-x-2 sm:text-3xl md:text-4xl">
                    {s.name}
                  </span>
                  <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-canvas/55">
                    {s.short && `${s.short} · `}
                    {s.type} · {s.photos.length} ảnh
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="hidden gap-2 md:flex" aria-hidden>
                    {s.photos.slice(0, 3).map((src) => (
                      <Photo
                        key={src}
                        src={src}
                        alt=""
                        ratio="tall"
                        className="w-14 rounded-lg opacity-70 transition duration-500 group-hover:opacity-100"
                      />
                    ))}
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-canvas/25 transition group-hover:bg-canvas group-hover:text-ink">
                    <Icon name="arrowUpRight" className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
