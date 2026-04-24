import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppToaster from "@/components/ui/AppToaster";
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
  title: "AI Document Assistant",
  description: "Tải lên, xử lý và chat với tài liệu bằng AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900 antialiased`}
      >
        {children}
        <AppToaster />
      </body>
    </html>
  );
}