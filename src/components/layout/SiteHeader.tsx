"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { BOOKING_CTA, MAIN_NAV, routes } from "@/config/site";
import type { Settings } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

export function SiteHeader({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-b border-line/80 bg-canvas/80 backdrop-blur-xl" : "border-b border-transparent bg-canvas",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
      >
        Bỏ qua menu
      </a>
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-6 px-4 sm:px-6 md:h-20 lg:px-10">
        <Brand settings={settings} />

        <nav aria-label="Chính" className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-[15px] font-medium transition-colors",
                isActive(item.href) ? "text-ink" : "text-ink/65 hover:text-ink",
              )}
            >
              {item.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-4 -bottom-0.5 h-px origin-left bg-ink transition-transform duration-300 ease-(--ease-out-expo)",
                  isActive(item.href) ? "scale-x-100" : "scale-x-0",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ButtonLink href={BOOKING_CTA.href} size="sm" icon="arrowRight">
              {BOOKING_CTA.label}
            </ButtonLink>
          </div>
          <button
            type="button"
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-line bg-surface md:hidden"
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} variant="fullscreen" label="Menu">
        <div className="grain flex h-full flex-col px-4 pb-8 pt-3 sm:px-6">
          <div className="flex h-13 items-center justify-between">
            <Brand settings={settings} inverse onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              aria-label="Đóng menu"
              autoFocus
              onClick={() => setMenuOpen(false)}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-canvas/25"
            >
              <Icon name="close" />
            </button>
          </div>
          <nav aria-label="Chính" className="mt-12 flex flex-col">
            {[{ href: routes.home, label: "Trang chủ" }, ...MAIN_NAV].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-baseline gap-4 border-b border-canvas/10 py-5 font-serif text-4xl"
              >
                <span className="font-mono text-xs text-canvas/50">0{i + 1}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-4">
            <ButtonLink href={BOOKING_CTA.href} variant="inverse" size="lg" block icon="arrowRight" onClick={() => setMenuOpen(false)}>
              {BOOKING_CTA.label}
            </ButtonLink>
            <p className="text-center text-sm text-canvas/60">{settings.tagline}</p>
          </div>
        </div>
      </Dialog>
    </header>
  );
}

function Brand({ settings, inverse, onNavigate }: { settings: Settings; inverse?: boolean; onNavigate?: () => void }) {
  return (
    <Link href={routes.home} onClick={onNavigate} className="flex items-center gap-3" aria-label={`${settings.name} — Trang chủ`}>
      <Logo className="h-9 w-9 md:h-10 md:w-10" inverse={inverse} />
      <span className="leading-none">
        <span className="block font-serif text-xl font-semibold tracking-tight">{settings.name}</span>
        <span className={cn("mt-1 hidden font-mono text-[10px] uppercase tracking-[0.2em] sm:block", inverse ? "text-canvas/60" : "text-muted")}>
          {settings.tagline}
        </span>
      </span>
    </Link>
  );
}
