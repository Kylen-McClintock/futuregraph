import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.agifutures.org"),
  title: {
    default: "FutureGraph | Conditional AGI Scenario Atlas & Forecast Audit",
    template: "%s | FutureGraph",
  },
  description:
    "Explore, stress-test, and forecast the branching future of artificial intelligence, Longevity Escape Velocity, and post-AGI governance via interactive conditional probability graphs.",
  openGraph: {
    siteName: "AGI Futures | FutureGraph",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "color-scheme": "light dark",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
  ],
};

const futureGraphJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": "https://www.agifutures.org/futuregraph#app",
  name: "FutureGraph Scenario Atlas",
  url: "https://www.agifutures.org/futuregraph",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  isAccessibleForFree: true,
  description:
    "Interactive conditional probability network and scenario forecasting engine for AI 2027, AI 2040, AI 2050, Longevity Escape Velocity (LEV), and FairMarkets AI Governance.",
  creator: {
    "@type": "Person",
    "@id": "https://kylen.vc/#kylen",
    name: "Kylen McClintock",
  },
  publisher: {
    "@type": "Organization",
    "@id": "https://www.agifutures.org/#organization",
    name: "AGI Futures",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("color-scheme");var m=document.querySelector('meta[name="color-scheme"]');if(m){m.content=s||"light dark";}if(s==="light"){document.documentElement.classList.add("light");document.documentElement.classList.remove("dark");}else{document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");}}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(futureGraphJsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
