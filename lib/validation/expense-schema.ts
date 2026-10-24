import { z } from "zod";

export const expenseFormSchema = z.object({
  category: z.string().min(1, "Required"),
  description: z.string().optional().default(""),
  amount: z.coerce.number().positive("Must be greater than 0"),
  date: z.string().min(1, "Required").pipe(z.coerce.date()),
});
