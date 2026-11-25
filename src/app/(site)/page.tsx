import { FeaturedSection } from "@/features/home/FeaturedSection";
import { FilmStrip } from "@/features/home/FilmStrip";
import { FinalCta } from "@/features/home/FinalCta";
import { HeroSection } from "@/features/home/HeroSection";
import { ProcessSection } from "@/features/home/ProcessSection";
import { ProvincesSection } from "@/features/home/ProvincesSection";
import { SchoolsTeaser } from "@/features/home/SchoolsTeaser";
import { VibeSection } from "@/features/home/VibeSection";
import { resolveHomeImages } from "@/features/home/homeMedia";
import { sortPhotographers } from "@/features/photographers/filters";
import {
  getHomeMedia,
  getPhotographers,
  getProvinces,
  getSchools,
  getSettings,
  getStats,
  getTierLabels,
} from "@/lib/content";

// Dựng lại trang mỗi giờ để nhãn lịch ("Còn lịch hôm nay"…) luôn theo đúng ngày
export const revalidate = 3600;

// Trang chủ chỉ lắp ghép các section — muốn thêm/bớt/đổi thứ tự thì sửa ở đây.
export default async function HomePage() {
  const [photographers, settings, stats, provinces, tierLabels, schools, media] = await Promise.all([
    getPhotographers(),
    getSettings(),
    getStats(),
    getProvinces(),
    getTierLabels(),
    getSchools(),
    getHomeMedia(),
  ]);

  const ranked = sortPhotographers(photographers, "featured");
  const featured = ranked.slice(0, 4);
  // Ảnh collage, dải ảnh, ảnh bìa vibe: quản trị chọn ở /admin/home, trống thì tự lấy
  const images = resolveHomeImages(media, photographers);

  return (
    <>
      <HeroSection settings={settings} stats={stats} showcase={images.hero} />
      <FilmStrip photos={images.strip} />
      <FeaturedSection photographers={featured} total={stats.total} tierLabels={tierLabels} />
      <VibeSection photographers={photographers} covers={images.vibeCovers} />
      <SchoolsTeaser schools={schools} />
      <ProvincesSection provinces={provinces} />
      <ProcessSection />
      <FinalCta />
    </>
  );
}
