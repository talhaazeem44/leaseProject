import type { ObjectId } from "mongodb";

export interface MarkupRate {
  _id?: ObjectId;
  tenureMonths: number;
  ratePercent: number;
  /** Percentage knocked off the profit amount for this tenure. Absent on rates created before this field existed. */
  discountPercent?: number;
  label?: string;
  updatedAt: Date;
}
