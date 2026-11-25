import { deleteProvinceAction, deleteTierAction, moveAction, saveProvince, saveTier } from "@/app/admin/actions";
import { PageHeader } from "@/components/admin/ListRow";
import { card, input, label } from "@/components/admin/styles";
import { ActionButton, AdminForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { countPhotographersInTier, listProvinces, listTiers } from "@/lib/db";

export default async function AdminPricing() {
  await requireAdmin();
  const tiers = await listTiers();
  const provinces = await listProvinces();
  const tierCounts = await Promise.all(tiers.map((t) => countPhotographersInTier(t.key)));

  return (
    <div className="max-w-4xl">
      <PageHeader title="Bảng giá & phụ phí tỉnh" desc="Giá theo hạng photographer và phụ phí di chuyển — hiển thị ở trang Bảng giá." />

      <h2 className="mb-3 text-lg font-semibold">Hạng photographer</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {tiers.map((t, ti) => (
          <div key={t.key} className={card}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted">{tierCounts[ti]} photographer</span>
              <ActionButton action={deleteTierAction.bind(null, t.key)} confirmText={`Xoá hạng "${t.label}"?`} danger title="Xoá hạng">
                Xoá
              </ActionButton>
            </div>
            <AdminForm action={saveTier.bind(null, t.key)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className={label}>
                  Tên hạng
                  <input name="label" required defaultValue={t.label} className={`mt-1 ${input}`} />
                </label>
                <label className={label}>
                  Giá từ (đ)
                  <input name="priceFrom" inputMode="numeric" defaultValue={t.priceFrom} className={`mt-1 ${input}`} />
                </label>
              </div>
              <label className={label}>
                Mô tả
                <textarea name="description" rows={2} defaultValue={t.description} className={`mt-1 ${input}`} />
              </label>
            </AdminForm>
          </div>
        ))}
        <div className={`${card} border-dashed`}>
          <p className="mb-2 text-sm font-semibold">+ Thêm hạng mới</p>
          <AdminForm action={saveTier.bind(null, null)} submitLabel="Thêm hạng" resetOnSuccess className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Tên hạng
                <input name="label" required placeholder="VD: Master" className={`mt-1 ${input}`} />
              </label>
              <label className={label}>
                Giá từ (đ)
                <input name="priceFrom" inputMode="numeric" className={`mt-1 ${input}`} />
              </label>
            </div>
            <label className={label}>
              Mô tả
              <textarea name="description" rows={2} className={`mt-1 ${input}`} />
            </label>
          </AdminForm>
        </div>
      </div>

      <h2 id="tinh" className="mb-3 mt-10 scroll-mt-6 text-lg font-semibold">Phụ phí đi tỉnh</h2>
      <div className={`${card} border-dashed`}>
        <AdminForm action={saveProvince.bind(null, null)} submitLabel="Thêm tỉnh" resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className={label}>
            Tên tỉnh / khu vực
            <input name="name" required placeholder="VD: Đà Nẵng" className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Phụ phí (đ)
            <input name="fee" inputMode="numeric" placeholder="0 = miễn phí" className={`mt-1 ${input}`} />
          </label>
        </AdminForm>
      </div>

      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
        {provinces.map((p, i) => (
          <li key={p.id} className="flex flex-wrap items-start gap-2 px-3 py-3">
            <div className="min-w-0 flex-1">
              <AdminForm action={saveProvince.bind(null, p.id)} className="grid grid-cols-[1fr_130px] gap-2 [&>div]:col-span-2 [&>div]:mt-1">
                <input name="name" aria-label="Tên tỉnh" required defaultValue={p.name} className={input} />
                <input name="fee" aria-label="Phụ phí" inputMode="numeric" defaultValue={p.fee} className={input} />
              </AdminForm>
            </div>
            <div className="flex gap-1.5">
              {i > 0 && (
                <ActionButton action={moveAction.bind(null, "provinces", p.id, -1)} title="Đưa lên">↑</ActionButton>
              )}
              {i < provinces.length - 1 && (
                <ActionButton action={moveAction.bind(null, "provinces", p.id, 1)} title="Đưa xuống">↓</ActionButton>
              )}
              <ActionButton action={deleteProvinceAction.bind(null, p.id)} confirmText={`Xoá "${p.name}"?`} danger title="Xoá">
                Xoá
              </ActionButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
