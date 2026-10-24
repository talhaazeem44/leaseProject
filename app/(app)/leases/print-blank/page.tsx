"use client";

import Link from "next/link";
import type { ReactNode } from "react";

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="bg-sidebar text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide border-b-2 border-gold print:bg-neutral-200 print:text-black print:border print:border-black">
      {children}
    </div>
  );
}

function FieldGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  const colsClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div
      className={`grid grid-cols-1 ${colsClass} gap-x-6 gap-y-4 px-4 py-4 bg-offwhite-dim print:bg-white`}
    >
      {children}
    </div>
  );
}

function BlankField({ label, wide = false }: { label: string; wide?: boolean }) {
  return (
    <div className={`flex items-end gap-2 text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="font-medium min-w-[9.5rem] text-neutral-600 print:text-black shrink-0">
        {label}
      </span>
      <span className="flex-1 border-b border-gold/60 print:border-black h-5" />
    </div>
  );
}

function BlankChoiceField({ label, choices }: { label: string; choices: string[] }) {
  return (
    <div className="flex items-center gap-3 text-sm flex-wrap">
      <span className="font-medium min-w-[9.5rem] text-neutral-600 print:text-black shrink-0">
        {label}
      </span>
      <span className="flex gap-4 flex-wrap">
        {choices.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className="inline-block w-3.5 h-3.5 border border-gold print:border-black" />
            {c}
          </span>
        ))}
      </span>
    </div>
  );
}

function GuarantorSection({ title }: { title: string }) {
  return (
    <div className="border border-gold print:border-black rounded overflow-hidden print:break-inside-avoid">
      <SectionHeader>{title}</SectionHeader>
      <FieldGrid columns={2}>
        <BlankField label="Name" />
        <BlankField label="Father's Name" />
        <BlankField label="NIC #" />
        <BlankField label="Mobile #" />
        <BlankField label="Address" wide />
        <BlankChoiceField label="Residential Status" choices={["Own", "Rent"]} />
        <BlankField label="Occupation" />
        <BlankField label="Monthly Income" />
        <BlankField label="Relation" />
        <BlankField label="Business Address" />
        <BlankField label="Business Contact #" />
      </FieldGrid>
    </div>
  );
}

const INSTALLMENT_ROWS = 12;

export default function PrintBlankLeasePage() {
  return (
    <div className="max-w-6xl mx-auto p-6 print:p-0 space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/leases" className="text-sm text-gold-dark hover:underline">
          &larr; Back to Leases
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-sidebar hover:bg-sidebar-hover text-white text-sm font-medium px-4 py-2 rounded"
        >
          Print
        </button>
      </div>

      <div className="text-center space-y-1 print:text-black">
        <h1 className="text-xl font-bold">Motorcycle Lease / Credit Agreement</h1>
        <p className="text-sm text-neutral-500 print:text-black">Blank form &mdash; for manual completion</p>
      </div>

      <div className="border border-gold print:border-black rounded overflow-hidden print:break-inside-avoid">
        <SectionHeader>Motorcycle Information</SectionHeader>
        <FieldGrid>
          <BlankField label="Chassis #" />
          <BlankField label="Engine #" />
          <BlankField label="Purchase Date" />
          <BlankField label="Model" />
          <BlankField label="Color" />
          <BlankField label="Account No" />
          <BlankField label="Retail Price" />
        </FieldGrid>
      </div>

      <div className="border border-gold print:border-black rounded overflow-hidden print:break-inside-avoid">
        <SectionHeader>Customer Information</SectionHeader>
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <div className="flex-1">
            <FieldGrid>
              <BlankField label="Name" />
              <BlankField label="Father Name" />
              <BlankChoiceField label="Gender" choices={["Male", "Female", "Other"]} />
              <BlankField label="NIC" />
              <BlankField label="Date of Birth" />
              <BlankField label="Age Group" />
              <BlankChoiceField label="Marital Status" choices={["Single", "Married", "Other"]} />
              <BlankChoiceField label="Residential Status" choices={["Own", "Rent"]} />
              <BlankField label="Address" />
              <BlankField label="City" />
              <BlankField label="Mobile No" />
              <BlankField label="Email Address" />
              <BlankField label="Education" />
              <BlankField label="Profession" />
              <BlankField label="Bike Change Cycle" />
              <BlankField label="Credit Sale Type" />
              <BlankField label="Bike Key No" />
              <BlankField label="Business Address" />
              <BlankField label="Business Contact #" />
              <BlankChoiceField label="Pre-Delivery Safety Advice" choices={["Yes", "No"]} />
            </FieldGrid>
          </div>
          <div className="shrink-0 px-4 pt-3 sm:pt-0 sm:pr-4 print:hidden">
            <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-gold/50 rounded text-center text-xs text-neutral-500 italic">
              Insert Photo Here
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:gap-0">
        <GuarantorSection title="Guarantor 1" />
        <GuarantorSection title="Guarantor 2" />
      </div>

      <div className="border border-gold print:border-black rounded overflow-hidden print:break-inside-avoid">
        <SectionHeader>Credit Plan</SectionHeader>
        <FieldGrid>
          <BlankField label="File Ref No" />
          <BlankField label="Retail Price" />
          <BlankField label="Starting Month" />
          <BlankField label="Rent / Credit Price" />
          <BlankField label="No of Installments" />
          <BlankField label="Advance" />
          <BlankField label="Registration Fee" />
          <BlankField label="Document Charges" />
          <BlankField label="Rent / Profit Rate" />
          <BlankField label="Rent / Profit Amount" />
          <BlankField label="Credit Amount" />
        </FieldGrid>
      </div>

      <div className="border border-gold print:border-black rounded overflow-hidden print:break-inside-avoid">
        <SectionHeader>Installment Schedule</SectionHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-sidebar text-white print:bg-neutral-200 print:text-black">
              <tr>
                {[
                  "Sr",
                  "Installment Date",
                  "Scheduled Amount",
                  "Received Date",
                  "Received Amount",
                  "Short(-) / Over(+)",
                  "Remaining Balance",
                  "Late Charges",
                  "Payment Details",
                  "Cheque #",
                ].map((h) => (
                  <th
                    key={h}
                    className="border border-gold/40 print:border-black px-3 py-2 text-left font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: INSTALLMENT_ROWS }, (_, i) => (
                <tr key={i}>
                  <td className="border border-gold/40 print:border-black px-3 py-2">
                    {i + 1}
                  </td>
                  {Array.from({ length: 9 }, (_, j) => (
                    <td
                      key={j}
                      className="border border-gold/40 print:border-black px-3 py-2"
                    >
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs text-neutral-500 print:text-black">
          Use additional sheets if more than {INSTALLMENT_ROWS} installments are required.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 pt-8 print:break-inside-avoid">
        <div className="text-center">
          <div className="border-b border-gold/60 print:border-black h-10" />
          <p className="text-sm mt-1 text-neutral-500 print:text-black">Customer Signature</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gold/60 print:border-black h-10" />
          <p className="text-sm mt-1 text-neutral-500 print:text-black">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
}
