import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { FAQ, PROCESS_STEPS } from "@/config/copy";
import { BookingForm } from "@/features/booking/BookingForm";
import { getPhotographers, getProvinces, getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Đặt lịch",
  description: "Soạn sẵn tin nhắn đặt lịch, gửi qua Zalo hoặc Messenger — photographer xác nhận lịch và báo giá.",
};

export default async function ContactPage() {
  const [settings, provinces, photographers] = await Promise.all([getSettings(), getProvinces(), getPhotographers()]);

  const channels: { href: string; label: string; hint: string; icon: IconName }[] = [
    { href: settings.zalo, label: "Zalo", hint: "Phản hồi nhanh nhất", icon: "message" },
    { href: settings.messenger, label: "Messenger", hint: "Nhắn qua Facebook", icon: "message" },
    { href: settings.instagram, label: "Instagram", hint: "Xem ảnh mới nhất", icon: "instagram" },
  ].filter((c) => c.href) as { href: string; label: string; hint: string; icon: IconName }[];

  return (
    <>
      <PageHeader
        eyebrow="Đặt lịch"
        title={
          <>
            Kể cho chúng mình <em className="text-accent">về buổi chụp</em>
          </>
        }
        description="Điền vài thông tin — web soạn sẵn tin nhắn. Bạn chỉ cần dán vào Zalo hoặc Messenger và gửi."
      />

      <Container className="pb-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="rounded-[28px] border border-line bg-surface p-5 sm:p-8 lg:col-span-7">
            <h2 className="mb-6 font-serif text-3xl">Soạn tin nhắn</h2>
            <BookingForm settings={settings} provinces={provinces} photographerNames={photographers.map((p) => p.name)} />
          </div>

          <aside className="space-y-10 lg:col-span-5">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Hoặc nhắn trực tiếp</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {channels.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-18 items-center gap-4 py-4"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sunken transition-colors group-hover:bg-ink group-hover:text-canvas">
                        <Icon name={c.icon} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-serif text-2xl leading-tight">{c.label}</span>
                        <span className="block text-sm text-muted">{c.hint}</span>
                      </span>
                      <Icon name="arrowUpRight" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Sau khi bạn nhắn</h2>
              <ol className="mt-4 space-y-5">
                {PROCESS_STEPS.slice(1).map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-2">
                    <span className="font-serif text-2xl leading-none text-ink/25">{String(i + 2).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-semibold">{s.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">{s.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {settings.depositPolicy && (
              <p className="rounded-2xl bg-sunken p-5 text-sm leading-relaxed">
                <b>Chính sách cọc:</b> {settings.depositPolicy}
              </p>
            )}
          </aside>
        </div>
      </Container>

      <Section tone="surface" labelledBy="faq-title">
        <Container size="narrow">
          <SectionHeader id="faq-title" eyebrow="Câu hỏi thường gặp" title="Trước khi bạn nhắn" />
          <div className="border-t border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-line">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-xl md:text-2xl [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Icon name="chevronDown" className="transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="max-w-2xl pb-6 leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
