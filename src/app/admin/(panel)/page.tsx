import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { counts, sqlKind } from "@/lib/db";
import { mediaStore } from "@/lib/uploads";

const DATA_LABEL = { d1: "☁ Cloudflare D1", turso: "☁ Turso", file: "file trên máy (data/app.db)" } as const;
const MEDIA_LABEL = { r2: "☁ Cloudflare R2", "r2-s3": "☁ Cloudflare R2", local: "thư mục trên máy (data/uploads)" } as const;

function StorageBadge({ cloud, label, value }: { cloud: boolean; label: string; value: string }) {
  return (
    <span className={`rounded-full px-3 py-1 font-medium ${cloud ? "bg-sunken text-ink" : "bg-accent-soft text-accent"}`}>
      {label}: {value}
    </span>
  );
}

export default async function AdminHome() {
  await requireAdmin();
  const c = await counts();
  const cards = [
    { href: "/admin/photographers", label: "Photographer", n: c.photographers, add: "/admin/photographers/new" },
    { href: "/admin/packages", label: "Gói chụp", n: c.packages, add: "/admin/packages/new" },
    { href: "/admin/addons", label: "Đồ bán kèm", n: c.addons, add: "/admin/addons/new" },
    { href: "/admin/schools", label: "Trường", n: c.schools, add: "/admin/schools/new" },
    { href: "/admin/pricing", label: "Hạng giá", n: c.tiers },
    { href: "/admin/pricing#tinh", label: "Tỉnh có phụ phí", n: c.provinces },
  ];
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-ink">Tổng quan</h1>
      <p className="mt-1 text-sm text-muted">Mọi thay đổi ở đây hiện ra trên website ngay sau khi lưu.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <StorageBadge cloud={sqlKind() !== "file"} label="Dữ liệu" value={DATA_LABEL[sqlKind()]} />
        <StorageBadge cloud={mediaStore().kind !== "local"} label="Ảnh" value={MEDIA_LABEL[mediaStore().kind]} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5">
            <Link href={card.href} className="group">
              <p className="text-3xl font-bold text-ink">{card.n}</p>
              <p className="text-sm text-muted group-hover:text-accent">{card.label} →</p>
            </Link>
            {card.add && (
              <Link href={card.add} className="rounded-full border border-line px-3 py-1.5 text-sm font-medium hover:border-ink">
                + Thêm
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
