import type { Metadata } from "next";
import "./globals.css";
import { SplashScreen } from "@/components/ui/splash-screen";

export const metadata: Metadata = {
  title: "FinOS – AI-Powered Financial Intelligence Platform",
  description:
    "Next-generation financial intelligence, automated reconciliation, and cash flow governance platform for Indian enterprises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        {/* Cinematic Splash Screen */}
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
