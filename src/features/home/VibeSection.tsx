import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { Photo } from "@/components/ui/Photo";
import { photographersFiltered } from "@/config/site";
import { type Photographer, VIBES, type Vibe } from "@/lib/constants";

/** Lối tắt vào danh sách đã lọc sẵn theo vibe màu ảnh. */
export function VibeSection({
  photographers,
  covers,
}: {
  photographers: Photographer[];
  /** Ảnh bìa từng vibe (quản trị chọn, hoặc tự lấy — xem homeMedia.ts) */
  covers: Partial<Record<Vibe, string>>;
}) {
  const vibes = VIBES.map((vibe) => ({
    vibe,
    count: photographers.filter((p) => p.vibes.includes(vibe)).length,
    cover: covers[vibe],
  })).filter((v) => v.count > 0);

  if (!vibes.length) return null;

  return (
    <Section labelledBy="vibe-title">
      <Container>
        <SectionHeader
          id="vibe-title"
          index="02"
          eyebrow="Tìm theo vibe"
          title={
            <>
              Bạn thích màu ảnh <em className="text-accent">thế nào?</em>
            </>
          }
          description="Chọn một vibe — web lọc sẵn những photographer chụp đúng màu đó."
        />
        <ul className="reveal grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {vibes.map(({ vibe, count, cover }) => (
            <li key={vibe}>
              <Link
                href={photographersFiltered({ vibe })}
                className="group relative block h-full overflow-hidden rounded-2xl md:rounded-3xl"
              >
                <Photo
                  src={cover}
                  alt=""
                  ratio="landscape"
                  imgClassName="transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink/75 via-ink/10 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-canvas sm:inset-x-6 sm:bottom-5">
                  <div>
                    <p className="font-serif text-xl leading-none sm:text-3xl md:text-4xl">{vibe}</p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-canvas/75">
                      {count} photographer
                    </p>
                  </div>
                  <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-canvas/40 transition group-hover:bg-canvas group-hover:text-ink sm:grid">
                    <Icon name="arrowUpRight" className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
