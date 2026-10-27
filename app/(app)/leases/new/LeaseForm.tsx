"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  computeCreditAmount,
  computeProfitAmount,
  computeMonthlyInstallmentBase,
  computeRentCreditPrice,
  computeLeaseProfit,
  getMarkupRate,
} from "@/lib/lease-calculations";
import { formatCurrency, formatDateInput } from "@/lib/format";
import { createLease, updateLease, type LeaseFormState } from "../actions";
import type { Bike, Customer, Guarantor, CreditPlan } from "@/lib/models/lease";

interface RateOption {
  tenureMonths: number;
  ratePercent: number;
}

export interface EditingLease {
  leaseId: string;
  bike: Bike;
  customer: Customer;
  guarantors: Guarantor[];
  creditPlan: CreditPlan;
  hasRecordedPayments: boolean;
}

const inputClass = "w-full border border-gold bg-white rounded px-2 py-1.5 text-sm";
const lockedInputClass =
  "w-full border border-neutral-300 bg-neutral-100 text-neutral-500 rounded px-2 py-1.5 text-sm cursor-not-allowed";
const labelClass = "block text-xs font-medium text-neutral-600 mb-1";

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  readOnly = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className={readOnly ? lockedInputClass : inputClass}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
  defaultValue = "",
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select name={name} required={required} className={inputClass} defaultValue={defaultValue}>
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PhotoUploadField({ initialPhotoUrl }: { initialPhotoUrl?: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl ?? null);

  return (
    <div>
      <label className={labelClass}>Customer Photo</label>
      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gold/50 rounded cursor-pointer overflow-hidden text-center text-xs text-neutral-500 hover:border-gold">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Customer photo preview"
            width={128}
            height={128}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="px-2">Click to insert photo</span>
        )}
        <input
          type="file"
          name="customer.photo"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreviewUrl(file ? URL.createObjectURL(file) : initialPhotoUrl ?? null);
          }}
        />
      </label>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-gold rounded">
      <legend className="bg-sidebar text-white text-sm font-semibold uppercase tracking-wide px-4 py-2 w-full border-b-2 border-gold">
        {title}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">{children}</div>
    </fieldset>
  );
}

export function LeaseForm({ rates, editing }: { rates: RateOption[]; editing?: EditingLease }) {
  const [retailPrice, setRetailPrice] = useState<number>(editing?.creditPlan.retailPrice ?? 0);
  const [costPrice, setCostPrice] = useState<number>(editing?.bike.costPrice ?? 0);
  const [advance, setAdvance] = useState<number>(editing?.creditPlan.advance ?? 0);
  const [tenureMonths, setTenureMonths] = useState<number>(
    editing?.creditPlan.numberOfInstallments ?? rates[0]?.tenureMonths ?? 0
  );

  const action = editing ? updateLease.bind(null, editing.leaseId) : createLease;
  const [state, formAction, isPending] = useActionState<LeaseFormState | undefined, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const preview = useMemo(() => {
    if (!tenureMonths || retailPrice <= 0) return null;
    try {
      const ratePercent = getMarkupRate(rates, tenureMonths);
      const creditAmount = computeCreditAmount(retailPrice, advance);
      const profitAmount = computeProfitAmount(creditAmount, ratePercent);
      const monthlyInstallment = computeMonthlyInstallmentBase(
        creditAmount,
        profitAmount,
        tenureMonths
      );
      const rentCreditPrice = computeRentCreditPrice(retailPrice, profitAmount);
      const profit = computeLeaseProfit({ rentCreditPrice, costPrice, expensesTotal: 0 });
      return {
        ratePercent,
        creditAmount,
        profitAmount,
        monthlyInstallment,
        rentCreditPrice,
        profit,
      };
    } catch {
      return null;
    }
  }, [rates, tenureMonths, retailPrice, advance, costPrice]);

  const creditPlanLocked = editing?.hasRecordedPayments ?? false;
  const guarantor1 = editing?.guarantors[0];
  const guarantor2 = editing?.guarantors[1];

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <SectionCard title="Motorcycle Information">
        <Field
          label="Chassis #"
          name="bike.chassisNo"
          required
          defaultValue={editing?.bike.chassisNo}
        />
        <Field
          label="Engine #"
          name="bike.engineNo"
          required
          defaultValue={editing?.bike.engineNo}
        />
        <Field label="Model" name="bike.model" required defaultValue={editing?.bike.model} />
        <Field label="Color" name="bike.color" required defaultValue={editing?.bike.color} />
        <Field
          label="Purchase Date"
          name="bike.purchaseDate"
          type="date"
          required
          defaultValue={formatDateInput(editing?.bike.purchaseDate ?? null)}
        />
        <Field
          label="Account No"
          name="bike.accountNo"
          required
          defaultValue={editing?.bike.accountNo}
        />
        <Field
          label="Retail Price (Rs.)"
          name="bike.retailPrice"
          type="number"
          required
          defaultValue={editing?.bike.retailPrice ?? 0}
        />
        <div>
          <label className={labelClass}>
            Cost Price (Rs.) <span className="text-red-500">*</span>
          </label>
          <input
            name="bike.costPrice"
            type="number"
            required
            className={inputClass}
            value={costPrice || ""}
            onChange={(e) => setCostPrice(Number(e.target.value))}
          />
          <p className="text-xs text-neutral-500 mt-1">
            What you paid to acquire this bike &mdash; used to calculate profit, not shown on
            customer paperwork.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Customer Information">
        <PhotoUploadField initialPhotoUrl={editing?.customer.photoUrl} />
        <Field label="Name" name="customer.name" required defaultValue={editing?.customer.name} />
        <Field
          label="Father Name"
          name="customer.fatherName"
          required
          defaultValue={editing?.customer.fatherName}
        />
        <SelectField
          label="Gender"
          name="customer.gender"
          required
          defaultValue={editing?.customer.gender}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
        />
        <Field label="NIC" name="customer.nic" required defaultValue={editing?.customer.nic} />
        <Field
          label="Date of Birth"
          name="customer.dob"
          type="date"
          required
          defaultValue={formatDateInput(editing?.customer.dob ?? null)}
        />
        <Field label="Age Group" name="customer.ageGroup" defaultValue={editing?.customer.ageGroup} />
        <SelectField
          label="Marital Status"
          name="customer.maritalStatus"
          required
          defaultValue={editing?.customer.maritalStatus}
          options={[
            { value: "single", label: "Single" },
            { value: "married", label: "Married" },
            { value: "other", label: "Other" },
          ]}
        />
        <SelectField
          label="Residential Status"
          name="customer.residentialStatus"
          required
          defaultValue={editing?.customer.residentialStatus}
          options={[
            { value: "own", label: "Own" },
            { value: "rent", label: "Rent" },
          ]}
        />
        <Field
          label="Address"
          name="customer.address"
          required
          defaultValue={editing?.customer.address}
        />
        <Field label="City" name="customer.city" required defaultValue={editing?.customer.city} />
        <Field
          label="Mobile No"
          name="customer.mobileNo"
          required
          defaultValue={editing?.customer.mobileNo}
        />
        <Field
          label="Email Address"
          name="customer.email"
          type="email"
          defaultValue={editing?.customer.email}
        />
        <Field
          label="Education"
          name="customer.education"
          defaultValue={editing?.customer.education}
        />
        <Field
          label="Profession"
          name="customer.profession"
          defaultValue={editing?.customer.profession}
        />
        <Field
          label="Bike Change Cycle"
          name="customer.bikeChangeCycle"
          defaultValue={editing?.customer.bikeChangeCycle}
        />
        <Field
          label="Credit Sale Type"
          name="customer.creditSaleType"
          required
          defaultValue={editing?.customer.creditSaleType}
        />
        <Field
          label="Bike Key No"
          name="customer.bikeKeyNo"
          defaultValue={editing?.customer.bikeKeyNo}
        />
        <Field
          label="Business Address"
          name="customer.businessAddress"
          defaultValue={editing?.customer.businessAddress}
        />
        <Field
          label="Business Contact #"
          name="customer.businessContactNo"
          defaultValue={editing?.customer.businessContactNo}
        />
        <div className="flex items-center gap-2 mt-6">
          <input
            type="checkbox"
            name="customer.preDeliverySafetyAdvice"
            id="pdsa"
            defaultChecked={editing?.customer.preDeliverySafetyAdvice}
          />
          <label htmlFor="pdsa" className="text-sm">
            Pre-Delivery Safety Advice Given
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Guarantor 1 (optional)">
        <Field label="Name" name="guarantor1.name" defaultValue={guarantor1?.name} />
        <Field
          label="Father's Name"
          name="guarantor1.fatherName"
          defaultValue={guarantor1?.fatherName}
        />
        <Field label="NIC #" name="guarantor1.nic" defaultValue={guarantor1?.nic} />
        <Field label="Mobile #" name="guarantor1.mobileNo" defaultValue={guarantor1?.mobileNo} />
        <Field label="Address" name="guarantor1.address" defaultValue={guarantor1?.address} />
        <SelectField
          label="Residential Status"
          name="guarantor1.residentialStatus"
          defaultValue={guarantor1?.residentialStatus}
          options={[
            { value: "own", label: "Own" },
            { value: "rent", label: "Rent" },
          ]}
        />
        <Field
          label="Occupation"
          name="guarantor1.occupation"
          defaultValue={guarantor1?.occupation}
        />
        <Field
          label="Monthly Income"
          name="guarantor1.monthlyIncome"
          type="number"
          defaultValue={guarantor1?.monthlyIncome}
        />
        <Field label="Relation" name="guarantor1.relation" defaultValue={guarantor1?.relation} />
        <Field
          label="Business Address"
          name="guarantor1.businessAddress"
          defaultValue={guarantor1?.businessAddress}
        />
        <Field
          label="Business Contact #"
          name="guarantor1.businessContactNo"
          defaultValue={guarantor1?.businessContactNo}
        />
      </SectionCard>

      <SectionCard title="Guarantor 2 (optional)">
        <Field label="Name" name="guarantor2.name" defaultValue={guarantor2?.name} />
        <Field
          label="Father's Name"
          name="guarantor2.fatherName"
          defaultValue={guarantor2?.fatherName}
        />
        <Field label="NIC #" name="guarantor2.nic" defaultValue={guarantor2?.nic} />
        <Field label="Mobile #" name="guarantor2.mobileNo" defaultValue={guarantor2?.mobileNo} />
        <Field label="Address" name="guarantor2.address" defaultValue={guarantor2?.address} />
        <SelectField
          label="Residential Status"
          name="guarantor2.residentialStatus"
          defaultValue={guarantor2?.residentialStatus}
          options={[
            { value: "own", label: "Own" },
            { value: "rent", label: "Rent" },
          ]}
        />
        <Field
          label="Occupation"
          name="guarantor2.occupation"
          defaultValue={guarantor2?.occupation}
        />
        <Field
          label="Monthly Income"
          name="guarantor2.monthlyIncome"
          type="number"
          defaultValue={guarantor2?.monthlyIncome}
        />
        <Field label="Relation" name="guarantor2.relation" defaultValue={guarantor2?.relation} />
        <Field
          label="Business Address"
          name="guarantor2.businessAddress"
          defaultValue={guarantor2?.businessAddress}
        />
        <Field
          label="Business Contact #"
          name="guarantor2.businessContactNo"
          defaultValue={guarantor2?.businessContactNo}
        />
      </SectionCard>

      <fieldset className="border border-gold rounded">
        <legend className="bg-sidebar text-white text-sm font-semibold uppercase tracking-wide px-4 py-2 w-full border-b-2 border-gold">
          Credit Plan
        </legend>
        {creditPlanLocked && (
          <p className="mx-4 mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            This lease already has recorded payments, so Retail Price, Advance, Tenure, and
            Starting Month are locked to keep the installment schedule consistent.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <Field
            label="File Ref No"
            name="creditPlan.fileRefNo"
            defaultValue={editing?.creditPlan.fileRefNo}
          />
          <Field
            label="Dealership Name"
            name="creditPlan.dealershipName"
            defaultValue={editing?.creditPlan.dealershipName}
          />
          <Field
            label="Starting Month"
            name="creditPlan.startingMonth"
            type="date"
            required
            readOnly={creditPlanLocked}
            defaultValue={formatDateInput(editing?.creditPlan.startingMonth ?? null)}
          />
          <div>
            <label className={labelClass}>
              No of Installments (Tenure) <span className="text-red-500">*</span>
            </label>
            <select
              name="creditPlan.numberOfInstallments"
              required
              disabled={creditPlanLocked}
              className={creditPlanLocked ? lockedInputClass : inputClass}
              value={tenureMonths || ""}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
            >
              {rates.map((r) => (
                <option key={r.tenureMonths} value={r.tenureMonths}>
                  {r.tenureMonths} months ({r.ratePercent}%)
                </option>
              ))}
            </select>
            {creditPlanLocked && (
              <input type="hidden" name="creditPlan.numberOfInstallments" value={tenureMonths} />
            )}
          </div>
          <Field
            label="Registration Fee"
            name="creditPlan.registrationFee"
            type="number"
            defaultValue={editing?.creditPlan.registrationFee ?? 0}
          />
          <Field
            label="Document Charges"
            name="creditPlan.documentCharges"
            type="number"
            defaultValue={editing?.creditPlan.documentCharges ?? 0}
          />
          <div>
            <label className={labelClass}>
              Retail Price (Rs.) <span className="text-red-500">*</span>
            </label>
            <input
              name="creditPlan.retailPrice"
              type="number"
              required
              readOnly={creditPlanLocked}
              className={creditPlanLocked ? lockedInputClass : inputClass}
              value={retailPrice || ""}
              onChange={(e) => setRetailPrice(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Advance (Rs.)</label>
            <input
              name="creditPlan.advance"
              type="number"
              readOnly={creditPlanLocked}
              className={creditPlanLocked ? lockedInputClass : inputClass}
              value={advance || ""}
              onChange={(e) => setAdvance(Number(e.target.value))}
            />
          </div>
        </div>

        {preview && (
          <div className="mx-4 mb-4 p-3 bg-offwhite-dim border border-dashed border-gold/50 rounded text-sm grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div>
              <div className="text-xs text-neutral-500">Credit Amount</div>
              <div className="font-semibold">Rs. {formatCurrency(preview.creditAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Rent/Profit Rate</div>
              <div className="font-semibold">{preview.ratePercent}%</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Rent/Profit Amount</div>
              <div className="font-semibold">Rs. {formatCurrency(preview.profitAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Rent/Credit Price</div>
              <div className="font-semibold">Rs. {formatCurrency(preview.rentCreditPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Monthly Installment</div>
              <div className="font-semibold">Rs. {formatCurrency(preview.monthlyInstallment)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Estimated Profit</div>
              <div
                className={`font-bold ${preview.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}
              >
                Rs. {formatCurrency(preview.profit)}
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold hover:bg-gold-dark disabled:opacity-60 text-white font-medium px-6 py-2 rounded"
      >
        {isPending ? "Saving…" : editing ? "Save Changes" : "Create Lease"}
      </button>
    </form>
  );
}
