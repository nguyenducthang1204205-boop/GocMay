import { ButtonLink } from "@/components/ui/Button";
import { Container, Eyebrow } from "@/components/ui/Layout";
import { routes } from "@/config/site";

/** Lời kêu gọi cuối trang — dùng ở trang chủ và các trang cần chốt đơn. */
export function FinalCta({
  title = (
    <>
      Chốt người chụp, chốt ngày, <em className="text-accent-bright">xong.</em>
    </>
  ),
  description = "Chọn photographer hợp gu, nhắn ngày bạn muốn và số người — photographer báo giá chính xác và giữ lịch cho bạn.",
}: {
  title?: React.ReactNode;
  description?: string;
}) {
  return (
    <section aria-labelledby="cta-title" className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="grain overflow-hidden rounded-[32px] bg-ink text-canvas">
        <Container className="py-24 text-center md:py-36">
          <Eyebrow className="justify-center">Sẵn sàng?</Eyebrow>
          <h2
            id="cta-title"
            className="reveal mx-auto mt-7 max-w-4xl font-serif text-[clamp(2.6rem,6.5vw,5.75rem)] leading-[0.98] tracking-[-0.03em] text-balance"
          >
            {title}
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-canvas/70">{description}</p>
          <div className="mt-11 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={routes.contact} variant="inverse" size="lg" icon="arrowRight">
              Nhắn studio ngay
            </ButtonLink>
            <ButtonLink href={routes.photographers} variant="outline-inverse" size="lg">
              Xem photographer trước đã
            </ButtonLink>
          </div>
        </Container>
      </div>
    </section>
  );
}
