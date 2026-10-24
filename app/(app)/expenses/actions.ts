"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { getExpensesCollection } from "@/lib/db/collections";
import { expenseFormSchema } from "@/lib/validation/expense-schema";

export async function createExpense(formData: FormData): Promise<void> {
  const parsed = expenseFormSchema.parse(Object.fromEntries(formData.entries()));

  const collection = await getExpensesCollection();
  await collection.insertOne({
    category: parsed.category,
    description: parsed.description,
    amount: parsed.amount,
    date: parsed.date,
    createdAt: new Date(),
  });

  refresh();
}

export async function deleteExpense(id: string): Promise<void> {
  const collection = await getExpensesCollection();
  await collection.deleteOne({ _id: new ObjectId(id) });

  refresh();
}
