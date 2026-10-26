import type { ObjectId } from "mongodb";

export interface Bike {
  chassisNo: string;
  engineNo: string;
  model: string;
  color: string;
  purchaseDate: Date;
  accountNo: string;
  retailPrice: number;
  costPrice: number;
}

export interface Customer {
  name: string;
  fatherName: string;
  gender: "male" | "female" | "other";
  nic: string;
  dob: Date;
  ageGroup?: string;
  maritalStatus: "single" | "married" | "other";
  residentialStatus: "own" | "rent";
  address: string;
  city: string;
  mobileNo: string;
  email?: string;
  education?: string;
  profession?: string;
  bikeChangeCycle?: string;
  creditSaleType: string;
  bikeKeyNo?: string;
  businessAddress?: string;
  businessContactNo?: string;
  preDeliverySafetyAdvice: boolean;
  photoUrl?: string;
}

export interface Guarantor {
  name: string;
  fatherName: string;
  nic: string;
  mobileNo: string;
  address: string;
  residentialStatus: "own" | "rent";
  occupation: string;
  monthlyIncome: number;
  relation: string;
  businessAddress?: string;
  businessContactNo?: string;
}

export interface Installment {
  sr: number;
  installmentDate: Date;
  scheduledAmount: number;
  receivedDate: Date | null;
  receivedAmount: number | null;
  shortOver: number | null;
  remainingBalance: number;
  latePaymentCharges: number;
  paymentDetails: string;
  chequeNo: string;
  bankName: string;
}

export interface CreditPlan {
  fileRefNo: string;
  dealershipName: string;
  startingMonth: Date;
  numberOfInstallments: number;
  registrationFee: number;
  documentCharges: number;
  retailPrice: number;
  rentCreditPrice: number;
  advance: number;
  rentProfitRatePercent: number;
  rentProfitAmount: number;
  creditAmount: number;
}

export interface LeaseExpense {
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface Lease {
  _id?: ObjectId;
  bike: Bike;
  customer: Customer;
  guarantors: Guarantor[];
  creditPlan: CreditPlan;
  installments: Installment[];
  expenses: LeaseExpense[];
  createdAt: Date;
  updatedAt: Date;
}
