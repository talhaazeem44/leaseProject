"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { ObjectId } from "mongodb";
import type { ZodError } from "zod";
import { getLeasesCollection, getMarkupRatesCollection } from "@/lib/db/collections";
import { formDataToNestedObject } from "@/lib/validation/form-data";
import {
  leaseFormSchema,
  paymentFormSchema,
  leaseExpenseFormSchema,
} from "@/lib/validation/lease-schema";
import { saveCustomerPhoto } from "@/lib/upload";
import {
  computeCreditAmount,
  computeProfitAmount,
  computeRentCreditPrice,
  generateInstallmentSchedule,
  getMarkupRate,
  applyPayment,
} from "@/lib/lease-calculations";
import type { Lease } from "@/lib/models/lease";

const SECTION_LABELS: Record<string, string> = {
  bike: "Motorcycle",
  customer: "Customer",
  guarantor1: "Guarantor 1",
  guarantor2: "Guarantor 2",
  creditPlan: "Credit Plan",
};

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  nic: "NIC",
  dob: "Date of Birth",
};

function humanizeField(segment: string): string {
  if (FIELD_LABEL_OVERRIDES[segment]) return FIELD_LABEL_OVERRIDES[segment];
  return segment.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function formatValidationError(error: ZodError): string {
  const messages = error.issues.map((issue) => {
    const [section, ...rest] = issue.path;
    const sectionLabel = SECTION_LABELS[String(section)] ?? humanizeField(String(section ?? ""));
    const fieldLabel = rest.map((segment) => humanizeField(String(segment))).join(" ");
    const label = [sectionLabel, fieldLabel].filter(Boolean).join(" – ");
    return label ? `${label}: ${issue.message}` : issue.message;
  });
  return messages.join("; ");
}

export interface CreateLeaseState {
  error?: string;
}

export async function createLease(
  _prevState: CreateLeaseState | undefined,
  formData: FormData
): Promise<CreateLeaseState> {
  const photoFile = formData.get("customer.photo");
  const photoUrl = await saveCustomerPhoto(photoFile instanceof File ? photoFile : null);

  const raw = formDataToNestedObject(formData) as Record<string, unknown>;

  for (const key of ["guarantor1", "guarantor2"] as const) {
    const block = raw[key] as Record<string, unknown> | undefined;
    if (!block || !block.name) {
      delete raw[key];
    }
  }

  const parseResult = leaseFormSchema.safeParse(raw);
  if (!parseResult.success) {
    return { error: formatValidationError(parseResult.error) };
  }
  const parsed = parseResult.data;

  const markupRates = await (await getMarkupRatesCollection()).find().toArray();
  const ratePercent = getMarkupRate(markupRates, parsed.creditPlan.numberOfInstallments);

  const creditAmount = computeCreditAmount(
    parsed.creditPlan.retailPrice,
    parsed.creditPlan.advance
  );
  const profitAmount = computeProfitAmount(creditAmount, ratePercent);
  const rentCreditPrice = computeRentCreditPrice(parsed.creditPlan.retailPrice, profitAmount);
  const installments = generateInstallmentSchedule({
    startingMonth: parsed.creditPlan.startingMonth,
    numberOfInstallments: parsed.creditPlan.numberOfInstallments,
    creditAmount,
    profitAmount,
    advance: parsed.creditPlan.advance,
  });

  const guarantors = [parsed.guarantor1, parsed.guarantor2].filter(
    (g): g is NonNullable<typeof g> => g !== undefined
  );

  const now = new Date();
  const lease: Lease = {
    bike: parsed.bike,
    customer: { ...parsed.customer, photoUrl },
    guarantors,
    creditPlan: {
      fileRefNo: parsed.creditPlan.fileRefNo,
      startingMonth: parsed.creditPlan.startingMonth,
      numberOfInstallments: parsed.creditPlan.numberOfInstallments,
      registrationFee: parsed.creditPlan.registrationFee,
      documentCharges: parsed.creditPlan.documentCharges,
      retailPrice: parsed.creditPlan.retailPrice,
      rentCreditPrice,
      advance: parsed.creditPlan.advance,
      rentProfitRatePercent: ratePercent,
      rentProfitAmount: profitAmount,
      creditAmount,
    },
    installments,
    expenses: [],
    createdAt: now,
    updatedAt: now,
  };

  const collection = await getLeasesCollection();
  const result = await collection.insertOne(lease);

  redirect(`/leases/${result.insertedId.toString()}?created=1`);
}

export async function recordPayment(
  leaseId: string,
  sr: number,
  formData: FormData
): Promise<void> {
  const parsed = paymentFormSchema.parse(Object.fromEntries(formData.entries()));

  const collection = await getLeasesCollection();
  const lease = await collection.findOne({ _id: new ObjectId(leaseId) });
  if (!lease) throw new Error("Lease not found");

  const index = lease.installments.findIndex((i) => i.sr === sr);
  if (index === -1) throw new Error("Installment not found");

  const totalPayable = lease.creditPlan.creditAmount + lease.creditPlan.rentProfitAmount;
  const updatedInstallments = applyPayment(
    lease.installments,
    index,
    {
      receivedDate: parsed.receivedDate,
      receivedAmount: parsed.receivedAmount,
      latePaymentCharges: parsed.latePaymentCharges,
      paymentDetails: parsed.paymentDetails,
      chequeNo: parsed.chequeNo,
    },
    totalPayable
  );

  await collection.updateOne(
    { _id: new ObjectId(leaseId) },
    { $set: { installments: updatedInstallments, updatedAt: new Date() } }
  );

  refresh();
}

export async function addLeaseExpense(leaseId: string, formData: FormData): Promise<void> {
  const parsed = leaseExpenseFormSchema.parse(Object.fromEntries(formData.entries()));

  const collection = await getLeasesCollection();
  await collection.updateOne(
    { _id: new ObjectId(leaseId) },
    {
      $push: {
        expenses: {
          id: crypto.randomUUID(),
          description: parsed.description,
          amount: parsed.amount,
          date: parsed.date,
        },
      },
      $set: { updatedAt: new Date() },
    }
  );

  refresh();
}

export async function deleteLeaseExpense(leaseId: string, expenseId: string): Promise<void> {
  const collection = await getLeasesCollection();
  await collection.updateOne(
    { _id: new ObjectId(leaseId) },
    { $pull: { expenses: { id: expenseId } }, $set: { updatedAt: new Date() } }
  );

  refresh();
}
