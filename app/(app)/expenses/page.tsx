import { Suspense } from "react";
import {
  getExpensesCollection,
  getInvestmentsCollection,
  getLeasesCollection,
} from "@/lib/db/collections";
import {
  computeExpensesTotal,
  computeInvestmentsTotal,
  computeTotals,
  computeCashInHand,
} from "@/lib/lease-calculations";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/format";
import { Table, THead, Th, Td, SectionHeader } from "@/components/Table";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { createExpense, deleteExpense, createInvestment, deleteInvestment } from "./actions";

const inputClass = "border border-gold bg-white rounded px-2 py-1 text-sm";

export default function ExpensesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Expenses &amp; Cash</h1>
        <p className="text-sm text-neutral-500">
          Capital you&apos;ve invested in the business, and general running costs (rent,
          salaries, utilities, etc.) that aren&apos;t tied to a specific bike or lease.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <CashInHandSummary />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <InvestmentsTable />
      </Suspense>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <ExpensesTable />
      </Suspense>
    </div>
  );
}

async function CashInHandSummary() {
  const [expensesCollection, investmentsCollection, leasesCollection] = await Promise.all([
    getExpensesCollection(),
    getInvestmentsCollection(),
    getLeasesCollection(),
  ]);
  const [generalExpenses, investments, leases] = await Promise.all([
    expensesCollection.find().toArray(),
    investmentsCollection.find().toArray(),
    leasesCollection.find().toArray(),
  ]);

  const generalExpensesTotal = computeExpensesTotal(generalExpenses);
  const totalInvestment = computeInvestmentsTotal(investments);
  let totalReceived = 0;
  let totalCostPrice = 0;
  let totalLeaseExpenses = 0;
  for (const lease of leases) {
    totalReceived += computeTotals(lease.installments).totalReceived;
    totalCostPrice += lease.bike.costPrice ?? 0;
    totalLeaseExpenses += computeExpensesTotal(lease.expenses ?? []);
  }

  const cashInHand = computeCashInHand({
    totalReceived,
    totalInvestment,
    totalCostPrice,
    totalLeaseExpenses,
    totalGeneralExpenses: generalExpensesTotal,
  });

  return (
    <div className="border border-gold rounded overflow-hidden">
      <SectionHeader>Cash in Hand</SectionHeader>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-offwhite-dim">
        <div>
          <div className="text-xs text-neutral-500">Your Investment</div>
          <div className="font-semibold">Rs. {formatCurrency(totalInvestment)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Received from Customers</div>
          <div className="font-semibold">Rs. {formatCurrency(totalReceived)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Spent on Bikes</div>
          <div className="font-semibold">Rs. {formatCurrency(totalCostPrice)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Lease Expenses</div>
          <div className="font-semibold">Rs. {formatCurrency(totalLeaseExpenses)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Business Expenses</div>
          <div className="font-semibold">Rs. {formatCurrency(generalExpensesTotal)}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Cash in Hand</div>
          <div
            className={`text-xl font-bold ${cashInHand >= 0 ? "text-emerald-700" : "text-red-600"}`}
          >
            Rs. {formatCurrency(cashInHand)}
          </div>
        </div>
      </div>
    </div>
  );
}

async function InvestmentsTable() {
  const collection = await getInvestmentsCollection();
  const investments = await collection.find().sort({ date: -1 }).toArray();
  const total = computeInvestmentsTotal(investments);
  const today = formatDateInput(new Date());

  return (
    <div className="border border-gold rounded overflow-hidden">
      <SectionHeader>Capital Investment</SectionHeader>
      <Table>
        <THead>
          <Th>Date</Th>
          <Th>Description</Th>
          <Th>Amount</Th>
          <Th />
        </THead>
        <tbody>
          {investments.map((investment) => {
            const id = investment._id!.toString();
            const deleteAction = deleteInvestment.bind(null, id);
            return (
              <tr key={id}>
                <Td>{formatDate(investment.date)}</Td>
                <Td>{investment.description || "—"}</Td>
                <Td>Rs. {formatCurrency(investment.amount)}</Td>
                <Td>
                  <ActionForm action={deleteAction} successMessage="Investment deleted">
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
          {investments.length > 0 && (
            <tr className="bg-offwhite-dim font-semibold">
              <Td colSpan={2}>Total</Td>
              <Td>Rs. {formatCurrency(total)}</Td>
              <Td />
            </tr>
          )}
          <tr className="bg-offwhite-dim">
            <Td colSpan={4}>
              <ActionForm
                action={createInvestment}
                successMessage="Investment added"
                className="flex items-center gap-2 flex-wrap"
              >
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClass}
                />
                <input
                  name="description"
                  type="text"
                  placeholder="Description (e.g. Starting capital)"
                  className={`${inputClass} w-56`}
                />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  required
                  className={`${inputClass} w-28`}
                />
                <SubmitButton
                  pendingText="Adding…"
                  className="bg-gold hover:bg-gold-dark disabled:opacity-60 text-white text-xs font-medium px-3 py-1 rounded"
                >
                  + Add Investment
                </SubmitButton>
              </ActionForm>
            </Td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

async function ExpensesTable() {
  const collection = await getExpensesCollection();
  const expenses = await collection.find().sort({ date: -1 }).toArray();
  const total = computeExpensesTotal(expenses);
  const today = formatDateInput(new Date());

  return (
    <div className="border border-gold rounded overflow-hidden">
      <SectionHeader>Business Expenses</SectionHeader>
      <Table>
        <THead>
          <Th>Date</Th>
          <Th>Category</Th>
          <Th>Description</Th>
          <Th>Amount</Th>
          <Th />
        </THead>
        <tbody>
          {expenses.map((expense) => {
            const id = expense._id!.toString();
            const deleteAction = deleteExpense.bind(null, id);
            return (
              <tr key={id}>
                <Td>{formatDate(expense.date)}</Td>
                <Td>{expense.category}</Td>
                <Td>{expense.description || "—"}</Td>
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
              <Td colSpan={3}>Total</Td>
              <Td>Rs. {formatCurrency(total)}</Td>
              <Td />
            </tr>
          )}
          <tr className="bg-offwhite-dim">
            <Td colSpan={5}>
              <ActionForm
                action={createExpense}
                successMessage="Expense added"
                className="flex items-center gap-2 flex-wrap"
              >
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClass}
                />
                <input
                  name="category"
                  type="text"
                  placeholder="Category (e.g. Rent)"
                  required
                  className={inputClass}
                />
                <input
                  name="description"
                  type="text"
                  placeholder="Description (optional)"
                  className={`${inputClass} w-44`}
                />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  required
                  className={`${inputClass} w-28`}
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
  );
}
