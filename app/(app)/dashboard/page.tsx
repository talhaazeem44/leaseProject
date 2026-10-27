import Link from "next/link";
import { Suspense } from "react";
import {
  getLeasesCollection,
  getExpensesCollection,
  getInvestmentsCollection,
} from "@/lib/db/collections";
import {
  computeTotals,
  classifyInstallment,
  computeExpensesTotal,
  computeInvestmentsTotal,
  computeLeaseProfit,
  computeCashInHand,
} from "@/lib/lease-calculations";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { StatTile } from "@/components/StatTile";
import { Table, THead, Th, Td } from "@/components/Table";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading dashboard…</p>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const collection = await getLeasesCollection();
  const leases = await collection.find().sort({ createdAt: -1 }).toArray();
  const expensesCollection = await getExpensesCollection();
  const generalExpenses = await expensesCollection.find().toArray();
  const generalExpensesTotal = computeExpensesTotal(generalExpenses);
  const investmentsCollection = await getInvestmentsCollection();
  const investments = await investmentsCollection.find().toArray();
  const totalInvestment = computeInvestmentsTotal(investments);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let activeLeases = 0;
  let completedLeases = 0;
  let newThisMonth = 0;
  let totalFinanced = 0;
  let totalReceived = 0;
  let overdueCount = 0;
  let upcomingCount = 0;
  let totalBikeProfit = 0;
  let totalCostPrice = 0;
  let totalLeaseExpenses = 0;
  const modelCounts = new Map<string, number>();

  for (const lease of leases) {
    const isCompleted = lease.installments.every((i) => i.receivedAmount !== null);
    if (isCompleted) completedLeases++;
    else activeLeases++;

    if (lease.createdAt >= startOfMonth) newThisMonth++;

    totalFinanced += lease.creditPlan.creditAmount + lease.creditPlan.rentProfitAmount;
    totalReceived += computeTotals(lease.installments).totalReceived;

    const leaseExpensesTotal = computeExpensesTotal(lease.expenses ?? []);
    const costPrice = lease.bike.costPrice ?? 0;
    totalCostPrice += costPrice;
    totalLeaseExpenses += leaseExpensesTotal;

    totalBikeProfit += computeLeaseProfit({
      rentCreditPrice: lease.creditPlan.rentCreditPrice,
      costPrice,
      expensesTotal: leaseExpensesTotal,
    });

    for (const inst of lease.installments) {
      const bucket = classifyInstallment(inst.installmentDate, inst.receivedAmount, today);
      if (bucket === "overdue") overdueCount++;
      if (bucket === "upcoming") upcomingCount++;
    }

    modelCounts.set(lease.bike.model, (modelCounts.get(lease.bike.model) ?? 0) + 1);
  }

  const netProfit = totalBikeProfit - generalExpensesTotal;
  const cashInHand = computeCashInHand({
    totalReceived,
    totalInvestment,
    totalCostPrice,
    totalLeaseExpenses,
    totalGeneralExpenses: generalExpensesTotal,
  });

  const topModels = [...modelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxModelCount = topModels[0]?.[1] ?? 1;

  const recentLeases = leases.slice(0, 10);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Total applications" value={String(leases.length)} />
        <StatTile label="Active leases" value={String(activeLeases)} />
        <StatTile label="Completed leases" value={String(completedLeases)} />
        <StatTile label="New this month" value={String(newThisMonth)} />
        <StatTile label="Total financed" value={`Rs. ${formatCompactCurrency(totalFinanced)}`} />
        <StatTile label="Total received" value={`Rs. ${formatCompactCurrency(totalReceived)}`} />
        <StatTile
          label="Overdue installments"
          value={String(overdueCount)}
          tone={overdueCount > 0 ? "critical" : "default"}
        />
        <StatTile
          label="Due in 30 days"
          value={String(upcomingCount)}
          tone={upcomingCount > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Total profit (bikes)"
          value={`Rs. ${formatCompactCurrency(totalBikeProfit)}`}
          tone={totalBikeProfit < 0 ? "critical" : "default"}
        />
        <StatTile
          label="Business expenses"
          value={`Rs. ${formatCompactCurrency(generalExpensesTotal)}`}
        />
        <StatTile
          label="Net profit"
          value={`Rs. ${formatCompactCurrency(netProfit)}`}
          tone={netProfit < 0 ? "critical" : "default"}
        />
        <StatTile
          label="Your investment"
          value={`Rs. ${formatCompactCurrency(totalInvestment)}`}
        />
        <StatTile
          label="Cash in hand"
          value={`Rs. ${formatCompactCurrency(cashInHand)}`}
          tone={cashInHand < 0 ? "critical" : "default"}
          hint="Investment + received − bike costs − expenses"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gold rounded overflow-hidden">
          <div className="bg-sidebar text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide border-b-2 border-gold">
            Recent Applications
          </div>
          {recentLeases.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">No leases yet.</p>
          ) : (
            <Table>
              <THead>
                <Th>Customer</Th>
                <Th>Bike</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th />
              </THead>
              <tbody>
                {recentLeases.map((lease) => {
                  const isCompleted = lease.installments.every((i) => i.receivedAmount !== null);
                  return (
                    <tr key={lease._id!.toString()}>
                      <Td>{lease.customer.name}</Td>
                      <Td>{lease.bike.model}</Td>
                      <Td>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            isCompleted
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isCompleted ? "Completed" : "Active"}
                        </span>
                      </Td>
                      <Td>{formatDate(lease.createdAt)}</Td>
                      <Td>
                        <Link
                          href={`/leases/${lease._id!.toString()}`}
                          className="text-gold-dark hover:underline"
                        >
                          View
                        </Link>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>

        <div className="border border-gold rounded overflow-hidden">
          <div className="bg-sidebar text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide border-b-2 border-gold">
            Leases by Bike Model
          </div>
          {topModels.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">No leases yet.</p>
          ) : (
            <div className="p-4 space-y-2">
              {topModels.map(([model, count]) => (
                <div key={model} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 truncate text-neutral-700">{model}</span>
                  <div className="flex-1 bg-offwhite-dim rounded h-5 relative overflow-hidden">
                    <div
                      className="bg-gold h-full rounded"
                      style={{ width: `${(count / maxModelCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-medium text-neutral-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
