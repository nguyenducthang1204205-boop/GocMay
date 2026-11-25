import { Icon, type IconName } from "@/components/ui/Icon";
import { contactHandle } from "@/lib/contacts";
import type { Photographer } from "@/lib/constants";

/** Các kênh liên hệ riêng của photographer + mã QR Zalo. Không có gì thì không hiện. */
export function DirectContactCard({ p }: { p: Photographer }) {
  const links: { href: string; label: string; icon: IconName }[] = [
    { href: p.zalo, label: "Zalo", icon: "message" },
    { href: p.messenger, label: "Messenger", icon: "message" },
    { href: p.instagram, label: "Instagram", icon: "instagram" },
  ].filter((l): l is { href: string; label: string; icon: IconName } => !!l.href);

  if (!links.length && !p.zaloQr) return null;

  return (
    <div>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Liên hệ trực tiếp {p.name}</h2>
      {links.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-14 items-center gap-3 py-2.5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sunken transition-colors group-hover:bg-ink group-hover:text-canvas">
                  <Icon name={l.icon} className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{l.label}</span>
                  <span className="block truncate text-sm text-muted">{contactHandle(l.href)}</span>
                </span>
                <Icon name="arrowUpRight" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {p.zaloQr && (
        <a
          href={p.zaloQr}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-4 rounded-2xl border border-line-strong bg-white p-3 transition hover:border-ink"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.zaloQr} alt={`Mã QR Zalo của ${p.name}`} loading="lazy" className="h-24 w-24 shrink-0 rounded-lg object-contain" />
          <span className="text-sm">
            <span className="block font-semibold">Quét mã Zalo</span>
            <span className="mt-0.5 block text-muted">Mở Zalo → Quét mã QR. Bấm để xem ảnh lớn.</span>
          </span>
        </a>
      )}
    </div>
  );
}
