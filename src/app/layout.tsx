import type { Metadata } from "next";
import "./globals.css";
import { SplashScreen } from "@/components/ui/splash-screen";
import { ThemeProvider } from "@/lib/theme-provider";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('finos-theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className="font-sans bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-purple-500 selection:text-white transition-colors duration-200"
      >
        <ThemeProvider>
          {/* Cinematic Splash Screen */}
          <SplashScreen />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
