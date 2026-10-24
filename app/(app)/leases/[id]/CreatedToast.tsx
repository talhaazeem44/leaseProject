"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function CreatedToast() {
  const searchParams = useSearchParams();
  const created = searchParams.get("created");

  useEffect(() => {
    if (created === "1") {
      toast.success("Lease created successfully");
      // Plain history API, not the Next.js router: avoids re-triggering this
      // route segment (and racing the toast) just to tidy up the URL.
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [created]);

  return null;
}
