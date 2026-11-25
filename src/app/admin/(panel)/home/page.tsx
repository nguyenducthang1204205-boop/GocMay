import { saveHomeMediaAction } from "@/app/admin/actions";
import { PageHeader } from "@/components/admin/ListRow";
import { card, hint, input, label } from "@/components/admin/styles";
import { AdminForm, PhotoManager } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { HERO_SLOTS, STRIP_MIN, VIBES } from "@/lib/constants";
import { getHomeMedia, listPhotographers } from "@/lib/db";

export default async function AdminHomeMedia() {
  await requireAdmin();
  const [media, photographers] = await Promise.all([getHomeMedia(), listPhotographers()]);
  // Đổi key khi dữ liệu đổi → các ô ảnh dựng lại từ dữ liệu mới sau khi lưu (không gửi trùng file)
  const version = JSON.stringify(media);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Ảnh trang chủ"
        desc="Chọn ảnh cho collage đầu trang, dải ảnh chạy ngang và ô vibe. Phần nào để trống, web tự lấy ảnh từ portfolio photographer."
      />
      <AdminForm action={saveHomeMediaAction} className="space-y-5">
        <div key={version} className="space-y-5">
          <section className={card}>
            <h2 className="text-sm font-semibold">Collage đầu trang</h2>
            <p className={hint}>
              4 ảnh dọc cạnh tiêu đề lớn. Gắn photographer thì ảnh hiện tên họ và bấm vào mở hồ sơ; gắn photographer mà
              không tải ảnh thì dùng ảnh portfolio của họ. Để trống cả 4 ô → web tự chọn.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {Array.from({ length: HERO_SLOTS }, (_, i) => {
                const slot = media.hero[i];
                return (
                  <div key={i} className="rounded-xl border border-line p-4">
                    <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-muted">
                      Ô {i + 1} · {i % 2 ? "cột phải" : "cột trái"}
                    </h3>
                    <PhotoManager
                      initial={slot?.photo ? [slot.photo] : []}
                      max={1}
                      field={`hero${i}_`}
                      hintText="Ảnh dọc 3:4 đẹp nhất. Web tự nén trước khi tải lên."
                    />
                    <label className={`${label} mt-3`}>
                      Gắn photographer
                      <select
                        name={`hero${i}_photographer`}
                        defaultValue={slot?.photographer ?? ""}
                        className={`mt-1 ${input}`}
                      >
                        <option value="">— Không gắn (ảnh trang trí) —</option>
                        {photographers.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">Dải ảnh chạy ngang</h2>
            <p className={`${hint} mb-4`}>
              Chạy ngang ngay dưới phần đầu trang. Cần ít nhất {STRIP_MIN} ảnh (nên 8–14 ảnh); ít hơn thì web tự lấy ảnh
              portfolio. Dùng nút ← → để đổi thứ tự.
            </p>
            <PhotoManager initial={media.strip} field="strip_" />
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">Ảnh bìa ô vibe</h2>
            <p className={`${hint} mb-4`}>
              Mục “Bạn thích màu ảnh thế nào?”. Ô vibe chỉ hiện khi có ít nhất một photographer chụp vibe đó.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {VIBES.map((vibe, i) => (
                <div key={vibe}>
                  <h3 className="mb-2 text-sm font-medium">{vibe}</h3>
                  <PhotoManager
                    initial={media.vibes[vibe] ? [media.vibes[vibe]] : []}
                    max={1}
                    field={`vibe${i}_`}
                    aspect="aspect-[4/3]"
                    hintText="Ảnh ngang 4:3 đẹp nhất. Để trống = tự lấy."
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </AdminForm>
    </div>
  );
}
