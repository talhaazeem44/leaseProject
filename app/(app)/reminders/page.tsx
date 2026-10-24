import Link from "next/link";
import { Suspense } from "react";
import { getLeasesCollection } from "@/lib/db/collections";
import { classifyInstallment } from "@/lib/lease-calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { Table, THead, Th, Td } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";

export default function RemindersPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Reminders</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading reminders…</p>}>
        <RemindersContent />
      </Suspense>
    </div>
  );
}

interface ReminderRow {
  leaseId: string;
  customerName: string;
  mobileNo: string;
  bikeModel: string;
  sr: number;
  installmentDate: Date;
  scheduledAmount: number;
}

async function RemindersContent() {
  const collection = await getLeasesCollection();
  const leases = await collection.find().toArray();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: ReminderRow[] = [];
  const upcoming: ReminderRow[] = [];

  for (const lease of leases) {
    for (const inst of lease.installments) {
      const bucket = classifyInstallment(inst.installmentDate, inst.receivedAmount, today);
      if (!bucket) continue;
      const row: ReminderRow = {
        leaseId: lease._id!.toString(),
        customerName: lease.customer.name,
        mobileNo: lease.customer.mobileNo,
        bikeModel: lease.bike.model,
        sr: inst.sr,
        installmentDate: inst.installmentDate,
        scheduledAmount: inst.scheduledAmount,
      };
      (bucket === "overdue" ? overdue : upcoming).push(row);
    }
  }

  overdue.sort((a, b) => a.installmentDate.getTime() - b.installmentDate.getTime());
  upcoming.sort((a, b) => a.installmentDate.getTime() - b.installmentDate.getTime());

  return (
    <>
      <ReminderSection title="Overdue" status="overdue" rows={overdue} />
      <ReminderSection title="Upcoming (next 30 days)" status="upcoming" rows={upcoming} />
    </>
  );
}

function ReminderSection({
  title,
  status,
  rows,
}: {
  title: string;
  status: "overdue" | "upcoming";
  rows: ReminderRow[];
}) {
  return (
    <div className="border border-gold rounded overflow-hidden">
      <div className="bg-sidebar text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide border-b-2 border-gold flex items-center justify-between">
        <span>{title}</span>
        <StatusBadge status={status} />
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-3 text-sm text-neutral-500">Nothing here.</p>
      ) : (
        <Table>
          <THead>
            <Th>Customer</Th>
            <Th>Mobile</Th>
            <Th>Bike</Th>
            <Th>Installment #</Th>
            <Th>Due Date</Th>
            <Th>Amount Due</Th>
            <Th />
          </THead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.leaseId}-${r.sr}`}>
                <Td>{r.customerName}</Td>
                <Td>{r.mobileNo}</Td>
                <Td>{r.bikeModel}</Td>
                <Td>{r.sr}</Td>
                <Td>{formatDate(r.installmentDate)}</Td>
                <Td>Rs. {formatCurrency(r.scheduledAmount)}</Td>
                <Td>
                  <Link
                    href={`/leases/${r.leaseId}`}
                    className="text-gold-dark hover:underline"
                  >
                    View Lease
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
