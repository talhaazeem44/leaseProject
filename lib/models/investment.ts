import type { ObjectId } from "mongodb";

export interface Investment {
  _id?: ObjectId;
  description: string;
  amount: number;
  date: Date;
  createdAt: Date;
}
