"use client";

// Hộp thoại dựa trên <dialog> gốc của trình duyệt: có sẵn khoá focus,
// phím Esc, vùng ngoài bị vô hiệu hoá (inert) — không cần thư viện.
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  /** Mobile: trượt từ dưới lên. Desktop: hộp giữa màn hình.
   *  Luôn tự đặt màu chữ — <dialog> kế thừa màu từ chỗ đặt nút mở (VD: khung nền tối). */
  sheet:
    "m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-[28px] bg-canvas text-ink shadow-2xl sm:m-auto sm:max-w-xl sm:rounded-[28px]",
  /** Phủ kín màn hình (xem ảnh). */
  fullscreen: "m-0 h-dvh max-h-none w-screen max-w-none bg-ink text-canvas",
} as const;

export function Dialog({
  open,
  onClose,
  children,
  labelledBy,
  label,
  variant = "sheet",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id của tiêu đề bên trong hộp thoại */
  labelledBy?: string;
  /** Dùng khi hộp thoại không có tiêu đề hiển thị */
  label?: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClose={onClose}
      // Bấm ra vùng tối bên ngoài nội dung để đóng
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn("overflow-hidden p-0 backdrop:bg-transparent", VARIANTS[variant], className)}
    >
      {open && children}
    </dialog>
  );
}
