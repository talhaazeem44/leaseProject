"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const inputClass = "w-full border border-gold bg-white rounded px-2 py-1.5 text-sm";
const labelClass = "block text-xs font-medium text-neutral-600 mb-1";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(
    login,
    undefined
  );

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 bg-offwhite border-2 border-gold rounded-lg p-6 shadow-lg"
      >
        <h1 className="text-xl font-bold text-center text-gold-dark">Sami Electronics</h1>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {state.error}
          </p>
        )}

        <div>
          <label className={labelClass}>Username</label>
          <input name="username" type="text" required autoFocus className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input name="password" type="password" required className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gold hover:bg-gold-dark disabled:opacity-60 text-white font-medium px-4 py-2 rounded text-sm"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
