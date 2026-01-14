import { Metadata } from 'next';

const SITE_NAME = 'Podovi.rs';
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://podovi.rs';
const SITE_DESCRIPTION = 'Pronađite savršen pod za vaš prostor. Širok izbor laminata, vinila, parketa i drugih podnih obloga od vodećih brendova.';

export function generateDefaultMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} - Katalog podnih obloga`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: ['podovi', 'laminat', 'vinil', 'parket', 'podne obloge', 'Srbija', 'Beograd'],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'sr_RS',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: `${SITE_NAME} - Katalog podnih obloga`,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} - Katalog podnih obloga`,
      description: SITE_DESCRIPTION,
    },
  };
}

export function generateProductMetadata(params: {
  title: string;
  description: string;
  url: string;
  image?: string;
  price?: number;
  currency?: string;
}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: params.title,
    description: params.description,
    openGraph: {
      type: 'website',
      title: params.title,
      description: params.description,
      url: params.url,
      images: params.image ? [{ url: params.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: params.image ? [params.image] : undefined,
    },
  };
}

export function generateCategoryMetadata(params: {
  title: string;
  description: string;
  url: string;
}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: params.title,
    description: params.description,
    openGraph: {
      type: 'website',
      title: params.title,
      description: params.description,
      url: params.url,
    },
    twitter: {
      card: 'summary',
      title: params.title,
      description: params.description,
    },
  };
}
