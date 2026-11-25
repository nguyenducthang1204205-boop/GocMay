import Link from "next/link";
import { notFound } from "next/navigation";
import { saveAddon } from "@/app/admin/actions";
import { card, input, label } from "@/components/admin/styles";
import { AdminForm, PhotoManager } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getAddon } from "@/lib/db";

export default async function EditAddon(props: PageProps<"/admin/addons/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const isNew = id === "new";
  const a = isNew ? undefined : await getAddon(Number(id));
  if (!isNew && !a) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/addons" className="text-sm text-muted hover:text-accent">← Đồ bán kèm</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{a ? `Sửa: ${a.name}` : "Thêm sản phẩm bán kèm"}</h1>

      <AdminForm action={saveAddon.bind(null, a?.id ?? null)} submitLabel={a ? "Lưu thay đổi" : "Thêm sản phẩm"} className="mt-6 space-y-5">
        <section className={`${card} grid gap-4 sm:grid-cols-2`}>
          <label className={label}>
            Tên sản phẩm *
            <input name="name" required defaultValue={a?.name} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Giá (đ)
            <input name="price" inputMode="numeric" defaultValue={a?.price ?? ""} placeholder="450000" className={`mt-1 ${input}`} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Mô tả
            <textarea name="description" rows={2} defaultValue={a?.description} className={`mt-1 ${input}`} />
          </label>
        </section>
        <section className={card}>
          <h2 className="mb-3 text-sm font-semibold">Ảnh sản phẩm</h2>
          <PhotoManager initial={a?.image ? [a.image] : []} max={1} />
        </section>
      </AdminForm>
    </div>
  );
}
