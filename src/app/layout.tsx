import type { Metadata } from "next";
import { DemoProvider } from "@/components/demo-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "SIPRIMA — Riset & Magang",
  description:
    "Preview demo Sistem Informasi Perizinan Riset dan Magang. Seluruh data sintetis, tersimpan di browser Anda.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
