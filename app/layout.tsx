import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
  weight: ["400", "500"],
});

const SITE_TITLE = "Ponente — The legal AI that drafts, not just answers.";
const SITE_DESCRIPTION =
  "Ponente writes pleadings, affidavits, and position papers from your inputs — and cites every Philippine case, R.A., and constitutional provision behind each line.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://ponente.ph",
  ),
  title: {
    default: SITE_TITLE,
    template: "%s · Ponente",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Philippine legal AI",
    "pleading drafting",
    "NLRC position paper",
    "demand letter",
    "affidavit of loss",
    "Philippine case law",
    "Manila legal tech",
    "Filipino lawyers",
    "law firm software",
  ],
  authors: [{ name: "Ponente" }],
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "/",
    siteName: "Ponente",
    title: SITE_TITLE,
    description:
      "Pleadings, affidavits, and position papers grounded in Philippine sources.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ponente",
    description:
      "Pleadings, affidavits, and position papers grounded in Philippine sources.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5efe2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${plexMono.variable}`}
    >
      <body>
        {/* Skip link — visible only on keyboard focus. Improves Lighthouse a11y. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:text-parchment focus:px-3 focus:py-2 focus:rounded-[2px] focus:text-[13px]"
        >
          Skip to content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
