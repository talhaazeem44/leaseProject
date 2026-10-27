"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ActionForm({
  action,
  successMessage,
  confirmMessage,
  redirectTo,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  confirmMessage?: string;
  redirectTo?: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  async function handleAction(formData: FormData) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    try {
      await action(formData);
      toast.success(successMessage);
      if (redirectTo) router.push(redirectTo);
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
