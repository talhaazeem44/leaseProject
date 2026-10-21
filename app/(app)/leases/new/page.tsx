import Link from "next/link";
import { Suspense } from "react";
import { getMarkupRatesCollection } from "@/lib/db/collections";
import { LeaseForm } from "./LeaseForm";

export default function NewLeasePage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">New Lease</h1>
        <Link
          href="/leases/print-blank"
          className="border border-neutral-300 dark:border-neutral-700 text-sm font-medium px-4 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Print Blank Form
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading form…</p>}>
        <NewLeaseFormLoader />
      </Suspense>
    </div>
  );
}

async function NewLeaseFormLoader() {
  const collection = await getMarkupRatesCollection();
  const rates = await collection.find().sort({ tenureMonths: 1 }).toArray();

  if (rates.length === 0) {
    return (
      <p className="text-sm text-red-600">
        No markup rates configured yet. Add at least one tenure/rate in{" "}
        <a href="/settings/markup-rates" className="underline">
          Markup Rate Settings
        </a>{" "}
        before creating a lease.
      </p>
    );
  }

  return (
    <LeaseForm
      rates={rates.map((r) => ({ tenureMonths: r.tenureMonths, ratePercent: r.ratePercent }))}
    />
  );
}
