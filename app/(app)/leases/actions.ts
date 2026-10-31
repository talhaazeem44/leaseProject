"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
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
  recalcRemainingBalance,
} from "@/lib/lease-calculations";
import type { Lease } from "@/lib/models/lease";

async function deleteUploadedPhoto(photoUrl: string | undefined): Promise<void> {
  if (!photoUrl) return;
  try {
    await unlink(path.join(process.cwd(), "public", photoUrl));
  } catch {
    // Best-effort cleanup; a missing file shouldn't block the lease mutation.
  }
}

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

export interface LeaseFormState {
  error?: string;
}
export type CreateLeaseState = LeaseFormState;
export type UpdateLeaseState = LeaseFormState;

function parseLeaseForm(formData: FormData) {
  const raw = formDataToNestedObject(formData) as Record<string, unknown>;

  for (const key of ["guarantor1", "guarantor2"] as const) {
    const block = raw[key] as Record<string, unknown> | undefined;
    if (!block || !block.name) {
      delete raw[key];
    }
  }

  return leaseFormSchema.safeParse(raw);
}

export async function createLease(
  _prevState: CreateLeaseState | undefined,
  formData: FormData
): Promise<CreateLeaseState> {
  const photoFile = formData.get("customer.photo");
  const photoUrl = await saveCustomerPhoto(photoFile instanceof File ? photoFile : null);

  const parseResult = parseLeaseForm(formData);
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
      dealershipName: parsed.creditPlan.dealershipName,
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

export async function updateLease(
  leaseId: string,
  _prevState: UpdateLeaseState | undefined,
  formData: FormData
): Promise<UpdateLeaseState> {
  const collection = await getLeasesCollection();
  const existing = await collection.findOne({ _id: new ObjectId(leaseId) });
  if (!existing) {
    return { error: "Lease not found." };
  }

  const parseResult = parseLeaseForm(formData);
  if (!parseResult.success) {
    return { error: formatValidationError(parseResult.error) };
  }
  const parsed = parseResult.data;

  const hasRecordedPayments = existing.installments.some(
    (i) => i.sr > 0 && i.receivedAmount !== null
  );
  const creditPlanChanged =
    parsed.creditPlan.retailPrice !== existing.creditPlan.retailPrice ||
    parsed.creditPlan.advance !== existing.creditPlan.advance ||
    parsed.creditPlan.numberOfInstallments !== existing.creditPlan.numberOfInstallments ||
    parsed.creditPlan.startingMonth.getTime() !== existing.creditPlan.startingMonth.getTime();

  if (hasRecordedPayments && creditPlanChanged) {
    return {
      error:
        "This lease already has recorded payments, so Retail Price, Advance, Tenure, and " +
        "Starting Month can't be changed. Correct other details, or delete the recorded " +
        "payments first if the credit terms genuinely need to change.",
    };
  }

  let { installments, creditPlan } = existing;
  if (!hasRecordedPayments) {
    const markupRates = await (await getMarkupRatesCollection()).find().toArray();
    const ratePercent = getMarkupRate(markupRates, parsed.creditPlan.numberOfInstallments);
    const creditAmount = computeCreditAmount(
      parsed.creditPlan.retailPrice,
      parsed.creditPlan.advance
    );
    const profitAmount = computeProfitAmount(creditAmount, ratePercent);
    const rentCreditPrice = computeRentCreditPrice(parsed.creditPlan.retailPrice, profitAmount);
    installments = generateInstallmentSchedule({
      startingMonth: parsed.creditPlan.startingMonth,
      numberOfInstallments: parsed.creditPlan.numberOfInstallments,
      creditAmount,
      profitAmount,
      advance: parsed.creditPlan.advance,
    });
    creditPlan = {
      fileRefNo: parsed.creditPlan.fileRefNo,
      dealershipName: parsed.creditPlan.dealershipName,
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
    };
  } else {
    // Credit terms are locked, but non-financial fields (file ref, dealership name,
    // registration fee, document charges) are always safe to update.
    creditPlan = {
      ...existing.creditPlan,
      fileRefNo: parsed.creditPlan.fileRefNo,
      dealershipName: parsed.creditPlan.dealershipName,
      registrationFee: parsed.creditPlan.registrationFee,
      documentCharges: parsed.creditPlan.documentCharges,
    };
  }

  const photoFile = formData.get("customer.photo");
  let photoUrl = existing.customer.photoUrl;
  if (photoFile instanceof File && photoFile.size > 0) {
    const newPhotoUrl = await saveCustomerPhoto(photoFile);
    if (newPhotoUrl) {
      await deleteUploadedPhoto(existing.customer.photoUrl);
      photoUrl = newPhotoUrl;
    }
  }

  const guarantors = [parsed.guarantor1, parsed.guarantor2].filter(
    (g): g is NonNullable<typeof g> => g !== undefined
  );

  await collection.updateOne(
    { _id: new ObjectId(leaseId) },
    {
      $set: {
        bike: parsed.bike,
        customer: { ...parsed.customer, photoUrl },
        guarantors,
        creditPlan,
        installments,
        updatedAt: new Date(),
      },
    }
  );

  redirect(`/leases/${leaseId}?updated=1`);
}

export async function deleteLease(leaseId: string): Promise<void> {
  const collection = await getLeasesCollection();
  const lease = await collection.findOne({ _id: new ObjectId(leaseId) });
  if (!lease) throw new Error("Lease not found");

  await collection.deleteOne({ _id: new ObjectId(leaseId) });
  await deleteUploadedPhoto(lease.customer.photoUrl);

  refresh();
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
      bankName: parsed.bankName,
      paymentMethod: parsed.paymentMethod,
    },
    totalPayable
  );

  await collection.updateOne(
    { _id: new ObjectId(leaseId) },
    { $set: { installments: updatedInstallments, updatedAt: new Date() } }
  );

  refresh();
}

export async function undoPayment(leaseId: string, sr: number): Promise<void> {
  if (sr === 0) throw new Error("The advance entry can't be undone here.");

  const collection = await getLeasesCollection();
  const lease = await collection.findOne({ _id: new ObjectId(leaseId) });
  if (!lease) throw new Error("Lease not found");

  const index = lease.installments.findIndex((i) => i.sr === sr);
  if (index === -1) throw new Error("Installment not found");

  const totalPayable = lease.creditPlan.creditAmount + lease.creditPlan.rentProfitAmount;
  const resetInstallments = lease.installments.map((inst, i) =>
    i === index
      ? {
          ...inst,
          receivedDate: null,
          receivedAmount: null,
          shortOver: null,
          latePaymentCharges: 0,
          paymentDetails: "",
          chequeNo: "",
          bankName: "",
          paymentMethod: null,
        }
      : inst
  );

  await collection.updateOne(
    { _id: new ObjectId(leaseId) },
    {
      $set: {
        installments: recalcRemainingBalance(resetInstallments, totalPayable),
        updatedAt: new Date(),
      },
    }
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
