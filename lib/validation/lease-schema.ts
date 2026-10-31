import { z } from "zod";

export const nicSchema = z.string().regex(/^\d{5}-?\d{7}-?\d{1}$/, "Invalid NIC format");
export const mobileSchema = z.string().regex(/^(0|\+92)?3\d{9}$/, "Invalid mobile number");

const residentialStatusSchema = z.enum(["own", "rent"]);
const dateStringSchema = z.string().min(1, "Required").pipe(z.coerce.date());

export const bikeSchema = z.object({
  chassisNo: z.string().min(1, "Required"),
  engineNo: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  color: z.string().min(1, "Required"),
  purchaseDate: dateStringSchema,
  accountNo: z.string().min(1, "Required"),
  retailPrice: z.coerce.number().positive("Must be greater than 0"),
  costPrice: z.coerce.number().nonnegative(),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Required"),
  fatherName: z.string().min(1, "Required"),
  gender: z.enum(["male", "female", "other"]),
  nic: nicSchema,
  dob: dateStringSchema,
  ageGroup: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "other"]),
  residentialStatus: residentialStatusSchema,
  address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  mobileNo: mobileSchema,
  email: z.string().email().optional().or(z.literal("")),
  education: z.string().optional(),
  profession: z.string().optional(),
  bikeChangeCycle: z.string().optional(),
  creditSaleType: z.string().min(1, "Required"),
  bikeKeyNo: z.string().optional(),
  businessAddress: z.string().optional(),
  businessContactNo: z.string().optional(),
  preDeliverySafetyAdvice: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const guarantorSchema = z.object({
  name: z.string().min(1, "Required"),
  fatherName: z.string().min(1, "Required"),
  nic: nicSchema,
  mobileNo: mobileSchema,
  address: z.string().min(1, "Required"),
  residentialStatus: residentialStatusSchema,
  occupation: z.string().min(1, "Required"),
  monthlyIncome: z.coerce.number().nonnegative(),
  relation: z.string().min(1, "Required"),
  businessAddress: z.string().optional(),
  businessContactNo: z.string().optional(),
});

export const creditPlanInputSchema = z.object({
  fileRefNo: z.string().optional().default(""),
  dealershipName: z.string().optional().default(""),
  startingMonth: dateStringSchema,
  numberOfInstallments: z.coerce.number().int().positive(),
  registrationFee: z.coerce.number().nonnegative().default(0),
  documentCharges: z.coerce.number().nonnegative().default(0),
  retailPrice: z.coerce.number().positive("Must be greater than 0"),
  advance: z.coerce.number().nonnegative(),
});

export const leaseFormSchema = z.object({
  bike: bikeSchema,
  customer: customerSchema,
  guarantor1: guarantorSchema.optional(),
  guarantor2: guarantorSchema.optional(),
  creditPlan: creditPlanInputSchema,
});

export type LeaseFormInput = z.infer<typeof leaseFormSchema>;

export const paymentFormSchema = z.object({
  receivedDate: dateStringSchema,
  receivedAmount: z.coerce.number().nonnegative(),
  latePaymentCharges: z.coerce.number().nonnegative().optional().default(0),
  paymentDetails: z.string().optional().default(""),
  chequeNo: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  paymentMethod: z.enum(["cash", "bank_transfer"]).default("cash"),
});

export const leaseExpenseFormSchema = z.object({
  description: z.string().min(1, "Required"),
  amount: z.coerce.number().positive("Must be greater than 0"),
  date: dateStringSchema,
});
