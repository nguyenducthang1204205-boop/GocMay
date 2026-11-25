import Link from "next/link";
import { notFound } from "next/navigation";
import { saveSchool } from "@/app/admin/actions";
import { card, check, hint, input, label } from "@/components/admin/styles";
import { AdminForm, PhotoManager } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { SCHOOL_TYPES } from "@/lib/constants";
import { getSchool, listPhotographers } from "@/lib/db";

export default async function EditSchool(props: PageProps<"/admin/schools/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const isNew = id === "new";
  const s = isNew ? undefined : await getSchool(Number(id));
  if (!isNew && !s) notFound();
  const photographers = await listPhotographers();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/schools" className="text-sm text-muted hover:text-accent">← Trường</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{s ? `Sửa: ${s.name}` : "Thêm trường"}</h1>

      <AdminForm action={saveSchool.bind(null, s?.id ?? null)} submitLabel={s ? "Lưu thay đổi" : "Thêm trường"} className="mt-6 space-y-5">
        <section className={`${card} grid gap-4 sm:grid-cols-2`}>
          <label className={`${label} sm:col-span-2`}>
            Tên trường *
            <input name="name" required defaultValue={s?.name} placeholder="ĐH Ngoại thương" className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Tên viết tắt
            <input name="short" defaultValue={s?.short} placeholder="FTU" className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Loại
            <select name="type" defaultValue={s?.type ?? SCHOOL_TYPES[0]} className={`mt-1 ${input}`}>
              {SCHOOL_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className={`${label} sm:col-span-2`}>
            Đường dẫn (slug)
            <input name="slug" defaultValue={s?.slug} placeholder="tự tạo từ tên" className={`mt-1 ${input}`} />
            <span className={hint}>Dùng cho liên kết /truong#<b>{s?.slug ?? "ten-truong"}</b></span>
          </label>
        </section>

        <section className={card}>
          <h2 className="mb-2 text-sm font-semibold">Photographer đã chụp ở trường này</h2>
          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {photographers.map((p) => (
              <label key={p.slug} className="flex items-center gap-2 py-0.5 text-sm">
                <input type="checkbox" name="photographers" value={p.slug} defaultChecked={s?.photographers.includes(p.slug)} className={check} />
                {p.name}
              </label>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-sm font-semibold">Ảnh chụp tại trường</h2>
          <PhotoManager initial={s?.photos ?? []} />
        </section>
      </AdminForm>
    </div>
  );
}
