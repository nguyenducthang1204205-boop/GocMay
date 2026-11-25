import { deleteAddonAction, moveAction } from "@/app/admin/actions";
import { EmptyState, ListRow, NewButton, PageHeader } from "@/components/admin/ListRow";
import { requireAdmin } from "@/lib/auth";
import { formatVND } from "@/lib/constants";
import { listAddons } from "@/lib/db";

export default async function AdminAddons() {
  await requireAdmin();
  const list = await listAddons();
  return (
    <div>
      <PageHeader
        title="Đồ bán kèm"
        desc="Album in, khung ảnh, giờ chụp thêm… Hiển thị ở trang Bảng giá."
        action={<NewButton href="/admin/addons/new">Thêm sản phẩm</NewButton>}
      />
      {list.length === 0 ? (
        <EmptyState>Chưa có sản phẩm bán kèm nào.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((a, i) => (
            <ListRow
              key={a.id}
              image={a.image}
              title={a.name}
              subtitle={formatVND(a.price)}
              editHref={`/admin/addons/${a.id}`}
              onUp={i > 0 ? moveAction.bind(null, "addons", a.id, -1) : undefined}
              onDown={i < list.length - 1 ? moveAction.bind(null, "addons", a.id, 1) : undefined}
              onDelete={deleteAddonAction.bind(null, a.id)}
              deleteConfirm={`Xoá "${a.name}"? Không thể hoàn tác.`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
