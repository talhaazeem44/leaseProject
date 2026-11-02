import { z } from "zod";

export const markupRateFormSchema = z.object({
  tenureMonths: z.coerce.number().int().positive(),
  ratePercent: z.coerce.number().nonnegative(),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  label: z.string().optional().default(""),
});
