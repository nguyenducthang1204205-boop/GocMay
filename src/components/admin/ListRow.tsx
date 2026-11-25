import Link from "next/link";
import { type FormState } from "@/app/admin/actions";
import { ActionButton } from "./ui";

/** Một dòng trong danh sách quản trị: ảnh, tên, mô tả, nút sửa / lên / xuống / xoá */
export function ListRow({
  image,
  title,
  subtitle,
  editHref,
  onUp,
  onDown,
  onDelete,
  deleteConfirm,
}: {
  image?: string;
  title: string;
  subtitle?: React.ReactNode;
  editHref: string;
  onUp?: () => Promise<FormState>;
  onDown?: () => Promise<FormState>;
  onDelete: () => Promise<FormState>;
  deleteConfirm: string;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-3 sm:px-4">
      {image !== undefined &&
        (image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-14 w-11 shrink-0 rounded-md bg-sunken object-cover" />
        ) : (
          <div className="h-14 w-11 shrink-0 rounded-md bg-sunken" />
        ))}
      <Link href={editHref} className="min-w-0 flex-1">
        <p className="truncate font-semibold hover:text-accent">{title}</p>
        {subtitle && <div className="truncate text-xs text-muted">{subtitle}</div>}
      </Link>
      <div className="flex shrink-0 items-start gap-1.5">
        {onUp && (
          <ActionButton action={onUp} title="Đưa lên">
            ↑
          </ActionButton>
        )}
        {onDown && (
          <ActionButton action={onDown} title="Đưa xuống">
            ↓
          </ActionButton>
        )}
        <Link href={editHref} className="hidden rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-ink sm:inline-flex">
          Sửa
        </Link>
        <ActionButton action={onDelete} confirmText={deleteConfirm} danger title="Xoá">
          Xoá
        </ActionButton>
      </div>
    </li>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function NewButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft">
      + {children}
    </Link>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">{children}</p>;
}
