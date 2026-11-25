"use client";

// Chọn các ngày ĐÃ CÓ LỊCH: bấm vào ngày để tích/bỏ tích. Ngày đã qua không chọn được.
// Gửi lên server qua ô ẩn name="bookedDates" (JSON).
import { useMemo, useState } from "react";
import {
  type ISODate,
  WEEK_HEADER,
  cleanBookedDates,
  monthGrid,
  monthLabel,
  shiftMonth,
  todayVN,
} from "@/lib/availability";
import { cn } from "@/lib/cn";
import { btnGhost, hint } from "./styles";

const MONTHS_AHEAD = 12;

export function BookedDatesPicker({ initial }: { initial: string[] }) {
  const today = todayVN();
  const [booked, setBooked] = useState<Set<ISODate>>(() => new Set(cleanBookedDates(initial, today)));
  const [y0, m0] = today.split("-").map(Number);
  const [offset, setOffset] = useState(0); // số tháng tính từ tháng này

  const months = [shiftMonth(y0, m0, offset), shiftMonth(y0, m0, offset + 1)];
  const value = useMemo(() => JSON.stringify([...booked].sort()), [booked]);

  const toggle = (d: ISODate) =>
    setBooked((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  /** Tích hoặc bỏ tích cả tháng (chỉ các ngày từ hôm nay) */
  const toggleMonth = (days: ISODate[]) =>
    setBooked((prev) => {
      const future = days.filter((d) => d >= today);
      const allBooked = future.every((d) => prev.has(d));
      const next = new Set(prev);
      future.forEach((d) => (allBooked ? next.delete(d) : next.add(d)));
      return next;
    });

  return (
    <div>
      <input type="hidden" name="bookedDates" value={value} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          Đã tích <b>{booked.size}</b> ngày có lịch
        </p>
        <div className="flex gap-1.5">
          <button type="button" className={`${btnGhost} px-3 py-1.5`} disabled={offset === 0} onClick={() => setOffset((o) => o - 1)}>
            ← Tháng trước
          </button>
          <button
            type="button"
            className={`${btnGhost} px-3 py-1.5`}
            disabled={offset >= MONTHS_AHEAD - 2}
            onClick={() => setOffset((o) => o + 1)}
          >
            Tháng sau →
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {months.map(({ year, month }) => {
          const cells = monthGrid(year, month);
          const days = cells.filter((d): d is ISODate => !!d);
          const future = days.filter((d) => d >= today);
          const allBooked = future.length > 0 && future.every((d) => booked.has(d));
          return (
            <div key={`${year}-${month}`} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{monthLabel(year, month)}</p>
                <button
                  type="button"
                  onClick={() => toggleMonth(days)}
                  disabled={!future.length}
                  className="text-xs font-medium text-accent hover:underline disabled:opacity-40"
                >
                  {allBooked ? "Bỏ tích cả tháng" : "Kín cả tháng"}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEK_HEADER.map((w) => (
                  <span key={w} className="py-1 text-[11px] font-medium text-muted">
                    {w}
                  </span>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <span key={`e${i}`} />;
                  const past = d < today;
                  const on = booked.has(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={past}
                      aria-pressed={on}
                      aria-label={`${d}${on ? " — đã có lịch" : ""}`}
                      onClick={() => toggle(d)}
                      className={cn(
                        "relative grid aspect-square place-items-center rounded-lg text-sm transition",
                        past && "cursor-not-allowed text-muted/40",
                        !past && !on && "hover:bg-sunken",
                        on && "bg-ink font-semibold text-canvas",
                        d === today && !on && "ring-1 ring-ink",
                      )}
                    >
                      {Number(d.slice(8))}
                      {on && <span className="absolute right-1 top-0.5 text-[9px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className={hint}>
        Bấm vào ngày để đánh dấu <b>đã có lịch</b> (ô đen). Ngày không đánh dấu hiện là <b>còn trống</b> cho khách xem. Ngày
        đã qua tự được xoá khi lưu.
      </p>
    </div>
  );
}
