"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  computeCreditAmount,
  computeProfitAmount,
  computeMonthlyInstallmentBase,
  computeRentCreditPrice,
  computeLeaseProfit,
  getMarkupRate,
} from "@/lib/lease-calculations";
import { formatCurrency } from "@/lib/format";
import { createLease } from "../actions";

interface RateOption {
  tenureMonths: number;
  ratePercent: number;
}

const inputClass = "w-full border border-gold bg-white rounded px-2 py-1.5 text-sm";
const labelClass = "block text-xs font-medium text-neutral-600 mb-1";

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
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
        className={inputClass}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select name={name} required={required} className={inputClass} defaultValue="">
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

function PhotoUploadField() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
            setPreviewUrl(file ? URL.createObjectURL(file) : null);
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

export function LeaseForm({ rates }: { rates: RateOption[] }) {
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [advance, setAdvance] = useState<number>(0);
  const [tenureMonths, setTenureMonths] = useState<number>(rates[0]?.tenureMonths ?? 0);

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

  return (
    <form action={createLease} className="space-y-6">
      <SectionCard title="Motorcycle Information">
        <Field label="Chassis #" name="bike.chassisNo" required />
        <Field label="Engine #" name="bike.engineNo" required />
        <Field label="Model" name="bike.model" required />
        <Field label="Color" name="bike.color" required />
        <Field label="Purchase Date" name="bike.purchaseDate" type="date" required />
        <Field label="Account No" name="bike.accountNo" required />
        <Field
          label="Retail Price (Rs.)"
          name="bike.retailPrice"
          type="number"
          required
          defaultValue={0}
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
        <PhotoUploadField />
        <Field label="Name" name="customer.name" required />
        <Field label="Father Name" name="customer.fatherName" required />
        <SelectField
          label="Gender"
          name="customer.gender"
          required
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
        />
        <Field label="NIC" name="customer.nic" required />
        <Field label="Date of Birth" name="customer.dob" type="date" required />
        <Field label="Age Group" name="customer.ageGroup" />
        <SelectField
          label="Marital Status"
          name="customer.maritalStatus"
          required
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
          options={[
            { value: "own", label: "Own" },
            { value: "rent", label: "Rent" },
          ]}
        />
        <Field label="Address" name="customer.address" required />
        <Field label="City" name="customer.city" required />
        <Field label="Mobile No" name="customer.mobileNo" required />
        <Field label="Email Address" name="customer.email" type="email" />
        <Field label="Education" name="customer.education" />
        <Field label="Profession" name="customer.profession" />
        <Field label="Bike Change Cycle" name="customer.bikeChangeCycle" />
        <Field label="Credit Sale Type" name="customer.creditSaleType" required />
        <Field label="Bike Key No" name="customer.bikeKeyNo" />
        <Field label="Business Address" name="customer.businessAddress" />
        <Field label="Business Contact #" name="customer.businessContactNo" />
        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" name="customer.preDeliverySafetyAdvice" id="pdsa" />
          <label htmlFor="pdsa" className="text-sm">
            Pre-Delivery Safety Advice Given
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Guarantor 1 (optional)">
        <Field label="Name" name="guarantor1.name" />
        <Field label="Father's Name" name="guarantor1.fatherName" />
        <Field label="NIC #" name="guarantor1.nic" />
        <Field label="Mobile #" name="guarantor1.mobileNo" />
        <Field label="Address" name="guarantor1.address" />
        <SelectField
          label="Residential Status"
          name="guarantor1.residentialStatus"
          options={[
            { value: "own", label: "Own" },
            { value: "rent", label: "Rent" },
          ]}
        />
        <Field label="Occupation" name="guarantor1.occupation" />
        <Field label="Monthly Income" name="guarantor1.monthlyIncome" type="number" />
        <Field label="Relation" name="guarantor1.relation" />
        <Field label="Business Address" name="guarantor1.businessAddress" />
        <Field label="Business Contact #" name="guarantor1.businessContactNo" />
      </SectionCard>

      <SectionCard title="Guarantor 2 (optional)">
        <Field label="Name" name="guarantor2.name" />
        <Field label="Father's Name" name="guarantor2.fatherName" />
        <Field label="NIC #" name="guarantor2.nic" />
        <Field label="Mobile #" name="guarantor2.mobileNo" />
        <Field label="Address" name="guarantor2.address" />
        <SelectField
          label="Residential Status"
          name="guarantor2.residentialStatus"
          options={[
            { value: "own", label: "Own" },
            { value: "rent", label: "Rent" },
          ]}
        />
        <Field label="Occupation" name="guarantor2.occupation" />
        <Field label="Monthly Income" name="guarantor2.monthlyIncome" type="number" />
        <Field label="Relation" name="guarantor2.relation" />
        <Field label="Business Address" name="guarantor2.businessAddress" />
        <Field label="Business Contact #" name="guarantor2.businessContactNo" />
      </SectionCard>

      <fieldset className="border border-gold rounded">
        <legend className="bg-sidebar text-white text-sm font-semibold uppercase tracking-wide px-4 py-2 w-full border-b-2 border-gold">
          Credit Plan
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <Field label="File Ref No" name="creditPlan.fileRefNo" />
          <Field label="Starting Month" name="creditPlan.startingMonth" type="date" required />
          <div>
            <label className={labelClass}>
              No of Installments (Tenure) <span className="text-red-500">*</span>
            </label>
            <select
              name="creditPlan.numberOfInstallments"
              required
              className={inputClass}
              value={tenureMonths || ""}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
            >
              {rates.map((r) => (
                <option key={r.tenureMonths} value={r.tenureMonths}>
                  {r.tenureMonths} months ({r.ratePercent}%)
                </option>
              ))}
            </select>
          </div>
          <Field label="Registration Fee" name="creditPlan.registrationFee" type="number" defaultValue={0} />
          <Field label="Document Charges" name="creditPlan.documentCharges" type="number" defaultValue={0} />
          <div>
            <label className={labelClass}>
              Retail Price (Rs.) <span className="text-red-500">*</span>
            </label>
            <input
              name="creditPlan.retailPrice"
              type="number"
              required
              className={inputClass}
              value={retailPrice || ""}
              onChange={(e) => setRetailPrice(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Advance (Rs.)</label>
            <input
              name="creditPlan.advance"
              type="number"
              className={inputClass}
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
        className="bg-gold hover:bg-gold-dark text-white font-medium px-6 py-2 rounded"
      >
        Create Lease
      </button>
    </form>
  );
}
