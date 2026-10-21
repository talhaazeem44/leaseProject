import type { ObjectId } from "mongodb";

export interface MarkupRate {
  _id?: ObjectId;
  tenureMonths: number;
  ratePercent: number;
  label?: string;
  updatedAt: Date;
}
