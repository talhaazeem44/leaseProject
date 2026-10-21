import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ObjectId } from "mongodb";
import { getLeasesCollection } from "@/lib/db/collections";
import { computeTotals } from "@/lib/lease-calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { SectionHeader, InfoGrid, InfoField, Table, THead, Th, Td } from "@/components/Table";
import { PaymentRow } from "./PaymentRow";

export default function LeasePage({ params }: PageProps<"/leases/[id]">) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading lease…</p>}>
        <LeaseDetail params={params} />
      </Suspense>
    </div>
  );
}

async function LeaseDetail({ params }: Pick<PageProps<"/leases/[id]">, "params">) {
  const { id } = await params;

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    notFound();
  }

  const collection = await getLeasesCollection();
  const lease = await collection.findOne({ _id: objectId });
  if (!lease) notFound();

  const { bike, customer, guarantors, creditPlan, installments } = lease;
  const totals = computeTotals(installments);
  const leaseId = lease._id!.toString();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">
        Lease — {customer.name} ({bike.model})
      </h1>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded overflow-hidden">
        <SectionHeader>Motorcycle Information</SectionHeader>
        <InfoGrid>
          <InfoField label="Chassis #" value={bike.chassisNo} />
          <InfoField label="Engine #" value={bike.engineNo} />
          <InfoField label="Purchase Date" value={formatDate(bike.purchaseDate)} />
          <InfoField label="Model" value={bike.model} />
          <InfoField label="Color" value={bike.color} />
          <InfoField label="Account No" value={bike.accountNo} />
          <InfoField label="Retail Price" value={`Rs. ${formatCurrency(bike.retailPrice)}`} />
        </InfoGrid>
      </div>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded overflow-hidden">
        <SectionHeader>Customer Information</SectionHeader>
        <div className="flex flex-col-reverse sm:flex-row gap-4">
        <div className="flex-1">
        <InfoGrid>
          <InfoField label="Name" value={customer.name} />
          <InfoField label="Father Name" value={customer.fatherName} />
          <InfoField label="Gender" value={customer.gender} />
          <InfoField label="NIC" value={customer.nic} />
          <InfoField label="Date of Birth" value={formatDate(customer.dob)} />
          <InfoField label="Age Group" value={customer.ageGroup} />
          <InfoField label="Marital Status" value={customer.maritalStatus} />
          <InfoField label="Residential Status" value={customer.residentialStatus} />
          <InfoField label="Address" value={customer.address} />
          <InfoField label="City" value={customer.city} />
          <InfoField label="Mobile No" value={customer.mobileNo} />
          <InfoField label="Email Address" value={customer.email} />
          <InfoField label="Education" value={customer.education} />
          <InfoField label="Profession" value={customer.profession} />
          <InfoField label="Bike Change Cycle" value={customer.bikeChangeCycle} />
          <InfoField label="Credit Sale Type" value={customer.creditSaleType} />
          <InfoField label="Bike Key No" value={customer.bikeKeyNo} />
          <InfoField label="Business Address" value={customer.businessAddress} />
          <InfoField label="Business Contact #" value={customer.businessContactNo} />
          <InfoField
            label="Pre-Delivery Safety Advice"
            value={customer.preDeliverySafetyAdvice ? "Yes" : "No"}
          />
        </InfoGrid>
        </div>
        <div className="shrink-0 px-4 pt-3 sm:pt-0 sm:pr-4">
          {customer.photoUrl ? (
            <Image
              src={customer.photoUrl}
              alt={`Photo of ${customer.name}`}
              width={128}
              height={128}
              className="w-32 h-32 object-cover border border-neutral-300 dark:border-neutral-700 rounded"
              unoptimized
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-neutral-400 dark:border-neutral-600 rounded text-center text-xs text-neutral-500 italic">
              Insert Photo Here
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((idx) => {
          const g = guarantors[idx];
          return (
            <div
              key={idx}
              className="border border-neutral-200 dark:border-neutral-800 rounded overflow-hidden"
            >
              <SectionHeader>Guarantor {idx + 1}</SectionHeader>
              {g ? (
                <InfoGrid>
                  <InfoField label="Name" value={g.name} />
                  <InfoField label="Father's Name" value={g.fatherName} />
                  <InfoField label="NIC #" value={g.nic} />
                  <InfoField label="Mobile #" value={g.mobileNo} />
                  <InfoField label="Address" value={g.address} />
                  <InfoField label="Residential Status" value={g.residentialStatus} />
                  <InfoField label="Occupation" value={g.occupation} />
                  <InfoField label="Monthly Income" value={formatCurrency(g.monthlyIncome)} />
                  <InfoField label="Relation" value={g.relation} />
                  <InfoField label="Business Address" value={g.businessAddress} />
                  <InfoField label="Business Contact #" value={g.businessContactNo} />
                </InfoGrid>
              ) : (
                <p className="px-4 py-3 text-sm text-neutral-500">Not provided</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded overflow-hidden">
        <SectionHeader>Credit Plan</SectionHeader>
        <InfoGrid>
          <InfoField label="File Ref No" value={creditPlan.fileRefNo} />
          <InfoField label="Retail Price" value={`Rs. ${formatCurrency(creditPlan.retailPrice)}`} />
          <InfoField label="Starting Month" value={formatDate(creditPlan.startingMonth)} />
          <InfoField
            label="Rent / Credit Price"
            value={`Rs. ${formatCurrency(creditPlan.rentCreditPrice)}`}
          />
          <InfoField label="No of Installments" value={creditPlan.numberOfInstallments} />
          <InfoField label="Advance" value={`Rs. ${formatCurrency(creditPlan.advance)}`} />
          <InfoField
            label="Registration Fee"
            value={`Rs. ${formatCurrency(creditPlan.registrationFee)}`}
          />
          <InfoField
            label="Document Charges"
            value={`Rs. ${formatCurrency(creditPlan.documentCharges)}`}
          />
          <InfoField label="Rent / Profit Rate" value={`${creditPlan.rentProfitRatePercent}%`} />
          <InfoField
            label="Rent / Profit Amount"
            value={`Rs. ${formatCurrency(creditPlan.rentProfitAmount)}`}
          />
          <InfoField label="Credit Amount" value={`Rs. ${formatCurrency(creditPlan.creditAmount)}`} />
        </InfoGrid>
      </div>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded overflow-hidden">
        <SectionHeader>Installment Schedule</SectionHeader>
        <Table>
          <THead>
            <Th>Sr</Th>
            <Th>Installment Date</Th>
            <Th>Scheduled Amount</Th>
            <Th>Received Date</Th>
            <Th>Received Amount</Th>
            <Th>Short(-) / Over(+)</Th>
            <Th>Remaining Balance</Th>
            <Th>Late Charges</Th>
            <Th>Payment Details</Th>
            <Th>Cheque #</Th>
            <Th>Action</Th>
          </THead>
          <tbody>
            {installments.map((inst) => (
              <PaymentRow key={inst.sr} leaseId={leaseId} installment={inst} />
            ))}
            <tr className="bg-neutral-100 dark:bg-neutral-800 font-semibold">
              <Td colSpan={4}>Total</Td>
              <Td>Rs. {formatCurrency(totals.totalReceived)}</Td>
              <Td>{formatCurrency(totals.totalShortOver)}</Td>
              <Td colSpan={5} />
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
}
