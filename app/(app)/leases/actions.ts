"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { ObjectId } from "mongodb";
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

export async function createLease(formData: FormData): Promise<void> {
  const photoFile = formData.get("customer.photo");
  const photoUrl = await saveCustomerPhoto(photoFile instanceof File ? photoFile : null);

  const raw = formDataToNestedObject(formData) as Record<string, unknown>;

  for (const key of ["guarantor1", "guarantor2"] as const) {
    const block = raw[key] as Record<string, unknown> | undefined;
    if (!block || !block.name) {
      delete raw[key];
    }
  }

  const parsed = leaseFormSchema.parse(raw);

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

  redirect(`/leases/${result.insertedId.toString()}`);
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
