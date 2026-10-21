import type { ReactNode } from "react";

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="bg-neutral-800 text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
      {children}
    </div>
  );
}

export function InfoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-900">
      {children}
    </div>
  );
}

export function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-medium min-w-[9rem] text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
      <span className="text-neutral-900 dark:text-neutral-100">:&nbsp;{value ?? "—"}</span>
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
    <thead className="bg-neutral-800 text-white">
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
      className={`px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}
