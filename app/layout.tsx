import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/supabase-context";
import ConditionalSidebar from "@/components/ConditionalSidebar";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pastor Flow — Organize the work of shepherding",
  description: "The operating system for healthy pastoral leadership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full flex" suppressHydrationWarning>
        <AppProvider>
          <ConditionalSidebar />
          <main className="flex-1 min-h-screen overflow-auto pt-14 md:pt-0">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
