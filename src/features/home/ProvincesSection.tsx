import { ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { Marquee } from "@/components/ui/Marquee";
import { routes } from "@/config/site";
import type { Province } from "@/lib/constants";

export function ProvincesSection({ provinces }: { provinces: Province[] }) {
  if (!provinces.length) return null;
  const names = provinces.map((p) => p.name);
  const half = Math.ceil(names.length / 2);
  const pill = (name: string) => (
    <span className="inline-flex min-h-12 items-center whitespace-nowrap rounded-full border border-line bg-surface px-6 font-serif text-lg">
      {name}
    </span>
  );

  return (
    <Section labelledBy="provinces-title" className="overflow-hidden">
      <Container>
        <SectionHeader
          id="provinces-title"
          index="04"
          eyebrow="Đi tỉnh"
          title={
            <>
              Nhận chụp <em className="text-accent">{provinces.length}+ tỉnh thành</em>
            </>
          }
          description="Phụ phí di chuyển tính theo buổi, không theo đầu người — đặt theo nhóm để chia cho nhẹ."
          action={
            <ButtonLink href={routes.provinceFees} variant="outline" icon="arrowRight">
              Xem bảng phụ phí
            </ButtonLink>
          }
        />
      </Container>
      <div className="reveal flex flex-col gap-3">
        <Marquee items={names.slice(0, half).map(pill)} duration={45} />
        {names.length > half && <Marquee items={names.slice(half).map(pill)} duration={52} reverse />}
      </div>
    </Section>
  );
}
