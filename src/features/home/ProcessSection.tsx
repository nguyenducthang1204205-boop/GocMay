import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { PROCESS_STEPS } from "@/config/copy";

export function ProcessSection() {
  return (
    <Section tone="surface" labelledBy="process-title">
      <Container>
        <SectionHeader
          id="process-title"
          index="05"
          eyebrow="Quy trình"
          title={
            <>
              Giữ lịch trong <em className="text-accent">4 bước</em>
            </>
          }
          description="Từ lúc chọn người chụp đến lúc nhận ảnh — không form dài, không chờ đợi."
        />
        <ol className="reveal grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-ink pt-6">
              <p className="font-serif text-6xl leading-none tracking-tight text-ink/15 md:text-7xl" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">
                <span className="sr-only">Bước {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
