"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { type Addon, type Province, type Tier, formatVND } from "@/lib/constants";
import { cn } from "@/lib/cn";

/**
 * Ước tính chi phí: giá hạng + phụ phí tỉnh + đồ bán kèm, chia theo đầu người.
 * Chỉ để khách hình dung ngân sách — giá chốt do photographer báo.
 */
export function CostEstimator({ tiers, provinces, addons }: { tiers: Tier[]; provinces: Province[]; addons: Addon[] }) {
  const id = useId();
  const [tierKey, setTierKey] = useState(tiers[Math.min(1, tiers.length - 1)]?.key ?? "");
  const [provinceId, setProvinceId] = useState(provinces[0]?.id ?? 0);
  const [people, setPeople] = useState(5);
  const [picked, setPicked] = useState<number[]>([]);

  const tier = tiers.find((t) => t.key === tierKey);
  const province = provinces.find((p) => p.id === provinceId);
  const addonTotal = addons.filter((a) => picked.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const total = (tier?.priceFrom ?? 0) + (province?.fee ?? 0) + addonTotal;
  const perPerson = Math.ceil(total / Math.max(people, 1) / 1000) * 1000;

  const rows = [
    { label: `Hạng ${tier?.label ?? ""}`, value: tier?.priceFrom ?? 0 },
    { label: `Phụ phí ${province?.name ?? ""}`, value: province?.fee ?? 0 },
    ...(addonTotal ? [{ label: "Đồ bán kèm", value: addonTotal }] : []),
  ];

  const select =
    "min-h-12 w-full cursor-pointer appearance-none rounded-xl border border-canvas/20 bg-canvas/5 px-3.5 pr-10 text-[15px] text-canvas outline-none transition focus:border-canvas [&>option]:text-ink";

  if (!tiers.length) return null;

  return (
    <div className="grain grid overflow-hidden rounded-[28px] bg-ink text-canvas lg:grid-cols-5">
      <div className="space-y-6 p-6 sm:p-8 lg:col-span-3 lg:p-10">
        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/60">Hạng photographer</legend>
          <div className="flex flex-wrap gap-2">
            {tiers.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={t.key === tierKey}
                onClick={() => setTierKey(t.key)}
                className={cn(
                  "min-h-11 cursor-pointer rounded-full border px-5 text-sm font-semibold transition",
                  t.key === tierKey ? "border-canvas bg-canvas text-ink" : "border-canvas/25 hover:border-canvas",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-place`} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/60">
              Địa điểm
            </label>
            <div className="relative">
              <select id={`${id}-place`} value={provinceId} onChange={(e) => setProvinceId(Number(e.target.value))} className={select}>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-people`} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/60">
              Số người: <span className="text-canvas">{people}</span>
            </label>
            <input
              id={`${id}-people`}
              type="range"
              min={1}
              max={45}
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              className="h-12 w-full cursor-pointer accent-accent-bright"
            />
          </div>
        </div>

        {addons.length > 0 && (
          <fieldset>
            <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/60">Thêm đồ bán kèm</legend>
            <div className="flex flex-wrap gap-2">
              {addons.map((a) => {
                const on = picked.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPicked((list) => (on ? list.filter((x) => x !== a.id) : [...list, a.id]))}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition",
                      on ? "border-accent-bright bg-accent-bright/15" : "border-canvas/25 hover:border-canvas",
                    )}
                  >
                    <Icon name={on ? "check" : "sparkle"} className="h-4 w-4" />
                    {a.name}
                    <span className="text-canvas/60">+{formatVND(a.price)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>

      <div className="flex flex-col justify-between gap-8 border-t border-canvas/15 p-6 sm:p-8 lg:col-span-2 lg:border-l lg:border-t-0 lg:p-10">
        <dl className="space-y-3 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4">
              <dt className="text-canvas/70">{r.label}</dt>
              <dd className="tabular-nums">{r.value ? formatVND(r.value) : "Miễn phí"}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-canvas/15 pt-3 font-semibold">
            <dt>Tổng ước tính</dt>
            <dd className="tabular-nums">{formatVND(total)}</dd>
          </div>
        </dl>
        <div aria-live="polite">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/60">Mỗi người góp khoảng</p>
          <p className="mt-2 font-serif text-5xl tabular-nums tracking-tight md:text-6xl">{formatVND(perPerson)}</p>
          <p className="mt-3 text-xs leading-relaxed text-canvas/55">
            Giá khởi điểm để tham khảo. Photographer báo giá chốt theo concept và thời lượng thực tế.
          </p>
        </div>
      </div>
    </div>
  );
}
