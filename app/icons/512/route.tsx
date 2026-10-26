import { createAppIcon } from "@/lib/app-icon";

export function GET() {
  return createAppIcon(512, { maskable: true });
}
