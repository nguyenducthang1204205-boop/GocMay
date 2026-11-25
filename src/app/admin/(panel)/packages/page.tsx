import { deletePackageAction, moveAction } from "@/app/admin/actions";
import { EmptyState, ListRow, NewButton, PageHeader } from "@/components/admin/ListRow";
import { requireAdmin } from "@/lib/auth";
import { formatVND } from "@/lib/constants";
import { listPackages } from "@/lib/db";

export default async function AdminPackages() {
  await requireAdmin();
  const list = await listPackages();
  return (
    <div>
      <PageHeader
        title="Gói chụp"
        desc="Hiển thị ở trang Bảng giá, mục “Gói chụp”."
        action={<NewButton href="/admin/packages/new">Thêm gói</NewButton>}
      />
      {list.length === 0 ? (
        <EmptyState>Chưa có gói chụp nào.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((p, i) => (
            <ListRow
              key={p.id}
              image={p.image}
              title={p.name}
              subtitle={
                <>
                  {formatVND(p.price)}
                  {p.category && ` · ${p.category}`}
                  {p.featured && <span className="ml-1.5 rounded bg-accent-soft px-1.5 text-accent">Nổi bật</span>}
                </>
              }
              editHref={`/admin/packages/${p.id}`}
              onUp={i > 0 ? moveAction.bind(null, "packages", p.id, -1) : undefined}
              onDown={i < list.length - 1 ? moveAction.bind(null, "packages", p.id, 1) : undefined}
              onDelete={deletePackageAction.bind(null, p.id)}
              deleteConfirm={`Xoá gói "${p.name}"? Không thể hoàn tác.`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
