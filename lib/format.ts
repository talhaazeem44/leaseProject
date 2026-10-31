export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Math.round(amount));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .toUpperCase();
}

export function formatDateInput(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
