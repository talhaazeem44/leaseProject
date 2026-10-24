import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sami Electronics",
  description: "Motorcycle lease management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <main className="flex-1 flex flex-col">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-offwhite)",
              borderColor: "var(--color-gold)",
              color: "var(--color-foreground)",
            },
            classNames: {
              success: "!border-gold !bg-offwhite-dim",
              error: "!border-red-300 !bg-red-50",
            },
          }}
        />
      </body>
    </html>
  );
}
