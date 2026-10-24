import { Suspense } from "react";
import { getMarkupRatesCollection } from "@/lib/db/collections";
import { Table, THead, Th, Td } from "@/components/Table";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { createMarkupRate, updateMarkupRate, deleteMarkupRate } from "./actions";

const inputClass = "w-24 border border-gold bg-white rounded px-2 py-1 text-sm";

export default function MarkupRatesPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Markup Rate Settings</h1>
        <p className="text-sm text-neutral-500">
          Configure the markup/profit percentage applied per tenure. New leases look up the rate
          for the chosen tenure at creation time; existing leases keep the rate they were created
          with.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading rates…</p>}>
        <RatesTable />
      </Suspense>
    </div>
  );
}

async function RatesTable() {
  const collection = await getMarkupRatesCollection();
  const rates = await collection.find().sort({ tenureMonths: 1 }).toArray();

  return (
    <div className="border border-gold rounded overflow-hidden">
      <Table>
        <THead>
          <Th>Tenure (months)</Th>
          <Th>Rate (%)</Th>
          <Th>Label</Th>
          <Th />
        </THead>
        <tbody>
          {rates.map((rate) => {
            const id = rate._id!.toString();
            const updateAction = updateMarkupRate.bind(null, id);
            const deleteAction = deleteMarkupRate.bind(null, id);
            return (
              <tr key={id}>
                <Td colSpan={3}>
                  <ActionForm
                    action={updateAction}
                    successMessage="Rate updated"
                    className="flex items-center gap-2"
                  >
                    <input
                      name="tenureMonths"
                      type="number"
                      defaultValue={rate.tenureMonths}
                      required
                      className={inputClass}
                    />
                    <input
                      name="ratePercent"
                      type="number"
                      step="0.01"
                      defaultValue={rate.ratePercent}
                      required
                      className={inputClass}
                    />
                    <input
                      name="label"
                      type="text"
                      defaultValue={rate.label ?? ""}
                      placeholder="Label"
                      className={`${inputClass} w-36`}
                    />
                    <SubmitButton className="bg-gold hover:bg-gold-dark disabled:opacity-60 text-white text-xs font-medium px-3 py-1 rounded">
                      Save
                    </SubmitButton>
                  </ActionForm>
                </Td>
                <Td>
                  <ActionForm action={deleteAction} successMessage="Rate deleted">
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
          <tr className="bg-offwhite-dim">
            <Td colSpan={4}>
              <ActionForm
                action={createMarkupRate}
                successMessage="Rate added"
                className="flex items-center gap-2"
              >
                <input
                  name="tenureMonths"
                  type="number"
                  placeholder="Months"
                  required
                  className={inputClass}
                />
                <input
                  name="ratePercent"
                  type="number"
                  step="0.01"
                  placeholder="Rate %"
                  required
                  className={inputClass}
                />
                <input
                  name="label"
                  type="text"
                  placeholder="Label (optional)"
                  className={`${inputClass} w-36`}
                />
                <SubmitButton
                  pendingText="Adding…"
                  className="bg-gold hover:bg-gold-dark disabled:opacity-60 text-white text-xs font-medium px-3 py-1 rounded"
                >
                  + Add Rate
                </SubmitButton>
              </ActionForm>
            </Td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}
