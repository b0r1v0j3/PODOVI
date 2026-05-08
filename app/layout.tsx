import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CompareBar from "@/components/CompareBar";
import { CompareProvider } from "@/lib/context/CompareContext";
import { FavoritesProvider } from "@/lib/context/FavoritesContext";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/seo/site-config";
import BackToTop from "@/components/BackToTop";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "podovi",
  description: "Katalog podnih obloga, lajsni, otirača i specijalnih sistema za stambene, poslovne i tehničke prostore.",
  keywords: "podovi, laminat, vinil, parket, lajsne, otirači, ulazni sistemi, podne obloge, Srbija",
  authors: [{ name: "Podovi" }],
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Vaš Pod. Vaš Stil. Vaša Priča.",
    description: "Podne obloge, lajsne, otirači i prateći sistemi na jednom mestu.",
    type: "website",
    locale: "sr_RS",
    url: SITE_URL,
    siteName: "podovi.online",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Podovi.online katalog asortimana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaš Pod. Vaš Stil. Vaša Priča.",
    description: "Podne obloge, lajsne, otirači i prateći sistemi na jednom mestu.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className={inter.className}>
        <GoogleAnalytics />
        {/* Organization + WebSite structured data (site-wide) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              generateOrganizationSchema(),
              generateWebsiteSchema(),
            ]),
          }}
        />
        <CompareProvider>
          <FavoritesProvider>
            {/* Skip to main content link for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-primary-600 text-white px-4 py-2 rounded-md z-50
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Preskoči na sadržaj
            </a>

            <div className="flex flex-col min-h-screen">
              <Header />
              <main id="main-content" className="flex-grow">
                {children}
              </main>
              <Footer />
              <WhatsAppButton />
              <BackToTop />
              <CompareBar />
            </div>
          </FavoritesProvider>
        </CompareProvider>
      </body>
    </html>
  );
}
