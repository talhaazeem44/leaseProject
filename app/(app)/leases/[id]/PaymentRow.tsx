"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Td } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { recordPayment } from "../actions";
import type { Installment } from "@/lib/models/lease";

const inputClass = "w-28 border border-gold bg-white rounded px-1.5 py-1 text-xs";
const cardInputClass = "w-full border border-gold bg-white rounded px-2 py-1.5 text-sm";

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
        <Td colSpan={4}>ADVANCE</Td>
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
        <Td>{installment.bankName}</Td>
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
          action={(formData) =>
            startTransition(async () => {
              try {
                await boundAction(formData);
                toast.success("Payment recorded");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Something went wrong");
              }
            })
          }
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
        <input
          type="text"
          name="bankName"
          form={formId}
          placeholder="Bank"
          className={inputClass}
        />
      </Td>
      <Td>
        <button
          type="submit"
          form={formId}
          disabled={isPending}
          className="bg-gold hover:bg-gold-dark disabled:opacity-50 text-white text-xs font-medium px-3 py-1 rounded"
        >
          {isPending ? "Saving…" : "+ Save"}
        </button>
      </Td>
    </tr>
  );
}

function CardField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-2 text-neutral-700">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function PaymentCard({
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
      <div className="border border-gold/40 rounded p-3 bg-white space-y-1.5 text-sm">
        <div className="flex items-center justify-between font-semibold italic text-emerald-700 dark:text-emerald-400">
          <span>#{installment.sr} — ADVANCE</span>
          <span>{formatDate(installment.installmentDate)}</span>
        </div>
        <CardField label="Scheduled" value={formatCurrency(installment.scheduledAmount)} />
        <CardField label="Received" value={formatCurrency(installment.receivedAmount ?? 0)} />
        <CardField label="Remaining Balance" value={formatCurrency(installment.remainingBalance)} />
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="border border-gold/40 rounded p-3 bg-white space-y-1.5 text-sm">
        <div className="flex items-center justify-between font-semibold">
          <span>
            #{installment.sr} — {formatDate(installment.installmentDate)}
          </span>
          <StatusBadge status="paid" />
        </div>
        <CardField label="Scheduled" value={formatCurrency(installment.scheduledAmount)} />
        <CardField label="Received Date" value={formatDate(installment.receivedDate)} />
        <CardField label="Received Amount" value={formatCurrency(installment.receivedAmount!)} />
        <CardField label="Short(-) / Over(+)" value={formatCurrency(installment.shortOver ?? 0)} />
        <CardField label="Remaining Balance" value={formatCurrency(installment.remainingBalance)} />
        <CardField label="Late Charges" value={formatCurrency(installment.latePaymentCharges)} />
        {installment.paymentDetails && (
          <CardField label="Details" value={installment.paymentDetails} />
        )}
        {installment.chequeNo && <CardField label="Cheque #" value={installment.chequeNo} />}
        {installment.bankName && <CardField label="Bank" value={installment.bankName} />}
      </div>
    );
  }

  const status = reminderStatus(installment.installmentDate, installment.receivedAmount);
  const formId = `payment-form-card-${leaseId}-${installment.sr}`;

  return (
    <div className="border border-gold/40 rounded p-3 bg-white space-y-2 text-sm">
      <div className="flex items-center justify-between font-semibold">
        <span>
          #{installment.sr} — {formatDate(installment.installmentDate)}
        </span>
        <StatusBadge status={status} />
      </div>
      <CardField label="Scheduled" value={formatCurrency(installment.scheduledAmount)} />
      <form
        id={formId}
        action={(formData) =>
          startTransition(async () => {
            try {
              await boundAction(formData);
              toast.success("Payment recorded");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Something went wrong");
            }
          })
        }
        className="space-y-2 pt-1"
      >
        <label className="block text-xs text-neutral-600">
          Received Date
          <input type="date" name="receivedDate" required className={cardInputClass} />
        </label>
        <label className="block text-xs text-neutral-600">
          Amount
          <input
            type="number"
            name="receivedAmount"
            step="0.01"
            required
            placeholder="Amount"
            className={cardInputClass}
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Late Fee
          <input
            type="number"
            name="latePaymentCharges"
            step="0.01"
            placeholder="Late fee"
            defaultValue={0}
            className={cardInputClass}
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Details
          <input type="text" name="paymentDetails" placeholder="Details" className={cardInputClass} />
        </label>
        <label className="block text-xs text-neutral-600">
          Cheque #
          <input type="text" name="chequeNo" placeholder="Cheque #" className={cardInputClass} />
        </label>
        <label className="block text-xs text-neutral-600">
          Bank
          <input type="text" name="bankName" placeholder="Bank" className={cardInputClass} />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gold hover:bg-gold-dark disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded"
        >
          {isPending ? "Saving…" : "+ Save"}
        </button>
      </form>
    </div>
  );
}
