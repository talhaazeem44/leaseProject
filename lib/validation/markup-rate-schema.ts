import { z } from "zod";

export const markupRateFormSchema = z.object({
  tenureMonths: z.coerce.number().int().positive(),
  ratePercent: z.coerce.number().nonnegative(),
  label: z.string().optional().default(""),
});
