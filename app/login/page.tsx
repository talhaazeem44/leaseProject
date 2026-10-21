"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const inputClass =
  "w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-2 py-1.5 text-sm";
const labelClass = "block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(
    login,
    undefined
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 border border-neutral-200 dark:border-neutral-800 rounded p-6"
      >
        <h1 className="text-xl font-bold text-center">Lease Manager Login</h1>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded px-3 py-2">
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
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded text-sm"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
