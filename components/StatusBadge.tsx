export type Status = "overdue" | "upcoming" | "paid" | "advance";

const styles: Record<Status, string> = {
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  upcoming: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  advance: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

const labels: Record<Status, string> = {
  overdue: "Overdue",
  upcoming: "Upcoming",
  paid: "Paid",
  advance: "Advance",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
