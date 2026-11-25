import Link from "next/link";
import { notFound } from "next/navigation";
import { savePackage } from "@/app/admin/actions";
import { card, check, hint, input, label } from "@/components/admin/styles";
import { AdminForm, PhotoManager } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { getPackage } from "@/lib/db";

export default async function EditPackage(props: PageProps<"/admin/packages/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const isNew = id === "new";
  const p = isNew ? undefined : await getPackage(Number(id));
  if (!isNew && !p) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/packages" className="text-sm text-muted hover:text-accent">← Gói chụp</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{p ? `Sửa: ${p.name}` : "Thêm gói chụp"}</h1>

      <AdminForm action={savePackage.bind(null, p?.id ?? null)} submitLabel={p ? "Lưu thay đổi" : "Thêm gói"} className="mt-6 space-y-5">
        <section className={`${card} grid gap-4 sm:grid-cols-2`}>
          <label className={`${label} sm:col-span-2`}>
            Tên gói *
            <input name="name" required defaultValue={p?.name} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Loại chụp
            <input name="category" list="pkg-categories" defaultValue={p?.category} className={`mt-1 ${input}`} />
            <datalist id="pkg-categories">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={label}>
            Giá (đ)
            <input name="price" inputMode="numeric" defaultValue={p?.price ?? ""} placeholder="3200000" className={`mt-1 ${input}`} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Mô tả
            <textarea name="description" rows={2} defaultValue={p?.description} className={`mt-1 ${input}`} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Gói bao gồm
            <textarea name="includes" rows={4} defaultValue={p?.includes.join("\n")} placeholder={"3 giờ chụp\n2 địa điểm\n…"} className={`mt-1 ${input}`} />
            <span className={hint}>Mỗi dòng một ý.</span>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="featured" defaultChecked={p?.featured} className={check} />
            Gắn nhãn “Được chọn nhiều”
          </label>
        </section>
        <section className={card}>
          <h2 className="mb-3 text-sm font-semibold">Ảnh minh hoạ</h2>
          <PhotoManager initial={p?.image ? [p.image] : []} max={1} />
        </section>
      </AdminForm>
    </div>
  );
}
