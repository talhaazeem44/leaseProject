import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="bg-neutral-900 text-white px-6 py-3 flex items-center gap-6 print:hidden">
        <span className="font-bold">Lease Manager</span>
        <Link href="/dashboard" className="text-sm hover:underline">
          Dashboard
        </Link>
        <Link href="/leases" className="text-sm hover:underline">
          Leases
        </Link>
        <Link href="/reminders" className="text-sm hover:underline">
          Reminders
        </Link>
        <Link href="/settings/markup-rates" className="text-sm hover:underline">
          Markup Rates
        </Link>
        <form action={logout} className="ml-auto">
          <button type="submit" className="text-sm hover:underline cursor-pointer">
            Logout
          </button>
        </form>
      </nav>
      <div className="flex-1">{children}</div>
    </>
  );
}
