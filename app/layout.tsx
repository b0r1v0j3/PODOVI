import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Podovi - Katalog podnih obloga",
  description: "Pronađite savršen pod za vaš prostor. Širok izbor laminata, vinila, parketa i drugih podnih obloga od vodećih brendova.",
  keywords: "podovi, laminat, vinil, parket, podne obloge, Srbija",
  authors: [{ name: "Podovi" }],
  openGraph: {
    title: "Vaš Pod. Vaš Stil. Vaša Priča.",
    description: "Sve vrste podova, prateći asortiman i alati za podove.",
    type: "website",
    locale: "sr_RS",
    url: "https://podovi.online",
    siteName: "Podovi.online",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Podovi - Katalog podnih obloga",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaš Pod. Vaš Stil. Vaša Priča.",
    description: "Sve vrste podova, prateći asortiman i alati za podove.",
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
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </div>
      </body>
    </html>
  );
}
