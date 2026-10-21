import Link from "next/link";
import { Suspense } from "react";
import { getLeasesCollection } from "@/lib/db/collections";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildMobileSearchRegex } from "@/lib/search";
import { Table, THead, Th, Td } from "@/components/Table";

export default function LeasesPage({ searchParams }: PageProps<"/leases">) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Leases</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/leases/print-blank"
            className="border border-neutral-300 dark:border-neutral-700 text-sm font-medium px-4 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Print Blank Form
          </Link>
          <Link
            href="/leases/new"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            + New Lease
          </Link>
        </div>
      </div>

      <Suspense fallback={<p className="text-sm text-neutral-500">Loading leases…</p>}>
        <LeasesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LeasesContent({ searchParams }: Pick<PageProps<"/leases">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const collection = await getLeasesCollection();
  const filter = query ? { "customer.mobileNo": buildMobileSearchRegex(query) } : {};
  const leases = await collection.find(filter).sort({ createdAt: -1 }).toArray();

  return (
    <>
      <form action="/leases" className="mb-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by customer mobile number…"
          className="flex-1 max-w-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium px-4 py-1.5 rounded"
        >
          Search
        </button>
        {query && (
          <Link href="/leases" className="text-sm text-neutral-500 hover:underline self-center">
            Clear
          </Link>
        )}
      </form>

      {leases.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {query
            ? `No customers found for mobile number "${query}".`
            : "No leases yet. Create your first one."}
        </p>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded overflow-hidden">
          <Table>
            <THead>
              <Th>File Ref</Th>
              <Th>Customer</Th>
              <Th>Mobile No</Th>
              <Th>Bike Model</Th>
              <Th>Chassis #</Th>
              <Th>Tenure</Th>
              <Th>Monthly Installment</Th>
              <Th>Starting Month</Th>
              <Th />
            </THead>
            <tbody>
              {leases.map((lease) => {
                const monthly =
                  (lease.creditPlan.creditAmount + lease.creditPlan.rentProfitAmount) /
                  lease.creditPlan.numberOfInstallments;
                return (
                  <tr key={lease._id!.toString()}>
                    <Td>{lease.creditPlan.fileRefNo || "—"}</Td>
                    <Td>{lease.customer.name}</Td>
                    <Td>{lease.customer.mobileNo}</Td>
                    <Td>{lease.bike.model}</Td>
                    <Td>{lease.bike.chassisNo}</Td>
                    <Td>{lease.creditPlan.numberOfInstallments} mo</Td>
                    <Td>Rs. {formatCurrency(monthly)}</Td>
                    <Td>{formatDate(lease.creditPlan.startingMonth)}</Td>
                    <Td>
                      <Link
                        href={`/leases/${lease._id!.toString()}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
