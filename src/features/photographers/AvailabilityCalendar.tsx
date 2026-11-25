"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { BookingDialog } from "@/features/booking/BookingDialogButton";
import type { BookingFormProps } from "@/features/booking/BookingForm";
import {
  type ISODate,
  WEEK_HEADER,
  addDays,
  formatShort,
  monthGrid,
  monthLabel,
  shiftMonth,
  todayVN,
} from "@/lib/availability";
import { cn } from "@/lib/cn";

const MONTHS_AHEAD = 6;
const noop = () => () => {};

/**
 * Lịch trống công khai: ngày trống bấm được để mở form đặt lịch với ngày đó điền sẵn.
 * "Hôm nay" lấy từ trình duyệt (giờ Việt Nam) — trang có cache vẫn hiện đúng ngày.
 */
export function AvailabilityCalendar({
  bookedDates,
  serverToday,
  ...booking
}: BookingFormProps & { bookedDates: string[]; serverToday: ISODate }) {
  // Lúc dựng HTML dùng ngày của server, sau khi hiện trên trình duyệt đổi sang ngày thật
  const today = useSyncExternalStore(noop, () => todayVN(), () => serverToday);
  const booked = new Set(bookedDates);
  const [y0, m0] = today.split("-").map(Number);
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState<ISODate | null>(null);

  const months = [shiftMonth(y0, m0, offset), shiftMonth(y0, m0, offset + 1)];
  const next30 = Array.from({ length: 30 }, (_, i) => addDays(today, i));
  const freeCount = next30.filter((d) => !booked.has(d)).length;

  const navBtn =
    "grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-line-strong bg-white transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <section aria-labelledby="calendar-title" className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Lịch trống</p>
          <h2 id="calendar-title" className="mt-2 font-serif text-3xl">
            Còn <span className="text-positive">{freeCount}</span> ngày trống trong 30 ngày tới
          </h2>
          <p className="mt-1 text-sm text-muted">Bấm vào ngày trống để nhắn đặt lịch ngày đó.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Tháng trước" className={navBtn} disabled={offset === 0} onClick={() => setOffset((o) => o - 1)}>
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Tháng sau"
            className={navBtn}
            disabled={offset >= MONTHS_AHEAD - 2}
            onClick={() => setOffset((o) => o + 1)}
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {months.map(({ year, month }, mi) => (
          <div key={`${year}-${month}`} className={cn(mi === 1 && "hidden md:block")}>
            <p className="mb-3 font-semibold">{monthLabel(year, month)}</p>
            <div className="grid grid-cols-7 gap-1 text-center" role="grid">
              {WEEK_HEADER.map((w) => (
                <span key={w} className="pb-1 font-mono text-[11px] text-muted">
                  {w}
                </span>
              ))}
              {monthGrid(year, month).map((d, i) => {
                if (!d) return <span key={`e${i}`} />;
                const past = d < today;
                const isBooked = booked.has(d);
                const free = !past && !isBooked;
                const day = Number(d.slice(8));
                const base = "relative grid aspect-square place-items-center rounded-xl text-sm";
                if (!free) {
                  return (
                    <span
                      key={d}
                      title={isBooked ? `${formatShort(d)} — đã có lịch` : undefined}
                      className={cn(base, past ? "text-muted/35" : "bg-sunken text-muted line-through decoration-muted/60")}
                    >
                      {day}
                    </span>
                  );
                }
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPicked(d)}
                    aria-label={`${formatShort(d)} — còn trống, bấm để đặt lịch`}
                    className={cn(
                      base,
                      "cursor-pointer bg-positive-soft font-semibold text-positive transition hover:bg-positive hover:text-white",
                      d === today && "ring-2 ring-positive ring-offset-2 ring-offset-surface",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-muted">
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-positive-soft ring-1 ring-positive/40" /> Còn trống
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-sunken" /> Đã có lịch
        </li>
        <li>Lịch có thể chưa kịp cập nhật — nhắn để xác nhận chính xác.</li>
      </ul>

      <BookingDialog {...booking} open={picked !== null} onClose={() => setPicked(null)} initialDate={picked ?? undefined} />
    </section>
  );
}
