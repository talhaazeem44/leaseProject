"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Td } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/format";
import { recordPayment, undoPayment } from "../actions";
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

function methodLabel(method: Installment["paymentMethod"]) {
  return method === "bank_transfer" ? "Bank Transfer" : "Cash";
}

function useUndoPayment(leaseId: string, sr: number, onDone?: () => void) {
  const [isPending, startTransition] = useTransition();
  function handleUndo() {
    if (
      !window.confirm(
        "Undo this payment? This clears the received amount, date, and details for this installment."
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await undoPayment(leaseId, sr);
        toast.success("Payment undone");
        onDone?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }
  return { isPending, handleUndo };
}

export function PaymentRow({
  leaseId,
  installment,
}: {
  leaseId: string;
  installment: Installment;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const isPaid = installment.receivedAmount !== null;
  const boundAction = recordPayment.bind(null, leaseId, installment.sr);
  const undo = useUndoPayment(leaseId, installment.sr, () => setIsEditing(false));

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
        <Td colSpan={5}>ADVANCE</Td>
      </tr>
    );
  }

  if (isPaid && !isEditing) {
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
        <Td>{methodLabel(installment.paymentMethod)}</Td>
        <Td>
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status="paid" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-gold-dark hover:underline text-xs"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={undo.handleUndo}
                disabled={undo.isPending}
                className="text-red-600 hover:underline text-xs disabled:opacity-50"
              >
                {undo.isPending ? "Undoing…" : "Undo"}
              </button>
            </div>
          </div>
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
                toast.success(isPaid ? "Payment updated" : "Payment recorded");
                setIsEditing(false);
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
            defaultValue={isPaid ? formatDateInput(installment.receivedDate) : undefined}
          />
          <input
            type="number"
            name="receivedAmount"
            step="0.01"
            required
            placeholder="Amount"
            className={inputClass}
            defaultValue={isPaid ? installment.receivedAmount! : undefined}
          />
          <input
            type="number"
            name="latePaymentCharges"
            step="0.01"
            placeholder="Late fee"
            defaultValue={isPaid ? installment.latePaymentCharges : 0}
            className={inputClass}
          />
          <StatusBadge status={isPaid ? "paid" : status} />
        </form>
      </Td>
      <Td>
        <input
          type="text"
          name="paymentDetails"
          form={formId}
          placeholder="Details"
          className={inputClass}
          defaultValue={isPaid ? installment.paymentDetails : undefined}
        />
      </Td>
      <Td>
        <input
          type="text"
          name="chequeNo"
          form={formId}
          placeholder="Cheque #"
          className={inputClass}
          defaultValue={isPaid ? installment.chequeNo : undefined}
        />
      </Td>
      <Td>
        <input
          type="text"
          name="bankName"
          form={formId}
          placeholder="Bank"
          className={inputClass}
          defaultValue={isPaid ? installment.bankName : undefined}
        />
      </Td>
      <Td>
        <div className="flex flex-col gap-0.5 text-xs whitespace-nowrap">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              form={formId}
              defaultChecked={(installment.paymentMethod ?? "cash") === "cash"}
            />
            Cash
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              form={formId}
              defaultChecked={installment.paymentMethod === "bank_transfer"}
            />
            Bank Transfer
          </label>
        </div>
      </Td>
      <Td>
        <div className="flex flex-col items-start gap-1">
          <button
            type="submit"
            form={formId}
            disabled={isPending}
            className="bg-gold hover:bg-gold-dark disabled:opacity-50 text-white text-xs font-medium px-3 py-1 rounded"
          >
            {isPending ? "Saving…" : isPaid ? "Update" : "+ Save"}
          </button>
          {isPaid && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-neutral-500 hover:underline text-xs"
            >
              Cancel
            </button>
          )}
        </div>
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
  const [isEditing, setIsEditing] = useState(false);
  const isPaid = installment.receivedAmount !== null;
  const boundAction = recordPayment.bind(null, leaseId, installment.sr);
  const undo = useUndoPayment(leaseId, installment.sr, () => setIsEditing(false));

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

  if (isPaid && !isEditing) {
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
        <CardField label="Method" value={methodLabel(installment.paymentMethod)} />
        {installment.paymentDetails && (
          <CardField label="Details" value={installment.paymentDetails} />
        )}
        {installment.chequeNo && <CardField label="Cheque #" value={installment.chequeNo} />}
        {installment.bankName && <CardField label="Bank" value={installment.bankName} />}
        <div className="flex justify-end gap-4 pt-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-gold-dark hover:underline text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={undo.handleUndo}
            disabled={undo.isPending}
            className="text-red-600 hover:underline text-xs disabled:opacity-50"
          >
            {undo.isPending ? "Undoing…" : "Undo"}
          </button>
        </div>
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
        <StatusBadge status={isPaid ? "paid" : status} />
      </div>
      <CardField label="Scheduled" value={formatCurrency(installment.scheduledAmount)} />
      <form
        id={formId}
        action={(formData) =>
          startTransition(async () => {
            try {
              await boundAction(formData);
              toast.success(isPaid ? "Payment updated" : "Payment recorded");
              setIsEditing(false);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Something went wrong");
            }
          })
        }
        className="space-y-2 pt-1"
      >
        <label className="block text-xs text-neutral-600">
          Received Date
          <input
            type="date"
            name="receivedDate"
            required
            className={cardInputClass}
            defaultValue={isPaid ? formatDateInput(installment.receivedDate) : undefined}
          />
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
            defaultValue={isPaid ? installment.receivedAmount! : undefined}
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Late Fee
          <input
            type="number"
            name="latePaymentCharges"
            step="0.01"
            placeholder="Late fee"
            defaultValue={isPaid ? installment.latePaymentCharges : 0}
            className={cardInputClass}
          />
        </label>
        <div className="text-xs text-neutral-600">
          <span className="block mb-1">Received Via</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                defaultChecked={(installment.paymentMethod ?? "cash") === "cash"}
              />
              Cash
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                defaultChecked={installment.paymentMethod === "bank_transfer"}
              />
              Bank Transfer
            </label>
          </div>
        </div>
        <label className="block text-xs text-neutral-600">
          Details
          <input
            type="text"
            name="paymentDetails"
            placeholder="Details"
            className={cardInputClass}
            defaultValue={isPaid ? installment.paymentDetails : undefined}
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Cheque #
          <input
            type="text"
            name="chequeNo"
            placeholder="Cheque #"
            className={cardInputClass}
            defaultValue={isPaid ? installment.chequeNo : undefined}
          />
        </label>
        <label className="block text-xs text-neutral-600">
          Bank
          <input
            type="text"
            name="bankName"
            placeholder="Bank"
            className={cardInputClass}
            defaultValue={isPaid ? installment.bankName : undefined}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-gold hover:bg-gold-dark disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded"
          >
            {isPending ? "Saving…" : isPaid ? "Update" : "+ Save"}
          </button>
          {isPaid && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-neutral-500 hover:underline text-xs px-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
