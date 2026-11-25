"use client";

import { useActionState } from "react";
import { btnPrimary, input } from "@/components/admin/styles";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="mt-5 space-y-3">
      <label className="block text-sm font-medium">
        Mật khẩu
        <input name="password" type="password" required autoFocus autoComplete="current-password" className={`mt-1 ${input}`} />
      </label>
      {state.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full py-3`}>
        {pending ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>
    </form>
  );
}
