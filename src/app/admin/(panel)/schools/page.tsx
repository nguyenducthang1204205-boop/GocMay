import { deleteSchoolAction, moveAction } from "@/app/admin/actions";
import { EmptyState, ListRow, NewButton, PageHeader } from "@/components/admin/ListRow";
import { requireAdmin } from "@/lib/auth";
import { listSchools } from "@/lib/db";

export default async function AdminSchools() {
  await requireAdmin();
  const list = await listSchools();
  return (
    <div>
      <PageHeader
        title="Trường"
        desc="Ảnh thật đã chụp tại từng trường — hiển thị ở trang Chọn trường."
        action={<NewButton href="/admin/schools/new">Thêm trường</NewButton>}
      />
      {list.length === 0 ? (
        <EmptyState>Chưa có trường nào.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((s, i) => (
            <ListRow
              key={s.id}
              image={s.photos[0] ?? ""}
              title={s.name}
              subtitle={`${s.type || "—"} · ${s.photos.length} ảnh · ${s.photographers.length} photographer`}
              editHref={`/admin/schools/${s.id}`}
              onUp={i > 0 ? moveAction.bind(null, "schools", s.id, -1) : undefined}
              onDown={i < list.length - 1 ? moveAction.bind(null, "schools", s.id, 1) : undefined}
              onDelete={deleteSchoolAction.bind(null, s.id)}
              deleteConfirm={`Xoá trường "${s.name}" và toàn bộ ảnh đã tải lên của trường? Không thể hoàn tác.`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
