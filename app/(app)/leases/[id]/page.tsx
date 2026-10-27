import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { getLeasesCollection } from "@/lib/db/collections";
import { computeTotals, computeExpensesTotal, computeLeaseProfit } from "@/lib/lease-calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { SectionHeader, InfoGrid, InfoField, Table, THead, Th, Td } from "@/components/Table";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { PaymentRow } from "./PaymentRow";
import { addLeaseExpense, deleteLeaseExpense, deleteLease } from "../actions";
import { CreatedToast } from "./CreatedToast";

const expenseInputClass = "border border-gold bg-white rounded px-1.5 py-1 text-xs";

export default function LeasePage({ params }: PageProps<"/leases/[id]">) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Suspense fallback={null}>
        <CreatedToast />
      </Suspense>
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
  const expenses = lease.expenses ?? [];
  const costPrice = bike.costPrice ?? 0;
  const totals = computeTotals(installments);
  const expensesTotal = computeExpensesTotal(expenses);
  const profit = computeLeaseProfit({
    rentCreditPrice: creditPlan.rentCreditPrice,
    costPrice,
    expensesTotal,
  });
  const leaseId = lease._id!.toString();
  const addExpenseAction = addLeaseExpense.bind(null, leaseId);
  const deleteLeaseAction = deleteLease.bind(null, leaseId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold">
          Lease — {customer.name} ({bike.model})
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/leases/${leaseId}/edit`}
            className="border border-gold text-sm font-medium px-4 py-2 rounded hover:bg-offwhite-dim"
          >
            Edit Lease
          </Link>
          <ActionForm
            action={deleteLeaseAction}
            successMessage="Lease deleted"
            confirmMessage={`Delete the lease for ${customer.name}? This also removes all recorded payments and expenses on it. This cannot be undone.`}
            redirectTo="/leases"
          >
            <SubmitButton
              pendingText="Deleting…"
              className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded"
            >
              Delete Lease
            </SubmitButton>
          </ActionForm>
        </div>
      </div>

      <div className="border border-gold rounded overflow-hidden">
        <SectionHeader>Profit Summary</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-offwhite-dim">
          <div>
            <div className="text-xs text-neutral-500">Revenue (Rent/Credit Price)</div>
            <div className="font-semibold">Rs. {formatCurrency(creditPlan.rentCreditPrice)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Cost Price</div>
            <div className="font-semibold">Rs. {formatCurrency(costPrice)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Expenses</div>
            <div className="font-semibold">Rs. {formatCurrency(expensesTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Net Profit</div>
            <div
              className={`text-xl font-bold ${profit >= 0 ? "text-emerald-700" : "text-red-600"}`}
            >
              Rs. {formatCurrency(profit)}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gold rounded overflow-hidden">
        <SectionHeader>Motorcycle Information</SectionHeader>
        <InfoGrid>
          <InfoField label="Chassis #" value={bike.chassisNo} />
          <InfoField label="Engine #" value={bike.engineNo} />
          <InfoField label="Purchase Date" value={formatDate(bike.purchaseDate)} />
          <InfoField label="Model" value={bike.model} />
          <InfoField label="Color" value={bike.color} />
          <InfoField label="Account No" value={bike.accountNo} />
          <InfoField label="Retail Price" value={`Rs. ${formatCurrency(bike.retailPrice)}`} />
          <InfoField label="Cost Price" value={`Rs. ${formatCurrency(costPrice)}`} />
        </InfoGrid>
      </div>

      <div className="border border-gold rounded overflow-hidden">
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
              className="w-32 h-32 object-cover border border-gold rounded"
              unoptimized
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-gold/50 rounded text-center text-xs text-neutral-500 italic">
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
              className="border border-gold rounded overflow-hidden"
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

      <div className="border border-gold rounded overflow-hidden">
        <SectionHeader>Credit Plan</SectionHeader>
        <InfoGrid>
          <InfoField label="File Ref No" value={creditPlan.fileRefNo} />
          <InfoField label="Dealership Name" value={creditPlan.dealershipName} />
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

      <div className="border border-gold rounded overflow-hidden">
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
            <Th>Bank</Th>
            <Th>Action</Th>
          </THead>
          <tbody>
            {installments.map((inst) => (
              <PaymentRow key={inst.sr} leaseId={leaseId} installment={inst} />
            ))}
            <tr className="bg-offwhite-dim font-semibold">
              <Td colSpan={4}>Total</Td>
              <Td>Rs. {formatCurrency(totals.totalReceived)}</Td>
              <Td>{formatCurrency(totals.totalShortOver)}</Td>
              <Td colSpan={6} />
            </tr>
          </tbody>
        </Table>
      </div>

      <div className="border border-gold rounded overflow-hidden">
        <SectionHeader>Expenses</SectionHeader>
        <Table>
          <THead>
            <Th>Date</Th>
            <Th>Description</Th>
            <Th>Amount</Th>
            <Th>Action</Th>
          </THead>
          <tbody>
            {expenses.map((expense) => {
              const deleteAction = deleteLeaseExpense.bind(null, leaseId, expense.id);
              return (
                <tr key={expense.id}>
                  <Td>{formatDate(expense.date)}</Td>
                  <Td>{expense.description}</Td>
                  <Td>Rs. {formatCurrency(expense.amount)}</Td>
                  <Td>
                    <ActionForm action={deleteAction} successMessage="Expense deleted">
                      <SubmitButton
                        pendingText="Deleting…"
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-medium px-3 py-1 rounded"
                      >
                        Delete
                      </SubmitButton>
                    </ActionForm>
                  </Td>
                </tr>
              );
            })}
            {expenses.length > 0 && (
              <tr className="bg-offwhite-dim font-semibold">
                <Td colSpan={2}>Total Expenses</Td>
                <Td>Rs. {formatCurrency(expensesTotal)}</Td>
                <Td />
              </tr>
            )}
            <tr className="bg-offwhite-dim">
              <Td colSpan={4}>
                <ActionForm
                  action={addExpenseAction}
                  successMessage="Expense added"
                  className="flex items-center gap-2 flex-wrap"
                >
                  <input type="date" name="date" required className={expenseInputClass} />
                  <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    required
                    className={expenseInputClass}
                  />
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    placeholder="Amount"
                    required
                    className={`${expenseInputClass} w-28`}
                  />
                  <SubmitButton
                    pendingText="Adding…"
                    className="bg-gold hover:bg-gold-dark disabled:opacity-60 text-white text-xs font-medium px-3 py-1 rounded"
                  >
                    + Add Expense
                  </SubmitButton>
                </ActionForm>
              </Td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
}
