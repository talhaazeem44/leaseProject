"use client";

import { useTransition } from "react";
import { Td } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { recordPayment } from "../actions";
import type { Installment } from "@/lib/models/lease";

const inputClass =
  "w-28 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-1.5 py-1 text-xs";

function reminderStatus(installmentDate: Date, receivedAmount: number | null) {
  if (receivedAmount !== null) return "paid" as const;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (new Date(installmentDate).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
  return diffDays < 0 ? ("overdue" as const) : ("upcoming" as const);
}

export function PaymentRow({
  leaseId,
  installment,
}: {
  leaseId: string;
  installment: Installment;
}) {
  const [isPending, startTransition] = useTransition();
  const isPaid = installment.receivedAmount !== null;
  const boundAction = recordPayment.bind(null, leaseId, installment.sr);

  if (installment.sr === 0) {
    return (
      <tr className="italic text-emerald-700 dark:text-emerald-400">
        <Td>{installment.sr}</Td>
        <Td>{formatDate(installment.installmentDate)}</Td>
        <Td>{formatCurrency(installment.scheduledAmount)}</Td>
        <Td>{formatDate(installment.receivedDate)}</Td>
        <Td>{formatCurrency(installment.receivedAmount ?? 0)}</Td>
        <Td>{installment.shortOver ?? 0}</Td>
        <Td>{formatCurrency(installment.remainingBalance)}</Td>
        <Td>{formatCurrency(installment.latePaymentCharges)}</Td>
        <Td colSpan={3}>ADVANCE</Td>
      </tr>
    );
  }

  if (isPaid) {
    return (
      <tr>
        <Td>{installment.sr}</Td>
        <Td>{formatDate(installment.installmentDate)}</Td>
        <Td>{formatCurrency(installment.scheduledAmount)}</Td>
        <Td>{formatDate(installment.receivedDate)}</Td>
        <Td>{formatCurrency(installment.receivedAmount!)}</Td>
        <Td>{formatCurrency(installment.shortOver ?? 0)}</Td>
        <Td>{formatCurrency(installment.remainingBalance)}</Td>
        <Td>{formatCurrency(installment.latePaymentCharges)}</Td>
        <Td>{installment.paymentDetails}</Td>
        <Td>{installment.chequeNo}</Td>
        <Td>
          <StatusBadge status="paid" />
        </Td>
      </tr>
    );
  }

  const status = reminderStatus(installment.installmentDate, installment.receivedAmount);
  const formId = `payment-form-${leaseId}-${installment.sr}`;

  return (
    <tr>
      <Td>{installment.sr}</Td>
      <Td>{formatDate(installment.installmentDate)}</Td>
      <Td>{formatCurrency(installment.scheduledAmount)}</Td>
      <Td colSpan={5}>
        <form
          id={formId}
          action={(formData) => startTransition(() => boundAction(formData))}
          className="flex flex-wrap items-center gap-1"
        >
          <input
            type="date"
            name="receivedDate"
            required
            className={inputClass}
            title="Received Date"
          />
          <input
            type="number"
            name="receivedAmount"
            step="0.01"
            required
            placeholder="Amount"
            className={inputClass}
          />
          <input
            type="number"
            name="latePaymentCharges"
            step="0.01"
            placeholder="Late fee"
            defaultValue={0}
            className={inputClass}
          />
          <StatusBadge status={status} />
        </form>
      </Td>
      <Td>
        <input
          type="text"
          name="paymentDetails"
          form={formId}
          placeholder="Details"
          className={inputClass}
        />
      </Td>
      <Td>
        <input
          type="text"
          name="chequeNo"
          form={formId}
          placeholder="Cheque #"
          className={inputClass}
        />
      </Td>
      <Td>
        <button
          type="submit"
          form={formId}
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1 rounded"
        >
          {isPending ? "Saving…" : "+ Save"}
        </button>
      </Td>
    </tr>
  );
}
