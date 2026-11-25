import { saveSettingsAction } from "@/app/admin/actions";
import { PageHeader } from "@/components/admin/ListRow";
import { card, hint, input, label } from "@/components/admin/styles";
import { AdminForm } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminSettings() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Cài đặt chung" desc="Tên thương hiệu, thông tin liên hệ và chính sách cọc." />
      <AdminForm action={saveSettingsAction} className="space-y-5">
        <section className={`${card} grid gap-4 sm:grid-cols-2`}>
          <label className={label}>
            Tên thương hiệu *
            <input name="name" required defaultValue={s.name} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Thành phố hoạt động
            <input name="city" defaultValue={s.city} className={`mt-1 ${input}`} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Slogan
            <input name="tagline" defaultValue={s.tagline} className={`mt-1 ${input}`} />
          </label>
        </section>
        <section className={`${card} grid gap-4`}>
          <label className={label}>
            Link Zalo
            <input name="zalo" type="url" defaultValue={s.zalo} placeholder="https://zalo.me/09xxxxxxxx" className={`mt-1 ${input}`} />
            <span className={hint}>Nút “Đặt lịch ngay” và “Copy & mở Zalo” dẫn tới đây.</span>
          </label>
          <label className={label}>
            Link Messenger
            <input name="messenger" type="url" defaultValue={s.messenger} placeholder="https://m.me/ten-trang" className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Link Instagram
            <input name="instagram" type="url" defaultValue={s.instagram} placeholder="https://instagram.com/…" className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Chính sách cọc
            <textarea name="depositPolicy" rows={3} defaultValue={s.depositPolicy} className={`mt-1 ${input}`} />
          </label>
        </section>
      </AdminForm>
    </div>
  );
}
