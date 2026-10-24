import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";

const navLinkClass =
  "block px-3 py-2 rounded text-sm font-medium hover:bg-neutral-800";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 min-h-screen print:block print:min-h-0">
      <aside className="w-56 shrink-0 bg-neutral-900 text-white flex flex-col print:hidden">
        <div className="px-4 py-4 border-b border-neutral-800">
          <span className="font-bold text-lg">Sami Electronics</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-3">
          <Link href="/dashboard" className={navLinkClass}>
            Dashboard
          </Link>
          <Link href="/leases" className={navLinkClass}>
            Leases
          </Link>
          <Link href="/reminders" className={navLinkClass}>
            Reminders
          </Link>
          <Link href="/settings/markup-rates" className={navLinkClass}>
            Markup Rates
          </Link>
        </nav>
        <form action={logout} className="p-3 border-t border-neutral-800">
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded text-sm font-medium hover:bg-neutral-800 cursor-pointer"
          >
            Logout
          </button>
        </form>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
