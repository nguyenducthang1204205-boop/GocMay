"use client";

import { useCallback, useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";

/** Xem ảnh toàn màn hình: phím ←/→, vuốt ngang trên điện thoại, Esc để đóng. */
export function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  photos: string[];
  /** null = đang đóng */
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  title: string;
}) {
  const open = index !== null;
  const count = photos.length;
  const current = index ?? 0;
  const startX = useRef<number | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => onIndexChange((current + dir + count) % count),
    [current, count, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  // Tải trước ảnh kế tiếp để chuyển ảnh tức thì
  useEffect(() => {
    if (!open || count < 2) return;
    const next = new Image();
    next.src = photos[(current + 1) % count];
  }, [open, current, count, photos]);

  const navBtn =
    "grid h-12 w-12 cursor-pointer place-items-center rounded-full border border-canvas/20 bg-ink/40 backdrop-blur transition hover:border-canvas/60 hover:bg-ink/60";

  return (
    <Dialog open={open} onClose={onClose} variant="fullscreen" label={`${title} — ảnh ${current + 1} trên ${count}`}>
      <div
        className="flex h-full flex-col"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="min-w-0 truncate font-mono text-xs uppercase tracking-[0.2em] text-canvas/75">
            {title} <span className="text-canvas/50">·</span> {String(current + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </p>
          <button type="button" onClick={onClose} aria-label="Đóng" autoFocus className={navBtn}>
            <Icon name="close" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={photos[current]}
            src={photos[current]}
            alt={`${title} — ảnh ${current + 1}`}
            className="max-h-full max-w-full select-none object-contain animate-[fade-in_300ms_ease-out]"
            draggable={false}
          />
          {count > 1 && (
            <>
              <button type="button" aria-label="Ảnh trước" onClick={() => go(-1)} className={`${navBtn} absolute left-3 top-1/2 hidden -translate-y-1/2 sm:grid`}>
                <Icon name="chevronLeft" />
              </button>
              <button type="button" aria-label="Ảnh sau" onClick={() => go(1)} className={`${navBtn} absolute right-3 top-1/2 hidden -translate-y-1/2 sm:grid`}>
                <Icon name="chevronRight" />
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <p className="pb-5 text-center text-xs text-canvas/60 sm:hidden">Vuốt ngang để xem ảnh khác</p>
        )}
      </div>
    </Dialog>
  );
}
