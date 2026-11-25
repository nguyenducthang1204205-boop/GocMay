"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { compressFileList } from "./compressImage";
import { btnGhost, btnPrimary, hint, input } from "./styles";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/** Form quản trị: hiện lỗi / thông báo thành công và trạng thái đang lưu */
export function AdminForm({
  action,
  children,
  submitLabel = "Lưu",
  className = "",
  resetOnSuccess = false,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Đang lưu…" : submitLabel}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p aria-live="polite" className="text-sm font-medium text-positive">✓ {state.ok}</p>;
  return null;
}

/** Nút đơn lẻ chạy một action (xoá, lên/xuống) — có hỏi xác nhận nếu cần */
export function ActionButton({
  action,
  children,
  confirmText,
  danger,
  title,
}: {
  action: () => Promise<FormState>;
  children: React.ReactNode;
  confirmText?: string;
  danger?: boolean;
  title?: string;
}) {
  const [state, formAction, pending] = useActionState(async () => action(), {});
  // Hỏi xác nhận ngay trên trang (bấm lần 1 → hiện "Chắc chắn xoá?"), không dùng hộp thoại của trình duyệt
  const [armed, setArmed] = useState(false);
  const needsConfirm = !!confirmText && !armed;

  return (
    <form action={formAction} className="inline-flex flex-col items-end" onSubmit={() => setArmed(false)}>
      <div className="flex gap-1.5">
        {armed && (
          <button type="button" onClick={() => setArmed(false)} className={`${btnGhost} px-3 py-1.5`}>
            Huỷ
          </button>
        )}
        {needsConfirm ? (
          // Nút "bật xác nhận" và nút gửi là hai phần tử khác nhau (key khác nhau): nếu chỉ đổi
          // type="button" → "submit" trên cùng một nút, cú bấm đầu tiên sẽ gửi form luôn.
          <button
            key="arm"
            type="button"
            onClick={() => setArmed(true)}
            title={title}
            aria-label={title}
            className={`${btnGhost} px-3 py-1.5 ${danger ? "text-red-700 hover:border-red-400" : ""}`}
          >
            {children}
          </button>
        ) : (
          <button
            key="submit"
            type="submit"
            disabled={pending}
            title={armed ? confirmText : title}
            aria-label={armed ? confirmText : title}
            className={
              armed
                ? "inline-flex items-center rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                : `${btnGhost} px-3 py-1.5 ${danger ? "text-red-700 hover:border-red-400" : ""}`
            }
          >
            {pending ? "…" : armed ? "Chắc chắn xoá?" : children}
          </button>
        )}
      </div>
      {armed && confirmText && <span className="mt-1 max-w-64 text-right text-xs text-muted">{confirmText}</span>}
      {state.error && <span className="mt-1 max-w-56 text-right text-xs text-red-700">{state.error}</span>}
    </form>
  );
}

/**
 * Quản lý ảnh: sắp xếp / bỏ ảnh cũ, chọn file mới, hoặc dán link ảnh.
 * Gửi lên server các trường: keep (ảnh cũ giữ lại), files (file mới), urls (link).
 */
export function PhotoManager({
  initial,
  max,
  field = "",
  hintText,
  aspect = "aspect-[3/4]",
}: {
  initial: string[];
  max?: number;
  /** Tiền tố tên trường khi một form có nhiều ô ảnh (VD: "qr_" → qr_keep, qr_files, qr_urls) */
  field?: string;
  hintText?: string;
  aspect?: string;
}) {
  const [kept, setKept] = useState(initial);
  const [previews, setPreviews] = useState<{ url: string; name: string; tooBig: boolean }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const single = max === 1;

  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= kept.length) return;
    const next = [...kept];
    [next[i], next[j]] = [next[j], next[i]];
    setKept(next);
  };

  const [compressing, setCompressing] = useState(false);

  // Nén ảnh trên trình duyệt rồi thay file trong ô chọn bằng bản đã nén.
  // Trong lúc nén, ô chọn báo "chưa hợp lệ" để form không gửi ảnh gốc đi.
  const onFiles = async (input: HTMLInputElement) => {
    const files = input.files;
    if (!files?.length) {
      setPreviews([]);
      return;
    }
    setCompressing(true);
    input.setCustomValidity("Đang nén ảnh, đợi vài giây rồi bấm Lưu nhé.");
    try {
      input.files = await compressFileList(files);
    } finally {
      input.setCustomValidity("");
      setCompressing(false);
    }
    setPreviews(
      Array.from(input.files ?? []).map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
        tooBig: f.size > 10 * 1024 * 1024,
      })),
    );
  };

  const clearFiles = () => {
    if (fileRef.current) fileRef.current.value = "";
    setPreviews([]);
  };

  return (
    <div className="space-y-3">
      {kept.length > 0 && (
        <ul className={single ? "grid w-40 grid-cols-1" : "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"}>
          {kept.map((src, i) => (
            <li key={src} className="group relative">
              <input type="hidden" name={`${field}keep`} value={src} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className={`${aspect} w-full rounded-lg bg-sunken object-cover`} />
              {i === 0 && !single && (
                <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-ink">Ảnh bìa</span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                {!single && (
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Đưa lên trước" className="h-7 w-7 rounded-md bg-surface/90 text-sm shadow disabled:opacity-30">←</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === kept.length - 1} aria-label="Đưa ra sau" className="h-7 w-7 rounded-md bg-surface/90 text-sm shadow disabled:opacity-30">→</button>
                  </span>
                )}
                <button type="button" onClick={() => setKept(kept.filter((x) => x !== src))} aria-label="Bỏ ảnh này" className="ml-auto h-7 w-7 rounded-md bg-red-600/90 text-sm text-white shadow">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-3">
        <label className="block text-sm font-medium">
          {single ? (kept.length ? "Đổi ảnh" : "Tải ảnh lên") : "Thêm ảnh từ máy"}
          <input
            ref={fileRef}
            type="file"
            name={`${field}files`}
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple={!single}
            onChange={(e) => onFiles(e.currentTarget)}
            className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </label>
        <p className={hint} aria-live="polite">
          {compressing
            ? "Đang nén ảnh…"
            : hintText ?? "JPG, PNG, WEBP, AVIF — web tự nén về WEBP, cạnh dài 1600px trước khi tải lên. Ảnh dọc 3:4 hiển thị đẹp nhất."}
        </p>
        {previews.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-2">
              {previews.map((p) => (
                <figure key={p.url} className="w-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className={`aspect-[3/4] w-16 rounded-md object-cover ${p.tooBig ? "ring-2 ring-red-500" : ""}`} />
                  {p.tooBig && <figcaption className="text-[10px] text-red-700">Quá 10MB</figcaption>}
                </figure>
              ))}
            </div>
            <button type="button" onClick={clearFiles} className="mt-1 text-xs font-medium text-accent hover:underline">
              Bỏ chọn {previews.length} ảnh
            </button>
          </div>
        )}
      </div>

      <label className="block text-sm font-medium">
        Hoặc dán link ảnh <span className="font-normal text-muted">(mỗi dòng một link)</span>
        <textarea name={`${field}urls`} rows={single ? 1 : 2} placeholder="https://…" className={`mt-1 resize-y ${input}`} />
      </label>
    </div>
  );
}
