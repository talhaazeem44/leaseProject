import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-screen print:block print:min-h-0">
      <AppSidebar />
      <div className="flex-1 min-w-0 bg-offwhite">{children}</div>
    </div>
  );
}
