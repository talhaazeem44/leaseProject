import type { ObjectId } from "mongodb";

export interface Expense {
  _id?: ObjectId;
  category: string;
  description: string;
  amount: number;
  date: Date;
  createdAt: Date;
}
