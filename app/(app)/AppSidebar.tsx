"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leases", label: "Leases" },
  { href: "/reminders", label: "Reminders" },
  { href: "/expenses", label: "Expenses" },
  { href: "/settings/markup-rates", label: "Markup Rates" },
];

const linkClass = "block px-3 py-2 rounded text-sm font-medium hover:bg-sidebar-hover hover:text-gold-light";

function PlainNavLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      {links.map((link) => (
        <Link key={link.href} href={link.href} onClick={onNavigate} className={linkClass}>
          {link.label}
        </Link>
      ))}
    </>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`${linkClass} ${active ? "bg-sidebar-hover text-gold-light" : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <div className="lg:hidden flex items-center justify-between bg-sidebar text-white px-4 py-3 border-b-2 border-gold print:hidden">
        <span className="font-bold text-lg text-gold-light">Sami Electronics</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-white flex flex-col border-r-2 border-gold transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto lg:w-56 lg:translate-x-0 print:hidden`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gold/40">
          <span className="font-bold text-lg text-gold-light">Sami Electronics</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="lg:hidden p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-3">
          <Suspense fallback={<PlainNavLinks onNavigate={close} />}>
            <ActiveNavLinks onNavigate={close} />
          </Suspense>
        </nav>
        <form action={logout} className="p-3 border-t border-gold/40">
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded text-sm font-medium hover:bg-sidebar-hover hover:text-gold-light cursor-pointer"
          >
            Logout
          </button>
        </form>
      </aside>
    </>
  );
}
