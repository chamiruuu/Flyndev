import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { INTRO_SEEN_KEY } from "@/lib/intro";
import { organizationJsonLd, seo } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: seo.title,
  description: seo.description,
  applicationName: site.name,
  alternates: { canonical: site.url },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: seo.title,
    description: seo.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* Runs before first paint: skip the intro if this visit already saw it, decide whether the
            page entrance should wait for it, and pick this refresh's status word (the next one in
            the list each time). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement,seen=sessionStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)});if(seen)d.dataset.intro="seen";d.dataset.reveal=seen?"go":"wait";var n=${site.statuses.length},i;try{var l=parseInt(localStorage.getItem("flyndev-status"),10);i=isNaN(l)?Math.floor(Math.random()*n):(l+1)%n;localStorage.setItem("flyndev-status",String(i))}catch(e){i=Math.floor(Math.random()*n)}d.dataset.status=String(i)}catch(e){}`,
          }}
        />
        {children}
        <script
          type="application/ld+json"
          // "<" is escaped so the JSON can never close the script tag early
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
