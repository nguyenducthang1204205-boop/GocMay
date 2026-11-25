"use client";

import { useId, useState } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { formatShort } from "@/lib/availability";
import { BookingForm, type BookingFormProps } from "./BookingForm";

/** Hộp thoại soạn tin nhắn đặt lịch (điều khiển từ bên ngoài). */
export function BookingDialog({
  open,
  onClose,
  initialDate,
  ...formProps
}: BookingFormProps & { open: boolean; onClose: () => void; initialDate?: string }) {
  const titleId = useId();
  const who = formProps.recipient;
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <div className="max-h-[92dvh] overflow-y-auto overscroll-contain p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Đặt lịch{initialDate ? ` · ${formatShort(initialDate)}` : ""}
            </p>
            <h2 id={titleId} className="mt-2 font-serif text-3xl leading-tight">
              {who ? `Nhắn cho ${who}` : "Nhắn cho studio"}
            </h2>
            <p className="mt-1.5 text-sm text-muted">Điền vài thông tin, web soạn sẵn tin nhắn cho bạn.</p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line-strong bg-white text-ink transition hover:border-ink hover:bg-ink hover:text-canvas"
          >
            <Icon name="close" />
          </button>
        </div>
        <BookingForm {...formProps} initialDate={initialDate} />
      </div>
    </Dialog>
  );
}

/** Nút mở hộp thoại soạn tin nhắn đặt lịch. */
export function BookingDialogButton({
  label,
  variant = "primary",
  size = "md",
  block,
  className,
  ...formProps
}: BookingFormProps & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} block={block} className={className} icon="arrowRight" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <BookingDialog {...formProps} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
