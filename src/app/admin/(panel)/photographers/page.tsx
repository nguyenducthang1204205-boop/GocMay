import { deletePhotographerAction, moveAction } from "@/app/admin/actions";
import { EmptyState, ListRow, NewButton, PageHeader } from "@/components/admin/ListRow";
import { formatVND } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { listPhotographers, listTiers } from "@/lib/db";

export default async function AdminPhotographers() {
  await requireAdmin();
  const list = await listPhotographers();
  const tierLabel = Object.fromEntries((await listTiers()).map((t) => [t.key, t.label]));
  return (
    <div>
      <PageHeader
        title="Photographer"
        desc={`${list.length} người · thứ tự ở đây là thứ tự hiển thị “Nổi bật” trên web`}
        action={<NewButton href="/admin/photographers/new">Thêm photographer</NewButton>}
      />
      {list.length === 0 ? (
        <EmptyState>Chưa có photographer nào.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((p, i) => (
            <ListRow
              key={p.id}
              image={p.photos[0] ?? ""}
              title={p.name}
              subtitle={
                <>
                  {tierLabel[p.tier] ?? p.tier} · từ {formatVND(p.priceFrom)} · {p.photos.length} ảnh
                  {p.featured && <span className="ml-1.5 rounded bg-accent-soft px-1.5 text-accent">Nổi bật</span>}
                </>
              }
              editHref={`/admin/photographers/${p.id}`}
              onUp={i > 0 ? moveAction.bind(null, "photographers", p.id, -1) : undefined}
              onDown={i < list.length - 1 ? moveAction.bind(null, "photographers", p.id, 1) : undefined}
              onDelete={deletePhotographerAction.bind(null, p.id)}
              deleteConfirm={`Xoá photographer "${p.name}" và toàn bộ ảnh đã tải lên của họ? Không thể hoàn tác.`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
