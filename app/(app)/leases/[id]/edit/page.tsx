import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { getLeasesCollection, getMarkupRatesCollection } from "@/lib/db/collections";
import { LeaseForm } from "../../new/LeaseForm";

export default function EditLeasePage({ params }: PageProps<"/leases/[id]/edit">) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Edit Lease</h1>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <EditLeaseFormLoader params={params} />
      </Suspense>
    </div>
  );
}

async function EditLeaseFormLoader({ params }: Pick<PageProps<"/leases/[id]/edit">, "params">) {
  const { id } = await params;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    notFound();
  }

  const [leasesCollection, ratesCollection] = await Promise.all([
    getLeasesCollection(),
    getMarkupRatesCollection(),
  ]);
  const [lease, rates] = await Promise.all([
    leasesCollection.findOne({ _id: objectId }),
    ratesCollection.find().sort({ tenureMonths: 1 }).toArray(),
  ]);

  if (!lease) notFound();

  if (rates.length === 0) {
    return (
      <p className="text-sm text-red-600">
        No markup rates configured yet. Add at least one tenure/rate in{" "}
        <a href="/settings/markup-rates" className="underline">
          Markup Rate Settings
        </a>{" "}
        before editing leases.
      </p>
    );
  }

  const hasRecordedPayments = lease.installments.some(
    (i) => i.sr > 0 && i.receivedAmount !== null
  );

  return (
    <LeaseForm
      rates={rates.map((r) => ({ tenureMonths: r.tenureMonths, ratePercent: r.ratePercent }))}
      editing={{
        leaseId: lease._id!.toString(),
        bike: lease.bike,
        customer: lease.customer,
        guarantors: lease.guarantors,
        creditPlan: lease.creditPlan,
        hasRecordedPayments,
      }}
    />
  );
}
