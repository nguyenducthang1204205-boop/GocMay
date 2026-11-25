import Link from "next/link";
import { notFound } from "next/navigation";
import { savePhotographer } from "@/app/admin/actions";
import { card, check, hint, input, label } from "@/components/admin/styles";
import { BookedDatesPicker } from "@/components/admin/BookedDatesPicker";
import { AdminForm, PhotoManager } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES, SERVICES, VIBES } from "@/lib/constants";
import { getPhotographerById, getSettings, listTiers } from "@/lib/db";

export default async function EditPhotographer(props: PageProps<"/admin/photographers/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const isNew = id === "new";
  const p = isNew ? undefined : await getPhotographerById(Number(id));
  if (!isNew && !p) notFound();
  const tiers = await listTiers();
  const city = (await getSettings()).city;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/photographers" className="text-sm text-muted hover:text-accent">← Photographer</Link>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{p ? `Sửa: ${p.name}` : "Thêm photographer"}</h1>
      {p && (
        <Link href={`/photographer/${p.slug}`} target="_blank" className="text-sm text-accent hover:underline">
          Xem trên web ↗
        </Link>
      )}

      <AdminForm action={savePhotographer.bind(null, p?.id ?? null)} submitLabel={p ? "Lưu thay đổi" : "Thêm photographer"} className="mt-6 space-y-5">
        <section className={`${card} grid gap-4 sm:grid-cols-2`}>
          <label className={label}>
            Tên hiển thị *
            <input name="name" required defaultValue={p?.name} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Đường dẫn (slug)
            <input name="slug" defaultValue={p?.slug} placeholder="tự tạo từ tên" className={`mt-1 ${input}`} />
            <span className={hint}>Web: /photographer/<b>{p?.slug ?? "ten-photographer"}</b></span>
          </label>
          <label className={label}>
            Hạng *
            <select name="tier" required defaultValue={p?.tier ?? tiers[0]?.key} className={`mt-1 ${input}`}>
              {tiers.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Giá từ (đ)
            <input name="priceFrom" inputMode="numeric" defaultValue={p?.priceFrom ?? ""} placeholder="2500000" className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            Thành phố
            <input name="city" defaultValue={p?.city ?? city} className={`mt-1 ${input}`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Đánh giá (0–5)
              <input name="rating" inputMode="decimal" defaultValue={p?.rating ?? 5} className={`mt-1 ${input}`} />
            </label>
            <label className={label}>
              Số buổi đã chụp
              <input name="sessions" inputMode="numeric" defaultValue={p?.sessions ?? 0} className={`mt-1 ${input}`} />
            </label>
          </div>
          <label className={`${label} sm:col-span-2`}>
            Giới thiệu ngắn
            <textarea name="bio" rows={3} defaultValue={p?.bio} className={`mt-1 ${input}`} />
          </label>
          <label className={`${label} sm:col-span-2`}>
            Link album đầy đủ (Google Drive…)
            <input name="albumUrl" type="url" defaultValue={p?.albumUrl} placeholder="https://drive.google.com/…" className={`mt-1 ${input}`} />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="featured" defaultChecked={p?.featured} className={check} />
            Hiện ở mục “Photographer nổi bật” trên trang chủ
          </label>
        </section>

        <section className={`${card} grid gap-5 sm:grid-cols-3`}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Phong cách</legend>
            {VIBES.map((v) => (
              <label key={v} className="flex items-center gap-2 py-0.5 text-sm">
                <input type="checkbox" name="vibes" value={v} defaultChecked={p?.vibes.includes(v)} className={check} />
                {v}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Nhận chụp</legend>
            {CATEGORIES.map((c) => (
              <label key={c} className="flex items-center gap-2 py-0.5 text-sm">
                <input type="checkbox" name="categories" value={c} defaultChecked={p ? p.categories.includes(c) : true} className={check} />
                {c}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Dịch vụ có sẵn</legend>
            {SERVICES.map((s) => (
              <label key={s.key} className="flex items-start gap-2 py-0.5 text-sm">
                <input type="checkbox" name={`svc_${s.key}`} defaultChecked={p?.services[s.key]} className={`${check} mt-0.5`} />
                {s.label}
              </label>
            ))}
          </fieldset>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-sm font-semibold">Lịch — tích các ngày đã có lịch</h2>
          <BookedDatesPicker initial={p?.bookedDates ?? []} />
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold">Liên hệ trực tiếp</h2>
          <p className={hint}>
            Khách bấm liên hệ sẽ nhắn thẳng cho người này. Để trống ô nào thì ô đó dùng liên hệ chung của studio
            (trong Cài đặt chung).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className={label}>
              Zalo
              <input name="zalo" defaultValue={p?.zalo} placeholder="0961 120 879 hoặc link zalo.me" className={`mt-1 ${input}`} />
              <span className={hint}>Nhập số điện thoại là được.</span>
            </label>
            <label className={label}>
              Messenger
              <input name="messenger" defaultValue={p?.messenger} placeholder="tên.trang hoặc link m.me" className={`mt-1 ${input}`} />
              <span className={hint}>Tên trang/Facebook hoặc link.</span>
            </label>
            <label className={label}>
              Instagram
              <input name="instagram" defaultValue={p?.instagram} placeholder="@ten.instagram" className={`mt-1 ${input}`} />
              <span className={hint}>Nhập @tên hoặc link.</span>
            </label>
          </div>
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-medium">Mã QR Zalo <span className="font-normal text-muted">(không bắt buộc)</span></h3>
            <PhotoManager
              initial={p?.zaloQr ? [p.zaloQr] : []}
              max={1}
              field="qr_"
              aspect="aspect-square"
              hintText="Ảnh chụp mã QR trong Zalo (Cá nhân → mã QR). Hiện cho khách quét khi không muốn để số điện thoại."
            />
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-sm font-semibold">Ảnh portfolio</h2>
          <PhotoManager initial={p?.photos ?? []} />
        </section>
      </AdminForm>
    </div>
  );
}
