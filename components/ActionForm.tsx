"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

export function ActionForm({
  action,
  successMessage,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  className?: string;
  children: ReactNode;
}) {
  async function handleAction(formData: FormData) {
    try {
      await action(formData);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form action={handleAction} className={className}>
      {children}
    </form>
  );
}
