import Link from "next/link";
import { Container } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { BOOKING_CTA, MAIN_NAV, routes } from "@/config/site";
import type { Settings } from "@/lib/constants";
import { Logo } from "./Logo";

export function SiteFooter({ settings }: { settings: Settings }) {
  const socials = [
    { href: settings.zalo, label: "Zalo" },
    { href: settings.messenger, label: "Messenger" },
    { href: settings.instagram, label: "Instagram" },
  ].filter((s) => s.href);

  const linkClass = "inline-flex min-h-9 items-center text-canvas/70 transition-colors hover:text-canvas";

  return (
    <footer className="grain bg-ink text-canvas">
      <Container className="pb-10 pt-20 md:pt-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href={routes.home} className="inline-flex items-center gap-3">
              <Logo className="h-10 w-10" inverse />
              <span className="font-serif text-2xl font-semibold">{settings.name}</span>
            </Link>
            <p className="mt-5 max-w-sm leading-relaxed text-canvas/70">
              {settings.tagline}. Xem portfolio từng photographer, nhắn thẳng người bạn chọn — không qua trung gian.
            </p>
            <Link
              href={BOOKING_CTA.href}
              className="group mt-8 inline-flex items-center gap-2 border-b border-canvas/30 pb-1 font-medium transition-colors hover:border-canvas"
            >
              {BOOKING_CTA.label}
              <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <FooterColumn title="Khám phá" className="md:col-span-2 md:col-start-7">
            {MAIN_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
            <Link href={routes.provinceFees} className={linkClass}>
              Phụ phí đi tỉnh
            </Link>
          </FooterColumn>

          <FooterColumn title="Liên hệ" className="md:col-span-2">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {s.label}
              </a>
            ))}
            <Link href={routes.contact} className={linkClass}>
              Đặt lịch
            </Link>
          </FooterColumn>

          <FooterColumn title="Khu vực" className="md:col-span-2">
            <p className="text-canvas/70">{settings.city}</p>
            <Link href={routes.provinceFees} className={linkClass}>
              Nhận đi tỉnh
            </Link>
          </FooterColumn>
        </div>

        {settings.depositPolicy && (
          <p className="mt-16 max-w-2xl border-l border-canvas/20 pl-4 text-sm leading-relaxed text-canvas/60">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/80">Chính sách cọc · </span>
            {settings.depositPolicy}
          </p>
        )}

        <p
          aria-hidden
          className="mt-16 select-none truncate font-serif text-[18vw] leading-[0.85] tracking-tighter text-canvas/[0.07] md:text-[13vw]"
        >
          {settings.name}
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-canvas/15 pt-6 font-mono text-xs uppercase tracking-[0.15em] text-canvas/55 sm:flex-row sm:justify-between">
          {/* Không dùng new Date() ở đây: trang được prerender tĩnh (cacheComponents) */}
          <p>© {settings.name}. Bảo lưu mọi quyền.</p>
          <p>{settings.city} · Việt Nam</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/50">{title}</h2>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
