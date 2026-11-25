import { Marquee } from "@/components/ui/Marquee";
import { Photo } from "@/components/ui/Photo";

/** Dải ảnh chạy ngang giữa các section — thuần trang trí. */
export function FilmStrip({ photos }: { photos: string[] }) {
  if (photos.length < 4) return null;
  return (
    <div aria-hidden className="py-4">
      <Marquee
        duration={60}
        items={photos.map((src, i) => (
          <Photo key={`${i}-${src}`} src={src} alt="" ratio="tall" className="w-36 rounded-xl sm:w-48 md:w-56" />
        ))}
      />
    </div>
  );
}
