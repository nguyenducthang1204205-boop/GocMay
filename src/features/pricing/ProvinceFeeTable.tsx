"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { type Province, formatVND, normalize } from "@/lib/constants";

/** Bảng phụ phí đi tỉnh, có ô tìm nhanh (gõ không dấu cũng được). */
export function ProvinceFeeTable({ provinces }: { provinces: Province[] }) {
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());
  const rows = q ? provinces.filter((p) => normalize(p.name).includes(q)) : provinces;

  return (
    <div>
      <label className="relative block max-w-sm">
        <span className="sr-only">Tìm tỉnh thành</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm tỉnh: quang ninh, ha giang…"
          className="min-h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[15px] outline-none focus:border-ink focus-visible:outline-none"
        />
      </label>

      {rows.length ? (
        <ul className="mt-6 grid border-t border-line sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {rows.map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-4 border-b border-line py-4">
              <span className="text-[15px]">{p.name}</span>
              <span className="shrink-0 font-mono text-sm tabular-nums">
                {p.fee ? formatVND(p.fee) : <span className="text-positive">Miễn phí</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-muted">
          Chưa có “{query}” trong bảng — nhắn studio để được báo phụ phí riêng.
        </p>
      )}
    </div>
  );
}
