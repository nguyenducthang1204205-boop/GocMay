// Ghép ảnh trang chủ do quản trị chọn với ảnh tự lấy từ portfolio.
// Phần nào quản trị để trống thì dùng cách tự chọn như cũ, để trang chủ không bao giờ trống.
import { routes } from "@/config/site";
import { type HomeMedia, type Photographer, STRIP_MIN, VIBES, type Vibe } from "@/lib/constants";
import { sortPhotographers } from "@/features/photographers/filters";

/** Một ảnh trong collage đầu trang. Có photographer thì hiện tên + bấm vào xem hồ sơ. */
export type HeroItem = { src: string; name?: string; vibe?: string; href?: string };

export type HomeImages = {
  hero: HeroItem[];
  strip: string[];
  vibeCovers: Partial<Record<Vibe, string>>;
};

const fromPhotographer = (p: Photographer, src?: string): HeroItem => ({
  src: src || p.photos[1] || p.photos[0] || "",
  name: p.name,
  vibe: p.vibes[0],
  href: routes.photographer(p.slug),
});

export function resolveHomeImages(media: HomeMedia, photographers: Photographer[]): HomeImages {
  const bySlug = new Map(photographers.map((p) => [p.slug, p]));
  const ranked = sortPhotographers(photographers, "featured");

  // Collage: quản trị chọn ô nào thì hiện ô đó; không chọn ô nào → tự lấy 4 photographer
  const chosen = media.hero
    .map((slot): HeroItem | null => {
      const p = bySlug.get(slot.photographer);
      if (p) return fromPhotographer(p, slot.photo);
      return slot.photo ? { src: slot.photo } : null;
    })
    .filter((h): h is HeroItem => !!h?.src);
  // Nhóm khác với mục "Nổi bật" (4 người đầu) để không lặp người
  const auto = (ranked.length >= 8 ? ranked.slice(4, 8) : ranked.slice(0, 4)).map((p) => fromPhotographer(p));
  const hero = chosen.length ? chosen : auto.filter((h) => h.src);

  const strip =
    media.strip.length >= STRIP_MIN ? media.strip : photographers.flatMap((p) => p.photos.slice(3, 5)).slice(0, 14);

  // Ảnh bìa vibe: ô nào quản trị chọn thì dùng; còn lại lấy ảnh của photographer có vibe đó
  const vibeCovers = Object.fromEntries(
    VIBES.map((vibe, i) => {
      const matches = photographers.filter((p) => p.vibes.includes(vibe));
      // Mỗi ô lấy một ảnh khác nhau để lưới không bị lặp
      const auto = matches[i % Math.max(matches.length, 1)]?.photos[2] ?? matches[0]?.photos[0];
      return [vibe, media.vibes[vibe] || auto];
    }),
  );

  return { hero, strip, vibeCovers };
}
