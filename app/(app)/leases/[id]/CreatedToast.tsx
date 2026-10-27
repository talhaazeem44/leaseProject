"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function CreatedToast() {
  const searchParams = useSearchParams();
  const created = searchParams.get("created");
  const updated = searchParams.get("updated");

  useEffect(() => {
    if (created === "1" || updated === "1") {
      toast.success(created === "1" ? "Lease created successfully" : "Lease updated successfully");
      // Plain history API, not the Next.js router: avoids re-triggering this
      // route segment (and racing the toast) just to tidy up the URL.
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [created, updated]);

  return null;
}
