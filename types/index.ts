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
  documents?: { title: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export type PreferredContact = 'call' | 'email' | 'viber' | 'whatsapp';

export interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productUrl: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  quantityM2?: number;
  message: string;
  preferredContact: PreferredContact[];
  status: 'new' | 'contacted' | 'closed';
  createdAt: Date;
}

export interface InquiryFormData {
  productId: string;
  productName: string;
  productSku: string;
  productUrl: string;
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
}

// Filter types for category listing
export interface ProductFilters {
  categoryId?: string;
  brandIds?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  search?: string;
}
