import { ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { routes } from "@/config/site";
import { PhotographerGrid } from "@/features/photographers/PhotographerGrid";
import type { Photographer } from "@/lib/constants";

export function FeaturedSection({
  photographers,
  total,
  tierLabels,
}: {
  photographers: Photographer[];
  total: number;
  tierLabels: Record<string, string>;
}) {
  if (!photographers.length) return null;
  return (
    <Section tone="surface" labelledBy="featured-title">
      <Container>
        <SectionHeader
          id="featured-title"
          index="01"
          eyebrow="Photographer nổi bật"
          title={
            <>
              Những người chụp <em className="text-accent">được chọn nhiều</em>
            </>
          }
          description="Mỗi photographer một màu ảnh riêng. Rê chuột lên thẻ để xem thêm một khung hình."
          action={
            <ButtonLink href={routes.photographers} variant="outline" icon="arrowRight">
              Xem tất cả {total}
            </ButtonLink>
          }
        />
        <PhotographerGrid photographers={photographers} tierLabels={tierLabels} className="reveal" />
      </Container>
    </Section>
  );
}
