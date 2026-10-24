import { Suspense } from "react";
import { getExpensesCollection } from "@/lib/db/collections";
import { computeExpensesTotal } from "@/lib/lease-calculations";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/format";
import { Table, THead, Th, Td } from "@/components/Table";
import { createExpense, deleteExpense } from "./actions";

const inputClass = "border border-gold bg-white rounded px-2 py-1 text-sm";

export default function ExpensesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Business Expenses</h1>
        <p className="text-sm text-neutral-500">
          General running costs (rent, salaries, utilities, etc.) that aren&apos;t tied to a
          specific bike or lease. These reduce overall business profit on the Dashboard.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading expenses…</p>}>
        <ExpensesTable />
      </Suspense>
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
                  <form action={deleteAction}>
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </form>
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
              <form action={createExpense} className="flex items-center gap-2 flex-wrap">
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
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-dark text-white text-xs font-medium px-3 py-1 rounded"
                >
                  + Add Expense
                </button>
              </form>
            </Td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}
