import type { Metadata } from "next";
import { Container, Section, SectionHeader } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { FinalCta } from "@/features/home/FinalCta";
import { CostEstimator } from "@/features/pricing/CostEstimator";
import { AddonGrid, PackageGrid, TierCards } from "@/features/pricing/PricingSections";
import { ProvinceFeeTable } from "@/features/pricing/ProvinceFeeTable";
import { getAddons, getPackages, getPhotographers, getProvinces, getSettings, getTiers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Bảng giá & phụ phí tỉnh",
  description: "Giá chụp theo hạng photographer, gói chụp, đồ bán kèm, phụ phí đi tỉnh và công cụ ước tính chi phí theo nhóm.",
};

export default async function PricingPage() {
  const [tiers, photographers, packages, addons, provinces, settings] = await Promise.all([
    getTiers(),
    getPhotographers(),
    getPackages(),
    getAddons(),
    getProvinces(),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Bảng giá"
        title={
          <>
            Giá rõ ràng, <em className="text-accent">theo hạng</em> photographer
          </>
        }
        description={`Giá khởi điểm cho 1 buổi chụp tại ${settings.city}. Nhóm đông, concept phức tạp hoặc đi tỉnh, photographer sẽ báo giá chính xác khi bạn nhắn.`}
      />

      <Container className="pb-8">
        <TierCards tiers={tiers} photographers={photographers} />
      </Container>

      <Section labelledBy="estimator-title" id="uoc-tinh">
        <Container>
          <SectionHeader
            id="estimator-title"
            index="01"
            eyebrow="Ước tính"
            title={
              <>
                Mỗi người góp <em className="text-accent">bao nhiêu?</em>
              </>
            }
            description="Chọn hạng, địa điểm và số người — xem nhanh chi phí chia đầu người."
          />
          <CostEstimator tiers={tiers} provinces={provinces} addons={addons} />
        </Container>
      </Section>

      {packages.length > 0 && (
        <Section tone="surface" id="goi-chup" labelledBy="packages-title">
          <Container>
            <SectionHeader
              id="packages-title"
              index="02"
              eyebrow="Gói chụp"
              title="Gói trọn sẵn"
              description="Chọn gói rồi nhắn photographer để giữ lịch."
            />
            <PackageGrid packages={packages} />
          </Container>
        </Section>
      )}

      {addons.length > 0 && (
        <Section id="ban-kem" labelledBy="addons-title">
          <Container>
            <SectionHeader
              id="addons-title"
              index="03"
              eyebrow="Đồ bán kèm"
              title="Thêm cho buổi chụp"
              description="Báo photographer khi đặt lịch để chuẩn bị sẵn."
            />
            <AddonGrid addons={addons} />
          </Container>
        </Section>
      )}

      <Section tone="surface" id="phu-phi" labelledBy="fees-title">
        <Container>
          <SectionHeader
            id="fees-title"
            index="04"
            eyebrow="Đi tỉnh"
            title="Phụ phí di chuyển"
            description="Tính cho cả buổi, không tính theo đầu người — đặt theo nhóm để chia cho nhẹ."
          />
          <ProvinceFeeTable provinces={provinces} />
          {settings.depositPolicy && (
            <div className="mt-16 grid gap-4 rounded-3xl bg-sunken p-6 md:grid-cols-[200px_1fr] md:p-8">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Chính sách cọc</h3>
              <p className="font-serif text-xl leading-relaxed md:text-2xl">{settings.depositPolicy}</p>
            </div>
          )}
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
