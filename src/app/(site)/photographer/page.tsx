import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Layout";
import { PageHeader, PageTabs, QuickStats } from "@/components/ui/PageHeader";
import { DISCOVER_TABS, routes } from "@/config/site";
import { FinalCta } from "@/features/home/FinalCta";
import { sortPhotographers } from "@/features/photographers/filters";
import { PhotographerExplorer } from "@/features/photographers/PhotographerExplorer";
import { PhotographerGrid } from "@/features/photographers/PhotographerGrid";
import { formatVND } from "@/lib/constants";
import { getPhotographers, getStats, getTierLabels, getTiers } from "@/lib/content";

// Dựng lại trang mỗi giờ để nhãn lịch ("Còn lịch hôm nay"…) luôn theo đúng ngày
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Chọn photographer",
  description: "Lọc photographer theo vibe màu ảnh, hạng, lịch trống — xem portfolio và giá trước khi đặt lịch.",
};

export default async function PhotographersPage() {
  const [stats, photographers, tiers, tierLabels] = await Promise.all([
    getStats(),
    getPhotographers(),
    getTiers(),
    getTierLabels(),
  ]);

  return (
    <>
      <PageHeader
        tabs={<PageTabs items={DISCOVER_TABS} current={routes.photographers} />}
        eyebrow="Danh sách photographer"
        title={
          <>
            Chọn Photo <em className="text-accent">theo vibe</em>
          </>
        }
        description="Xem portfolio, giá theo hạng và lịch trống — rồi nhắn thẳng cho người bạn chọn để giữ lịch."
        aside={
          <QuickStats
            items={[
              { label: "Photographer", value: stats.total },
              { label: "Còn lịch", value: stats.available },
              { label: "Giá từ", value: formatVND(stats.minPrice) },
            ]}
          />
        }
      />
      <Container className="pb-24">
        {/* Trước khi JS chạy (và cho máy tìm kiếm): hiện toàn bộ danh sách */}
        <Suspense
          fallback={
            <PhotographerGrid
              photographers={sortPhotographers(photographers, "featured")}
              tierLabels={tierLabels}
              className="pt-36"
            />
          }
        >
          <PhotographerExplorer photographers={photographers} tiers={tiers} />
        </Suspense>
      </Container>
      <FinalCta
        title={
          <>
            Chưa biết chọn ai? <em className="text-accent-bright">Hỏi studio.</em>
          </>
        }
        description="Kể concept, ngày chụp và ngân sách — studio gợi ý 2–3 photographer hợp nhất với bạn."
      />
    </>
  );
}
