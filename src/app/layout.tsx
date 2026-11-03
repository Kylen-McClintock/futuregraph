import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FutureGraph — AI 2027 Conditional Probability Network & Forecast Audit",
  description:
    "Explore, stress-test, and forecast the branching future of artificial intelligence from Mid 2025 through the October 2027 Oversight Fork into Race and Slowdown endings.",
  other: {
    "color-scheme": "light dark",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
