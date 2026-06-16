// Core data models for the flooring catalog

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId?: string;
  order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  website?: string;
  countryOfOrigin?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
  variants?: {
    thumb?: string;
    card?: string;
    hero?: string;
    og?: string;
  };
}

export interface ProductSpec {
  key: string;
  label: string;
  value: string;
}

export interface ProductDetailsSection {
  title: string;
  items: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  shortDescription: string;
  description: string;
  images: ProductImage[];
  specs: ProductSpec[];
  price?: number; // Optional, for display only (no checkout)
  priceUnit?: string; // e.g., "m²", "pakovanje"
  inStock: boolean;
  featured: boolean;
  coveragePerPackage?: number; // m² per package for calculator
  externalLink?: string; // External link for collections (e.g., Gerflor)
  detailsSections?: ProductDetailsSection[];
  documents?: { title: string; url: string; type?: string }[];
  benefits?: string[]; // Key selling points, displayed as checkmark list
  compatibleAccessories?: string[]; // Slugs of compatible accessory products
  createdAt: Date;
  updatedAt: Date;
}

export type PreferredContact = 'call' | 'email' | 'viber' | 'whatsapp';
export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'offer_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'closed';

export interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productUrl: string;
  productImage?: string;
  productCategory?: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  quantityM2?: number;
  message: string;
  preferredContact: PreferredContact[];
  status: InquiryStatus;
  nextContactDate?: string;
  notes?: string;
  createdAt: Date;
}

export interface InquiryFormData {
  productId: string;
  productName: string;
  productSku: string;
  productUrl: string;
  productImage?: string;
  productCategory?: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  quantityM2?: string;
  message: string;
  preferredContact: PreferredContact[];
}

export interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  // Optional product context
  productName?: string;
  productUrl?: string;
  productImage?: string;
  productCategory?: string;
}

// =========================================
// Cenovnik — unos cena (dobavljač) za pregled/odobravanje
// =========================================
export type PriceSubmissionStatus = 'new' | 'reviewed' | 'approved' | 'rejected' | 'archived';

export interface PriceSubmissionColorOverride {
  colorSlug: string;
  colorCode?: string;
  colorName?: string;
  base?: number | null; // cena bez PDV-a
  withVat?: number | null; // cena sa PDV-om
}

export interface PriceSubmissionCollectionEntry {
  collectionSlug: string;
  collectionName: string;
  categorySlug: string;
  categoryName?: string;
  brandId: string;
  brandName?: string;
  base?: number | null; // cena kolekcije bez PDV-a
  withVat?: number | null; // cena kolekcije sa PDV-om
  colorOverrides: PriceSubmissionColorOverride[]; // samo boje sa posebnom cenom
}

export interface PriceSubmissionPayload {
  vatRate: number;
  collections: PriceSubmissionCollectionEntry[];
}

export interface PriceSubmission {
  id: string;
  status: PriceSubmissionStatus;
  payload: PriceSubmissionPayload;
  note?: string;
  tags: string[];
  fileName?: string;
  fileMime?: string;
  submittedBy: string;
  createdAt: Date;
}

// Filter types for category listing
export interface ProductFilters {
  categoryId?: string;
  brandIds?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  search?: string;
  type?: string; // For vinyl type filter: 'homogeni' | 'heterogeni'
  safety?: string; // For vinyl safety filter: '1' = only protivklizni/sigurnosni collections
  zidne?: string; // For vinyl wall-covering filter: '1' = only zidne obloge collections
  collections?: string[]; // For LVT collection filter
  listing?: 'core' | 'accessory' | 'all'; // Listing segment filter for categories with accessory taxonomy
  thickness?: string[]; // For overall thickness filter (for LVT) - array of thickness values like "2.00", "2.50", etc.
  woodType?: string; // For Parket: 'Hrast' | 'Jasen'
  toolGroup?: string[]; // For Alat: Romus top-level tool groups, represented as URL-safe slugs
  toolSubcategory?: string[]; // For Alat: Romus tool subcategories, represented as URL-safe slugs
}
