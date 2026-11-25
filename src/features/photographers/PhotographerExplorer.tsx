"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CATEGORIES, type Photographer, type Tier, VIBES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import {
  type Filters,
  SORTS,
  type SortKey,
  applyFilters,
  countActive,
  parseFilters,
  serializeFilters,
  toggle,
} from "./filters";
import { PhotographerGrid } from "./PhotographerGrid";

/**
 * Tìm kiếm + lọc + sắp xếp photographer. Trạng thái nằm trên URL nên khách
 * gửi link là người nhận thấy đúng danh sách đã lọc.
 * Phải đặt trong <Suspense> (dùng useSearchParams).
 */
export function PhotographerExplorer({ photographers, tiers }: { photographers: Photographer[]; tiers: Tier[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const tierLabels = useMemo(() => Object.fromEntries(tiers.map((t) => [t.key, t.label])), [tiers]);

  // Ô tìm kiếm giữ state riêng để gõ tiếng Việt (bộ gõ Telex/VNI) không bị giật
  const [query, setQuery] = useState(filters.q);
  const [panelOpen, setPanelOpen] = useState(countActive(filters) > filters.cats.length);

  const update = (next: Partial<Filters>) => {
    const qs = serializeFilters({ ...filters, q: query, ...next });
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };

  // Đồng bộ ô tìm kiếm lên URL sau khi ngừng gõ
  useEffect(() => {
    if (query === filters.q) return;
    const t = setTimeout(() => {
      const qs = serializeFilters({ ...filters, q: query });
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [query, filters, pathname]);

  const results = useMemo(() => applyFilters(photographers, { ...filters, q: query }), [photographers, filters, query]);
  const active = countActive(filters);
  const reset = () => {
    setQuery("");
    window.history.replaceState(null, "", pathname);
  };

  const activeChips = [
    ...filters.cats.map((v) => ({ label: v, remove: () => update({ cats: toggle(filters.cats, v) }) })),
    ...filters.vibes.map((v) => ({ label: `Vibe: ${v}`, remove: () => update({ vibes: toggle(filters.vibes, v) }) })),
    ...filters.tiers.map((v) => ({ label: `Hạng ${tierLabels[v] ?? v}`, remove: () => update({ tiers: toggle(filters.tiers, v) }) })),
    ...(filters.available ? [{ label: "Còn lịch", remove: () => update({ available: false }) }] : []),
  ];

  return (
    <div>
      {/* Thanh tìm kiếm */}
      <div className="flex gap-2 sm:gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Tìm photographer theo tên hoặc phong cách</span>
          <Icon name="search" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, vibe: film, cá tính…"
            className="h-14 w-full rounded-full border border-line bg-surface pl-13 pr-5 text-base outline-none transition placeholder:text-muted focus:border-ink focus-visible:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-controls="filter-panel"
          className={cn(
            "inline-flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-5 text-sm font-semibold transition",
            panelOpen || active ? "border-ink bg-ink text-canvas" : "border-line bg-surface hover:border-ink",
          )}
        >
          <Icon name="sliders" className="h-4 w-4" />
          <span className="hidden sm:inline">Bộ lọc</span>
          {active > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] text-white">{active}</span>
          )}
        </button>
      </div>

      {/* Danh mục — luôn hiện */}
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={filters.cats.includes(c)} onClick={() => update({ cats: toggle(filters.cats, c) })}>
            {c}
            <span className="font-mono text-[11px] opacity-60">{photographers.filter((p) => p.categories.includes(c)).length}</span>
          </Chip>
        ))}
      </div>

      {/* Bộ lọc mở rộng */}
      {panelOpen && (
        <div id="filter-panel" className="mt-4 grid gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-6 md:grid-cols-3">
          <FilterGroup legend="Vibe màu ảnh">
            {VIBES.map((v) => (
              <Chip key={v} active={filters.vibes.includes(v)} onClick={() => update({ vibes: toggle(filters.vibes, v) })}>
                {v}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup legend="Hạng photographer">
            {tiers.map((t) => (
              <Chip key={t.key} active={filters.tiers.includes(t.key)} onClick={() => update({ tiers: toggle(filters.tiers, t.key) })}>
                {t.label}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup legend="Lịch">
            <Chip active={filters.available} onClick={() => update({ available: !filters.available })}>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-positive" />
              Chỉ người còn lịch
            </Chip>
          </FilterGroup>
        </div>
      )}

      {/* Tóm tắt + sắp xếp */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm" aria-live="polite">
            <span className="font-serif text-2xl">{results.length}</span>{" "}
            <span className="text-muted">photographer</span>
          </p>
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.remove}
              className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full bg-sunken px-3 text-xs font-medium transition hover:bg-line"
            >
              {chip.label}
              <Icon name="close" className="h-3.5 w-3.5" label="Bỏ lọc" />
            </button>
          ))}
          {(active > 0 || query) && (
            <button type="button" onClick={reset} className="cursor-pointer px-2 text-xs font-semibold text-accent underline-offset-4 hover:underline">
              Xoá tất cả
            </button>
          )}
        </div>
        <label className="relative flex items-center gap-2 text-sm">
          <span className="text-muted">Sắp xếp</span>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortKey })}
            className="min-h-10 cursor-pointer appearance-none rounded-full border border-line bg-surface py-2 pl-4 pr-9 font-medium outline-none hover:border-ink"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" className="pointer-events-none absolute right-3 h-4 w-4" />
        </label>
      </div>

      {/* Kết quả */}
      {results.length ? (
        <PhotographerGrid photographers={results} tierLabels={tierLabels} priorityCount={4} className="mt-10" />
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
          <p className="font-serif text-3xl">Chưa có ai khớp bộ lọc</p>
          <p className="mx-auto mt-3 max-w-sm text-muted">Thử bỏ bớt điều kiện, hoặc nhắn studio để được gợi ý photographer phù hợp.</p>
          <Button variant="outline" className="mt-6" onClick={reset}>
            Xoá bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
        active ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink/80 hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
