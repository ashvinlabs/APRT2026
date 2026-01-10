import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/UserContext";
import { Toaster } from "@/components/ui/toaster";
import GlobalFooter from "@/components/GlobalFooter";

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
      <body className={`${inter.variable} flex flex-col min-h-screen`} suppressHydrationWarning>
        <UserProvider>
          <div className="flex-1">
            {children}
          </div>
          <GlobalFooter />
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
