"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { getMarkupRatesCollection } from "@/lib/db/collections";
import { markupRateFormSchema } from "@/lib/validation/markup-rate-schema";

export async function createMarkupRate(formData: FormData): Promise<void> {
  const parsed = markupRateFormSchema.parse(Object.fromEntries(formData.entries()));
  const collection = await getMarkupRatesCollection();

  const existing = await collection.findOne({ tenureMonths: parsed.tenureMonths });
  if (existing) {
    throw new Error(`A rate for ${parsed.tenureMonths} months already exists`);
  }

  await collection.insertOne({ ...parsed, updatedAt: new Date() });
  refresh();
}

export async function updateMarkupRate(id: string, formData: FormData): Promise<void> {
  const parsed = markupRateFormSchema.parse(Object.fromEntries(formData.entries()));
  const collection = await getMarkupRatesCollection();

  const conflict = await collection.findOne({
    tenureMonths: parsed.tenureMonths,
    _id: { $ne: new ObjectId(id) },
  });
  if (conflict) {
    throw new Error(`A rate for ${parsed.tenureMonths} months already exists`);
  }

  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...parsed, updatedAt: new Date() } }
  );
  refresh();
}

export async function deleteMarkupRate(id: string): Promise<void> {
  const collection = await getMarkupRatesCollection();
  await collection.deleteOne({ _id: new ObjectId(id) });
  refresh();
}
