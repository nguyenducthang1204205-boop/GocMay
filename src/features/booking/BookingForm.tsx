"use client";

import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES, type Province, type Settings } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { buildBookingMessage } from "./message";
import { useClipboard } from "./useClipboard";

const BOOKABLE = CATEGORIES.filter((c) => c !== "Nhận đi tỉnh");

export type BookingFormProps = {
  settings: Settings;
  provinces: Province[];
  /** Nhắn cho photographer cụ thể. Bỏ trống → hiện ô chọn photographer. */
  recipient?: string;
  /** Danh sách tên photographer để chọn (trang Liên hệ) */
  photographerNames?: string[];
  /** Liên hệ riêng của photographer — ô nào trống thì dùng liên hệ của studio */
  direct?: DirectContact;
  /** Ngày chụp điền sẵn ("YYYY-MM-DD") — VD: khách bấm vào ngày trống trên lịch */
  initialDate?: string;
};

export type DirectContact = { zalo: string; messenger: string; zaloQr: string };

/** Form vài ô → soạn sẵn tin nhắn → copy và mở Zalo/Messenger. */
export function BookingForm({
  settings,
  provinces,
  recipient,
  photographerNames = [],
  direct,
  initialDate,
}: BookingFormProps) {
  const id = useId();
  const [form, setForm] = useState({
    who: recipient ?? "",
    kind: BOOKABLE[0] as string,
    date: initialDate ?? "",
    people: "1",
    place: provinces[0]?.name ?? settings.city,
    school: "",
    note: "",
  });
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const message = buildBookingMessage({ brand: settings.name, recipient: form.who || undefined, ...form });
  const { copied, copy } = useClipboard();

  const send = async (url: string) => {
    await copy(message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Photographer có QR mà không có link Zalo → cho quét QR thay vì mở Zalo của studio
  const showQr = !!direct?.zaloQr && !direct.zalo;
  const channels = [
    { key: "zalo", label: "Copy & mở Zalo", url: showQr ? "" : direct?.zalo || settings.zalo, variant: "primary" as const },
    { key: "messenger", label: "Copy & mở Messenger", url: direct?.messenger || settings.messenger, variant: "outline" as const },
  ].filter((c) => c.url);
  const toPhotographer = !!(direct?.zalo || direct?.messenger || direct?.zaloQr);

  return (
    <div className="text-ink">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {!recipient && photographerNames.length > 0 && (
          <Field label="Photographer" htmlFor={`${id}-who`} className="col-span-2">
            <Select id={`${id}-who`} value={form.who} onChange={set("who")}>
              <option value="">Chưa chọn — nhờ studio tư vấn</option>
              {photographerNames.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Loại chụp" htmlFor={`${id}-kind`} className="col-span-2 sm:col-span-1">
          <Select id={`${id}-kind`} value={form.kind} onChange={set("kind")}>
            {BOOKABLE.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Ngày chụp" htmlFor={`${id}-date`} className="col-span-2 sm:col-span-1">
          <input id={`${id}-date`} type="date" value={form.date} onChange={set("date")} className={inputClass} />
        </Field>
        <Field label="Số người" htmlFor={`${id}-people`}>
          <input
            id={`${id}-people`}
            type="number"
            inputMode="numeric"
            min={1}
            value={form.people}
            onChange={set("people")}
            className={inputClass}
          />
        </Field>
        <Field label="Khu vực" htmlFor={`${id}-place`}>
          <Select id={`${id}-place`} value={form.place} onChange={set("place")}>
            {provinces.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Trường / địa điểm" optional htmlFor={`${id}-school`} className="col-span-2">
          <input id={`${id}-school`} value={form.school} onChange={set("school")} placeholder="VD: ĐH Ngoại thương" className={inputClass} />
        </Field>
        <Field label="Ghi chú" optional htmlFor={`${id}-note`} className="col-span-2">
          <textarea
            id={`${id}-note`}
            value={form.note}
            onChange={set("note")}
            rows={2}
            placeholder="Concept, khung giờ mong muốn…"
            className={cn(inputClass, "min-h-20 resize-none py-3")}
          />
        </Field>
      </div>

      <div className="mt-6 rounded-2xl border border-accent/25 bg-accent-soft/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Xem trước tin nhắn</p>
          <button
            type="button"
            onClick={() => copy(message)}
            className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-ink hover:border-ink"
          >
            <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
            {copied ? "Đã copy" : "Copy"}
          </button>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{message}</pre>
      </div>

      {showQr && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line-strong bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={direct!.zaloQr} alt={`Mã QR Zalo của ${recipient}`} className="h-32 w-32 shrink-0 rounded-xl object-contain" />
          <div className="min-w-0">
            <p className="font-semibold">Quét mã Zalo của {recipient}</p>
            <p className="mt-1 text-sm text-muted">Mở Zalo → Quét mã QR, rồi dán tin nhắn đã copy.</p>
            <Button size="sm" variant="outline" className="mt-3" iconLeft={copied ? "check" : "copy"} onClick={() => copy(message)}>
              {copied ? "Đã copy tin nhắn" : "Copy tin nhắn"}
            </Button>
          </div>
        </div>
      )}

      <div className={cn("mt-4 grid gap-2", channels.length > 1 && "sm:grid-cols-2")}>
        {channels.map((c) => (
          <Button key={c.key} variant={c.variant} block iconLeft="message" onClick={() => send(c.url)}>
            {c.label}
          </Button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted" aria-live="polite">
        {copied
          ? "✓ Đã copy tin nhắn — dán vào khung chat là xong."
          : recipient && toPhotographer
            ? `Tin nhắn gửi thẳng tới ${recipient}. ${settings.depositPolicy}`
            : settings.depositPolicy}
      </p>
    </div>
  );
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] font-medium text-ink shadow-[0_1px_2px_rgb(20_19_16/0.06)] outline-none transition placeholder:font-normal placeholder:text-muted/70 hover:border-ink/40 focus:border-ink focus:ring-4 focus:ring-ink/10 focus-visible:outline-none";

function Field({
  label,
  htmlFor,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label} {optional && <span className="font-normal text-muted">(không bắt buộc)</span>}
      </label>
      {children}
    </div>
  );
}

function Select(props: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={cn(inputClass, "cursor-pointer appearance-none pr-10")} />
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
    </div>
  );
}
