import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productRepository } from '@/lib/repositories/product-repository';
import { categoryRepository } from '@/lib/repositories/category-repository';
import { brandRepository } from '@/lib/repositories/brand-repository';
import CertificationBadges from '@/components/CertificationBadges';
import EcoFeatures from '@/components/EcoFeatures';
import ProductColorSelector from '@/components/ProductColorSelector';
import ProductImage from '@/components/ProductImage';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCharacteristics from '@/components/ProductCharacteristics';
import type { Product, ProductImage as ProductImageType, ProductSpec, ProductDetailsSection } from '@/types';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
  searchParams?: { color?: string };
}

interface ColorFromJSON {
  collection: string;
  collection_name: string;
  code: string;
  name: string;
  full_name: string;
  slug: string;
  image_url?: string;
  texture_url?: string;
  lifestyle_url?: string;
  image_count: number;
  welding_rod?: string;
  dimension?: string;
  format?: string;
  overall_thickness?: string;
  characteristics?: Record<string, string>;
  description?: string;
}

type ColorSource = {
  categorySlug: 'lvt' | 'linoleum';
  color: ColorFromJSON;
};

const lvtColors = (lvtColorsData as { colors?: ColorFromJSON[] }).colors || [];
const linoleumColors = (linoleumColorsData as { colors?: ColorFromJSON[] }).colors || [];

async function loadColorFromJson(slug: string): Promise<ColorSource | null> {
  const lvtMatch = lvtColors.find(color => color.slug === slug);
  if (lvtMatch) {
    return { categorySlug: 'lvt', color: lvtMatch };
  }

  const linoleumMatch = linoleumColors.find(color => color.slug === slug);
  if (linoleumMatch) {
    return { categorySlug: 'linoleum', color: linoleumMatch };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const candidates: Array<{ categorySlug: 'lvt' | 'linoleum'; fileName: string }> = [
    { categorySlug: 'lvt', fileName: 'lvt_colors_complete.json' },
    { categorySlug: 'linoleum', fileName: 'linoleum_colors_complete.json' },
  ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(`${baseUrl}/data/${candidate.fileName}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      if (!data || !Array.isArray(data.colors)) {
        continue;
      }
      const match = data.colors.find((color: ColorFromJSON) => color.slug === slug);
      if (match) {
        return { categorySlug: candidate.categorySlug, color: match };
      }
    } catch (error) {
      console.error('Error reading remote color JSON:', candidate.fileName, error);
    }
  }

  return null;
}

function toSpecKey(label: string, fallbackIndex?: number): string {
  const normalized = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (normalized) {
    return normalized;
  }
  if (typeof fallbackIndex === 'number') {
    return `spec-${fallbackIndex}`;
  }
  return 'spec';
}

function buildSpecsFromColor(color: ColorFromJSON): ProductSpec[] {
  const specs: ProductSpec[] = [];

  if (color.format) {
    specs.push({ key: 'format', label: 'Format', value: color.format });
  }
  if (color.overall_thickness) {
    specs.push({ key: 'overall_thickness', label: 'Ukupna debljina', value: color.overall_thickness });
  }
  if (color.dimension) {
    specs.push({ key: 'dimension', label: 'Dimenzije', value: color.dimension });
  }
  if (color.welding_rod) {
    specs.push({ key: 'welding_rod', label: 'Šifra šipke za varenje', value: color.welding_rod });
  }

  if (color.characteristics) {
    const entries = Object.entries(color.characteristics);
    entries.forEach(([label, value], index) => {
      if (!value) return;
      specs.push({ key: toSpecKey(label, index), label, value });
    });
  }

  return specs;
}

function mergeSpecs(base: ProductSpec[], extra: ProductSpec[]): ProductSpec[] {
  const merged = new Map<string, ProductSpec>();
  for (const spec of base) {
    merged.set(spec.key, spec);
  }
  for (const spec of extra) {
    merged.set(spec.key, spec);
  }
  return Array.from(merged.values());
}

function parseDescriptionToSections(description: string): ProductDetailsSection[] {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const sections: ProductDetailsSection[] = [];
  const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentSection: ProductDetailsSection | null = null;
  
  // Section titles to look for (case insensitive, with variations)
  const sectionTitles = [
    'Design & Product',
    'Product & Design',
    'Installation & Maintenance',
    'Market Application',
    'Sustainability',
    'Sustainability & Comfort',
    'Technical',
    'Technical and environmental',
    'Environmental'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line is a section title (more flexible matching)
    const isSectionTitle = sectionTitles.some(title => {
      const titleLower = title.toLowerCase();
      const lineLower = line.toLowerCase();
      
      // Exact match
      if (lineLower === titleLower) return true;
      
      // Starts with title (for variations)
      if (lineLower.startsWith(titleLower)) return true;
      
      // Contains title (for variations like "Technical and environmental")
      if (lineLower.includes(titleLower) && line.length < 60) return true;
      
      return false;
    });
    
    if (isSectionTitle) {
      // Save previous section if exists
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: line,
        items: []
      };
    } else if (currentSection) {
      // Add as bullet point to current section
      // Skip very short lines that might be just separators or empty
      if (line.length > 3 && !line.match(/^[-=]+$/)) {
        currentSection.items.push(line);
      }
    }
    // If we're before any section, skip intro lines (they're not part of structured sections)
  }
  
  // Add last section if exists
  if (currentSection && currentSection.items.length > 0) {
    sections.push(currentSection);
  }
  
  return sections;
}

function colorToProduct(source: ColorSource, slug: string, collectionSlugOverride?: string): Product & { collectionSlug: string } {
  const { categorySlug, color } = source;
  const isLVT = categorySlug === 'lvt';
  const categoryId = isLVT ? '6' : '7';
  const brandId = '6';
  const name = color.full_name || `${color.code} ${color.name}`.trim();
  const primaryImageUrl = isLVT
    ? (color.texture_url || color.lifestyle_url || color.image_url || '')
    : (color.texture_url || color.image_url || '');

  const images: ProductImageType[] = primaryImageUrl
    ? [{
        id: `color-img-${categorySlug}-${color.slug}`,
        url: primaryImageUrl,
        alt: name,
        isPrimary: true,
        order: 1,
      }]
    : [];

  const specs = buildSpecsFromColor(color);

  // Use description from JSON if available, otherwise generate default
  const description = (color.description && typeof color.description === 'string' && color.description.trim())
    ? color.description.trim()
    : `${name} iz kolekcije ${color.collection_name}`;

  return {
    id: `color-${categorySlug}-${color.slug}`,
    name,
    slug,
    sku: color.code,
    categoryId,
    brandId,
    shortDescription: `${color.collection_name} - ${color.name}`,
    description,
    images,
    specs,
    price: undefined,
    priceUnit: undefined,
    inStock: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    collectionSlug: collectionSlugOverride || color.collection,
  };
}

async function resolveProductBySlug(slug: string): Promise<(Product & { collectionSlug?: string }) | null> {
  // First try to find product by slug directly (for collections)
  const product = await productRepository.findBySlug(slug);
  if (product) {
    return product;
  }

  // Try to parse slug as collection-slug-color-slug format
  // Example: "gerflor-creation-30-ballerina-41870347"
  // Strategy: Try to find the collection slug first, then extract color slug
  
  // Get all products to find matching collection
  const allProducts = await productRepository.findAll();
  
  // Try to match collection slug from the beginning of the slug
  for (const prod of allProducts) {
    if (slug.startsWith(prod.slug + '-')) {
      // Found collection! Extract color slug
      const colorSlug = slug.substring(prod.slug.length + 1); // +1 for the dash
      
      // Try to find color by its slug
      const colorSource = await loadColorFromJson(colorSlug);
      if (colorSource) {
        const colorProduct = colorToProduct(colorSource, slug, prod.slug);
        return colorProduct;
      }
    }
  }

  // Fallback: try to load color by slug directly (for backward compatibility)
  const colorSource = await loadColorFromJson(slug);
  if (colorSource) {
    return colorToProduct(colorSource, slug);
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  
  try {
    const product = await resolveProductBySlug(params.slug);
    
    if (!product) {
      return {
        metadataBase: new URL(baseUrl),
        title: 'Proizvod nije pronađen',
      };
    }

    const category = product.categoryId 
      ? await categoryRepository.findById(product.categoryId)
      : null;
    const brand = product.brandId 
      ? await brandRepository.findById(product.brandId)
      : null;
    const primaryImage = product.images?.[0];

    // Build rich description
    const priceText = product.price && product.price > 0 
      ? `Cena: ${product.price.toLocaleString('sr-RS')} RSD/${product.priceUnit || 'm²'}` 
      : '';
    const brandText = brand ? `${brand.name}` : '';
    const categoryText = category ? `${category.name}` : '';
    
    const description = `${product.shortDescription || product.description || ''} ${priceText}. ${brandText} ${categoryText}`.trim();

    // Build keywords
    const keywords = [
      product.name,
      brandText,
      categoryText,
      'podovi',
      'podne obloge',
      'Srbija',
      'laminat',
      'vinil',
      'LVT'
    ].filter(Boolean).join(', ');

    return {
      metadataBase: new URL(baseUrl),
      title: `${product.name} - Cena i Karakteristike | Podovi.online`,
      description: description.substring(0, 160), // SEO limit
      keywords,
      authors: [{ name: 'Podovi.online' }],
      openGraph: {
        title: product.name,
        description: product.shortDescription || product.description || '',
        type: 'website',
        locale: 'sr_RS',
        url: `${baseUrl}/proizvodi/${params.slug}`,
        siteName: 'Podovi.online',
        images: primaryImage ? [
          {
            url: primaryImage.url,
            width: 1200,
            height: 630,
            alt: primaryImage.alt || product.name,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.shortDescription || product.description || '',
        images: primaryImage ? [primaryImage.url] : [],
      },
      alternates: {
        canonical: `${baseUrl}/proizvodi/${params.slug}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      metadataBase: new URL(baseUrl),
      title: 'Proizvod | Podovi.online',
      description: '',
    };
  }
}

export default async function ProductPage({ params, searchParams }: Props) {
  try {
    const product = await resolveProductBySlug(params.slug);
    
    if (!product) {
      notFound();
    }

    // Ensure product has required fields with defensive checks
    if (!product.images || !Array.isArray(product.images)) {
      product.images = [];
    }
    if (!product.specs || !Array.isArray(product.specs)) {
      product.specs = [];
    }
    if (!product.name || typeof product.name !== 'string') {
      product.name = 'Proizvod';
    }
    if (!product.shortDescription || typeof product.shortDescription !== 'string') {
      product.shortDescription = (product.description && typeof product.description === 'string') ? product.description : '';
    }
    if (!product.description || typeof product.description !== 'string') {
      product.description = (product.shortDescription && typeof product.shortDescription === 'string') ? product.shortDescription : '';
    }

    const selectedColorSlug = typeof searchParams?.color === 'string' ? searchParams.color : '';
    if (selectedColorSlug) {
      const colorSource = await loadColorFromJson(selectedColorSlug);
      if (colorSource?.color) {
        const colorSpecs = buildSpecsFromColor(colorSource.color);
        if (colorSpecs.length > 0) {
          product.specs = mergeSpecs(product.specs, colorSpecs);
        }
        // Update description from color if available
        if (colorSource.color.description && typeof colorSource.color.description === 'string' && colorSource.color.description.trim()) {
          product.description = colorSource.color.description.trim();
        }
      }
    }
    if (!product.slug || typeof product.slug !== 'string') {
      product.slug = params.slug;
    }
    if (!product.categoryId || typeof product.categoryId !== 'string') {
      product.categoryId = '6'; // Default to LVT
    }
    if (!product.brandId || typeof product.brandId !== 'string') {
      product.brandId = '6'; // Default to Gerflor
    }

    const category = product.categoryId 
      ? await categoryRepository.findById(product.categoryId)
      : null;
    const brand = product.brandId 
      ? await brandRepository.findById(product.brandId)
      : null;
    const primaryImage = product.images && product.images.length > 0 
      ? (product.images.find(img => img.isPrimary) || product.images[0])
      : null;

  // Schema.org structured data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || product.shortDescription || '',
    "image": primaryImage ? `${baseUrl}${primaryImage.url}` : undefined,
    "brand": brand ? {
      "@type": "Brand",
      "name": brand.name
    } : undefined,
    "category": category?.name,
    "offers": {
      "@type": "Offer",
      "price": product.price && product.price > 0 ? product.price : undefined,
      "priceCurrency": "RSD",
      "availability": product.inStock 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "url": `${baseUrl}/proizvodi/${product.slug}`,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
    "sku": product.sku,
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container py-4">
            <Breadcrumbs
              items={[
                ...(category ? [{ label: category.name, href: `/kategorije/${category.slug}` }] : []),
                { label: product.name }
              ]}
            />
          </div>
        </div>

      {/* Product Content */}
      <div className="container py-12">
        {(product.categoryId === '6' || product.categoryId === '7') ? (
          <>
            {/* LVT and Linoleum products with color selector */}
            <ProductColorSelector
              initialImage={primaryImage}
              collectionSlug={(product as { collectionSlug?: string }).collectionSlug || product.slug}
              productName={product.name}
              productPrice={product.price}
              priceUnit={product.priceUnit}
              brand={brand ? { name: brand.name, slug: brand.slug } : null}
              shortDescription={product.shortDescription}
              specs={product.specs}
              inStock={product.inStock}
              productSlug={product.slug}
              externalLink={product.externalLink}
            />

            {/* Description & Characteristics Side by Side */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Description */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Opis proizvoda</h2>
                
                {/* Parse description into sections */}
                {(() => {
                  const descriptionSections = product.description 
                    ? parseDescriptionToSections(product.description)
                    : [];
                  
                  // Use parsed sections if available, otherwise use product.detailsSections
                  const sectionsToDisplay = descriptionSections.length > 0 
                    ? descriptionSections 
                    : (product.detailsSections || []);
                  
                  if (sectionsToDisplay.length > 0) {
                    return (
                      <div className="space-y-6">
                        {sectionsToDisplay.map((section, idx) => (
                          <div key={`${section.title}-${idx}`} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
                            {section.items && section.items.length > 0 && (
                              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                                {section.items.map((item, index) => (
                                  <li key={`${section.title}-${index}`} className="text-base leading-relaxed">{item}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // Fallback: show description as plain text if no sections found
                  if (product.description) {
                    return (
                      <div className="prose prose-lg max-w-none text-gray-700">
                        <p className="whitespace-pre-line">{product.description}</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>
              
              {/* Characteristics */}
              <ProductCharacteristics specs={product.specs} categoryId={product.categoryId} />
            </div>
          </>
        ) : (
          // Non-LVT products - standard layout
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-100">
                {primaryImage ? (
                  <ProductImage
                    src={primaryImage.url}
                    alt={primaryImage.alt}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={100}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>Bez slike</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-8">
              {/* Brand */}
              {brand && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Brend:</span>
                  <Link
                    href={`/brendovi/${brand.slug}`}
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    {brand.name}
                  </Link>
                </div>
              )}

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  {product.name}
                </h1>
                {product.shortDescription && (
                  <p className="text-xl text-gray-600">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Price (if available) */}
              {product.price && product.price > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold text-primary-600">
                      {product.price.toLocaleString('sr-RS')}
                    </span>
                    <span className="text-lg text-gray-600">RSD</span>
                    {product.priceUnit && (
                      <span className="text-lg text-gray-500">/ {product.priceUnit}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    product.inStock ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-gray-700">
                  {product.inStock ? 'Na stanju' : 'Nije dostupno'}
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/kontakt?product=${product.slug}`}
                  className="btn bg-primary-600 text-white hover:bg-primary-700 text-center text-lg px-8 py-4 flex-1"
                >
                  Pošaljite upit
                </Link>
                {product.externalLink && (
                  <a
                    href={product.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn border-2 border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600 text-center text-lg px-8 py-4 flex-1"
                  >
                    Pogledaj na sajtu proizvođača
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description & Specs - For Non-LVT/Linoleum Only */}
        {product.categoryId !== '6' && product.categoryId !== '7' && (
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Description */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Opis proizvoda</h2>
              
              {/* Parse description into sections */}
              {(() => {
                const descriptionSections = product.description 
                  ? parseDescriptionToSections(product.description)
                  : [];
                
                // Use parsed sections if available, otherwise use product.detailsSections
                const sectionsToDisplay = descriptionSections.length > 0 
                  ? descriptionSections 
                  : (product.detailsSections || []);
                
                if (sectionsToDisplay.length > 0) {
                  return (
                    <div className="space-y-6">
                      {sectionsToDisplay.map((section, idx) => (
                        <div key={`${section.title}-${idx}`} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
                          {section.items && section.items.length > 0 && (
                            <ul className="list-disc pl-5 text-gray-700 space-y-2">
                              {section.items.map((item, index) => (
                                <li key={`${section.title}-${index}`} className="text-base leading-relaxed">{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                
                // Fallback: show description as plain text if no sections found
                if (product.description) {
                  return (
                    <div className="prose prose-lg max-w-none text-gray-700">
                      <p className="whitespace-pre-line">{product.description}</p>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>

            {/* Specifications */}
            {product.specs && Array.isArray(product.specs) && product.specs.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Karakteristike</h2>
                <dl className="space-y-4">
                  {product.specs.map((spec) => (
                    <div key={spec.key} className="border-b border-gray-200 pb-4 last:border-0">
                      <dt className="text-sm font-medium text-gray-500 mb-1">
                        {spec.label}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Certifications & Eco Features - Full Width Below for LVT and Linoleum */}
        {(product.categoryId === '6' || product.categoryId === '7') && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certifications */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Sertifikati kvaliteta
              </h3>
              <CertificationBadges certifications={["FloorScore", "Indoor Air Comfort Gold", "M1", "A+", "CE", "REACH", "EPD"]} />
            </div>

            {/* Eco Features */}
            <EcoFeatures 
              features={product.categoryId === '7' 
                ? ["98% prirodnih sastojaka", "100% reciklabilno", "Niske VOC emisije", "Antibakterijsko"]
                : ["Bez ftalata", "100% reciklabilno", "30% recikliranog sadržaja", "Niske VOC emisije"]
              } 
              underfloorHeating={true}
            />
          </div>
        )}

      </div>
      </div>
    </>
  );
  } catch (error) {
    console.error('Error rendering product page:', error);
    notFound();
  }
}
