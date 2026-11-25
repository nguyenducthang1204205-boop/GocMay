"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { cn } from "@/lib/cn";
import { Lightbox } from "./Lightbox";

const LAYOUTS = {
  /** Portfolio: ảnh đầu lớn, các ảnh sau xếp lưới — kiểu tạp chí */
  editorial: {
    grid: "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3",
    item: (i: number) => (i === 0 ? "col-span-2 row-span-2" : ""),
  },
  /** Dải ảnh: vuốt ngang trên mobile, lưới 6 cột trên desktop */
  strip: {
    grid: "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-6 md:gap-3 md:overflow-visible md:px-0",
    item: () => "w-44 shrink-0 snap-start md:w-auto",
  },
} as const;

/** Lưới ảnh bấm được để mở Lightbox. */
export function PhotoGrid({
  photos,
  title,
  layout = "editorial",
  priorityCount = 0,
}: {
  photos: string[];
  /** Tên bộ ảnh — dùng cho alt và tiêu đề lightbox */
  title: string;
  layout?: keyof typeof LAYOUTS;
  /** Số ảnh đầu tiên được tải ngay (ảnh nằm trong màn hình đầu) */
  priorityCount?: number;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const { grid, item } = LAYOUTS[layout];

  if (!photos.length) return null;

  return (
    <>
      <ul className={grid}>
        {photos.map((src, i) => (
          <li key={`${src}-${i}`} className={item(i)}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Phóng to ảnh ${i + 1} — ${title}`}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl md:rounded-2xl"
            >
              <Photo
                src={src}
                alt={`${title} — ảnh ${i + 1}`}
                ratio="tall"
                priority={i < priorityCount}
                imgClassName="transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-[1.04]"
              />
              <span
                className={cn(
                  "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-canvas/85 text-ink backdrop-blur",
                  "opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100",
                )}
              >
                <Icon name="expand" className="h-4 w-4" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox photos={photos} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} title={title} />
    </>
  );
}
