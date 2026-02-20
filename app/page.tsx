import Link from 'next/link';
import { categoryRepository } from '@/lib/repositories/category-repository';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import ScrollReveal from '@/components/ScrollReveal';
import { Product } from '@/types';
import lvtColorsData from '@/public/data/lvt_colors_complete.json';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import carpetColorsData from '@/public/data/carpet_tiles_complete.json';

export const metadata = {
  title: 'Podovi - Katalog podnih obloga | Početna',
  description: 'Pronađite savršen pod za vaš prostor. Laminat, vinil, parket - najkvalitetnije podne obloge od vodećih svetskih brendova.',
};

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
  description?: string;
}

// Convert color from JSON to Product format
function colorToProduct(color: ColorFromJSON, categoryId: string, brandId: string): Product {
  const imageUrl = color.image_url || color.texture_url || color.lifestyle_url || '';

  // Get collection slug from color (for LVT/Linoleum use 'collection', for Carpet use 'collection_slug')
  const collectionSlug = (color as any).collection_slug || color.collection || '';

  const product: Product & { collectionSlug?: string } = {
    id: `color-${color.slug}`,
    name: color.full_name || `${color.code} ${color.name}`,
    slug: color.slug,
    sku: color.code || '',
    categoryId,
    brandId,
    shortDescription: `${color.collection_name} - ${color.name}`,
    description: color.description || '',
    images: imageUrl ? [{
      id: `img-${color.slug}`,
      url: imageUrl,
      alt: color.full_name || color.name,
      isPrimary: true,
      order: 1,
    }] : [],
    specs: [],
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Store collection slug for routing (will be used in ProductCard to link to collection)
    collectionSlug: collectionSlug || undefined,
  };

  return product;
}

export default async function HomePage() {
  const categories = await categoryRepository.findAll();

  // Load colors from JSON files
  const lvtColors = (lvtColorsData as { colors?: ColorFromJSON[] }).colors || [];
  const linoleumColors = (linoleumColorsData as { colors?: ColorFromJSON[] }).colors || [];
  const carpetColors = (carpetColorsData as { colors?: ColorFromJSON[] }).colors || [];

  // Select one color per category for featured products
  const featuredProducts: Product[] = [];

  // LVT - categoryId '6'
  if (lvtColors.length > 0) {
    const lvtColor = lvtColors[0]; // First LVT color
    featuredProducts.push(colorToProduct(lvtColor, '6', '6')); // Gerflor brand ID is '6'
  }

  // Linoleum - categoryId '7'
  if (linoleumColors.length > 0) {
    const linoleumColor = linoleumColors[0]; // First Linoleum color
    featuredProducts.push(colorToProduct(linoleumColor, '7', '6')); // Assuming Gerflor or DLW
  }

  // Carpet/Tekstilne ploče - categoryId '4'
  if (carpetColors.length > 0) {
    const carpetColor = carpetColors[0]; // First Carpet color
    featuredProducts.push(colorToProduct(carpetColor, '4', '6')); // Gerflor brand ID is '6'
  }

  return (
    <div>
      {/* Hero Section - Apple Style */}
      <section className="relative bg-[#F5F5F7] pt-32 pb-16 overflow-hidden min-h-[90vh] flex flex-col items-center">
        <div className="container relative z-10 text-center mt-4 md:mt-10 mb-16">
          <h1 className="text-5xl md:text-[80px] font-semibold tracking-tighter text-[#1D1D1F] leading-[1.05] mb-6 animate-fadeScale">
            Pronađite savršen pod.<br />
            <span className="text-[#86868B]">Za vaš prostor.</span>
          </h1>
          <p className="text-xl md:text-[22px] text-[#86868B] max-w-2xl mx-auto font-normal tracking-tight mb-10 leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Vrhunski laminati, vinili, parketi i druge podne obloge od vodećih evropskih brendova. Dizajnirani da traju.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <Link href="/kategorije" className="btn bg-[#1D1D1F] text-white hover:bg-black text-[17px] px-8 py-4 rounded-full font-medium transition-transform active:scale-95 shadow-md hover:shadow-xl">
              Istražite asortiman
            </Link>
            <Link href="/kontakt" className="group btn bg-transparent text-[#0066CC] hover:text-[#004499] text-[17px] px-8 py-4 font-medium flex items-center gap-1">
              Kontaktirajte nas
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Hero Image - Floating Hardware Showcase Style */}
        <div className="relative w-full max-w-[1200px] mx-auto mt-auto px-4 md:px-8 flex-1 flex items-end justify-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="relative w-full h-[35vh] md:h-[50vh] rounded-t-3xl md:rounded-t-[3rem] overflow-hidden shadow-2xl border border-white/50 bg-white">
            {/* We use a subtle scale-in for the background to create a premium feel */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-out transform scale-100 hover:scale-105"
              style={{ backgroundImage: "url('/images/products/blues-1033-4v-white-room.jpg')" }}
            ></div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid Section */}
      <section className="py-24 bg-white">
        <div className="container max-w-[1200px]">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] mb-4">
              Istražite asortiman
            </h2>
            <p className="text-xl text-[#86868B] max-w-2xl mx-auto font-normal">
              Izaberite pod koji savršeno odgovara vašim potrebama.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(250px,_auto)]">
            {categories.map((category, index) => {
              // Create dynamic bento box variations specifically mapped for ~7 items
              let colSpan = 'md:col-span-1';
              let rowSpan = 'md:row-span-1';
              let imageHeight = 'h-[200px] md:h-[220px]';

              // Index 0: 2x2 Massive feature tile
              if (index === 0) {
                colSpan = 'md:col-span-2';
                rowSpan = 'md:row-span-2';
                imageHeight = 'h-[250px] md:h-[400px]';
              }
              // Index 1, 2: 1x1 standard cards
              else if (index === 1 || index === 2) {
                colSpan = 'md:col-span-1';
                rowSpan = 'md:row-span-1';
              }
              // Index 3: 2x1 wide feature
              else if (index === 3) {
                colSpan = 'md:col-span-2';
                rowSpan = 'md:row-span-1';
              }
              // Index 4, 5: 1x1 standard cards
              else if (index === 4 || index === 5) {
                colSpan = 'md:col-span-1';
                rowSpan = 'md:row-span-1';
              }
              // Index 6: 2x1 wide feature bottom
              else if (index >= 6) {
                colSpan = 'md:col-span-2';
                rowSpan = 'md:row-span-1';
              }

              return (
                <div key={category.id} className={`${colSpan} ${rowSpan} h-full`}>
                  <ScrollReveal delay={index * 50} className="h-full">
                    <CategoryCard
                      category={category}
                      className={`h-full rounded-3xl md:rounded-[2rem] bg-[#F5F5F7] border border-gray-100/50 flex flex-col`}
                      imageHeightClass={imageHeight}
                    />
                  </ScrollReveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Izdvojeni proizvodi
              </h2>
              <p className="text-xl text-gray-600">
                Najpopularniji izbor naših kupaca
              </p>
            </div>
            <Link href="/kategorije" className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-2 group mb-2">
              Pogledaj sve
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 100}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Section (formerly Why Choose Us) */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container relative z-10 max-w-[1000px]">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] tracking-tight mb-4">
              Dizajnirano za vas.
            </h2>
            <p className="text-xl md:text-2xl text-[#86868B] max-w-2xl mx-auto font-normal">
              Beskompromisan kvalitet i stručnost na svakom koraku.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal>
              <div className="text-center group p-10 rounded-[2.5rem] bg-[#F5F5F7] h-full transition-transform duration-500 hover:scale-[1.02]">
                <div className="inline-flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-[22px] font-semibold mb-3 text-[#1D1D1F] tracking-tight">Proveren kvalitet</h3>
                <p className="text-[16px] text-[#86868B] leading-relaxed">
                  Sarađujemo isključivo sa vrhunskim evropskim brendovima.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="text-center group p-10 rounded-[2.5rem] bg-[#F5F5F7] h-full transition-transform duration-500 hover:scale-[1.02]">
                <div className="inline-flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-[22px] font-semibold mb-3 text-[#1D1D1F] tracking-tight">Konkurentne cene</h3>
                <p className="text-[16px] text-[#86868B] leading-relaxed">
                  Obezbeđujemo najbolji odnos cene i vrednosti na tržištu.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center group p-10 rounded-[2.5rem] bg-[#F5F5F7] h-full transition-transform duration-500 hover:scale-[1.02]">
                <div className="inline-flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-[#1D1D1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-[22px] font-semibold mb-3 text-[#1D1D1F] tracking-tight">Stručna podrška</h3>
                <p className="text-[16px] text-[#86868B] leading-relaxed">
                  Naš tim je usko specijalizovan da vam predloži optimalna rešenja.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section - Ultra Minimal */}
      <section className="py-32 bg-[#F5F5F7] text-center border-t border-gray-200/50">
        <ScrollReveal>
          <div className="container max-w-4xl px-6">
            <h2 className="text-5xl md:text-7xl font-semibold mb-6 text-[#1D1D1F] tracking-tighter">
              Spremni za promenu?
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-[#86868B] font-normal leading-relaxed max-w-2xl mx-auto">
              Kontaktirajte nas danas i dozvolite našem timu da osmisli idealan pod za vaš prostor.
            </p>
            <Link href="/upiti" className="inline-flex items-center justify-center px-10 py-5 text-[17px] font-medium text-white bg-[#0071E3] rounded-full hover:bg-[#0077ED] active:scale-95 transition-all shadow-sm">
              Pošaljite upit
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
