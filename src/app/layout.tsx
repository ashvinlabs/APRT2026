import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APRT2026 - Aplikasi Pemilu RT",
  description: "Penunjang pelaksanaan pemilu RT 12 Baturetno",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
