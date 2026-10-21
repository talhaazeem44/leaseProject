import { addMonths } from "date-fns";
import type { Installment } from "./models/lease";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface MarkupRateLookup {
  tenureMonths: number;
  ratePercent: number;
}

export function getMarkupRate(rates: MarkupRateLookup[], tenureMonths: number): number {
  const match = rates.find((r) => r.tenureMonths === tenureMonths);
  if (!match) throw new Error(`No markup rate configured for ${tenureMonths} months`);
  return match.ratePercent;
}

export function computeCreditAmount(retailPrice: number, advance: number): number {
  return round2(retailPrice - advance);
}

export function computeProfitAmount(creditAmount: number, ratePercent: number): number {
  return round2((creditAmount * ratePercent) / 100);
}

export function computeMonthlyInstallmentBase(
  creditAmount: number,
  profitAmount: number,
  numberOfInstallments: number
): number {
  return round2((creditAmount + profitAmount) / numberOfInstallments);
}

export interface ScheduleInput {
  startingMonth: Date;
  numberOfInstallments: number;
  creditAmount: number;
  profitAmount: number;
  advance: number;
}

/** Generates the full schedule, including the ADVANCE row (sr=0). */
export function generateInstallmentSchedule(input: ScheduleInput): Installment[] {
  const totalPayable = round2(input.creditAmount + input.profitAmount);
  const base = computeMonthlyInstallmentBase(
    input.creditAmount,
    input.profitAmount,
    input.numberOfInstallments
  );

  const advanceRow: Installment = {
    sr: 0,
    installmentDate: input.startingMonth,
    scheduledAmount: input.advance,
    receivedDate: input.startingMonth,
    receivedAmount: input.advance,
    shortOver: 0,
    remainingBalance: totalPayable,
    latePaymentCharges: 0,
    paymentDetails: "ADVANCE",
    chequeNo: "",
  };

  const rows: Installment[] = [];
  let runningScheduledSum = 0;
  for (let i = 1; i <= input.numberOfInstallments; i++) {
    const isLast = i === input.numberOfInstallments;
    const amount = isLast ? round2(totalPayable - runningScheduledSum) : base;
    runningScheduledSum = round2(runningScheduledSum + amount);
    rows.push({
      sr: i,
      installmentDate: addMonths(input.startingMonth, i),
      scheduledAmount: amount,
      receivedDate: null,
      receivedAmount: null,
      shortOver: null,
      remainingBalance: 0,
      latePaymentCharges: 0,
      paymentDetails: "",
      chequeNo: "",
    });
  }

  return recalcRemainingBalance([advanceRow, ...rows], totalPayable);
}

/**
 * Recomputes the running remaining-balance column from the advance row forward.
 * Unpaid rows subtract their scheduled projection so the column stays meaningful
 * before payments are recorded; paid rows subtract the actual received amount.
 */
export function recalcRemainingBalance(
  installments: Installment[],
  totalPayable: number
): Installment[] {
  let running = totalPayable;
  return installments.map((inst) => {
    if (inst.sr === 0) return { ...inst, remainingBalance: totalPayable };
    const applied = inst.receivedAmount ?? inst.scheduledAmount;
    running = round2(running - applied);
    return { ...inst, remainingBalance: running };
  });
}

export interface PaymentInput {
  receivedDate: Date;
  receivedAmount: number;
  latePaymentCharges?: number;
  paymentDetails?: string;
  chequeNo?: string;
}

/** Records a payment against one row and recomputes short/over + cascaded balance. */
export function applyPayment(
  installments: Installment[],
  index: number,
  payment: PaymentInput,
  totalPayable: number
): Installment[] {
  const updated = installments.map((inst, i) =>
    i === index
      ? {
          ...inst,
          receivedDate: payment.receivedDate,
          receivedAmount: payment.receivedAmount,
          shortOver: round2(payment.receivedAmount - inst.scheduledAmount),
          latePaymentCharges: payment.latePaymentCharges ?? inst.latePaymentCharges,
          paymentDetails: payment.paymentDetails ?? inst.paymentDetails,
          chequeNo: payment.chequeNo ?? inst.chequeNo,
        }
      : inst
  );
  return recalcRemainingBalance(updated, totalPayable);
}

export function computeTotals(installments: Installment[]) {
  const totalReceived = installments.reduce((s, i) => s + (i.receivedAmount ?? 0), 0);
  const totalShortOver = installments.reduce((s, i) => s + (i.shortOver ?? 0), 0);
  return { totalReceived: round2(totalReceived), totalShortOver: round2(totalShortOver) };
}

export type ReminderBucket = "overdue" | "upcoming";

export function classifyInstallment(
  installmentDate: Date,
  receivedAmount: number | null,
  today: Date,
  upcomingWindowDays = 30
): ReminderBucket | null {
  if (receivedAmount !== null) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((installmentDate.getTime() - today.getTime()) / msPerDay);
  if (diffDays < 0) return "overdue";
  if (diffDays <= upcomingWindowDays) return "upcoming";
  return null;
}
