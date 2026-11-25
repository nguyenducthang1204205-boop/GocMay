"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Copy chữ vào clipboard, trả về trạng thái "đã copy" trong vài giây. */
export function useClipboard(resetAfter = 2500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetAfter);
        return true;
      } catch {
        // Trình duyệt chặn clipboard: khách vẫn tự copy được từ ô xem trước
        return false;
      }
    },
    [resetAfter],
  );

  return { copied, copy };
}
