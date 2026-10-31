import type { ReactNode } from "react";

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="bg-sidebar text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide border-b-2 border-gold">
      {children}
    </div>
  );
}

export function InfoGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  const colsClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-x-6 gap-y-2 px-4 py-3 bg-offwhite-dim`}>
      {children}
    </div>
  );
}

export function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm min-w-0">
      <span className="font-medium min-w-[9rem] shrink-0 text-neutral-600">{label}</span>
      <span className="text-neutral-900 min-w-0 break-words">:&nbsp;{value ?? "—"}</span>
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-sidebar text-white">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2 text-left font-semibold whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-3 py-2 border-b border-gold/30 whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}
