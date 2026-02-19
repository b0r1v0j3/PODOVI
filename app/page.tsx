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
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden h-[85vh] flex items-center">
        {/* Background Image with Slow Zoom & Parallax */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-linear transform scale-100 hover:scale-110 animate-subtle-zoom"
            style={{ backgroundImage: "url('/images/products/blues-1033-4v-white-room.jpg')" }}
          ></div>
          {/* Gradient Overlay for Text Readability - premium fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl animate-fadeInUp">

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-white drop-shadow-2xl">
              Pronađite savršen pod <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                za vaš prostor
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-gray-200 leading-relaxed max-w-2xl font-light border-l-4 border-primary-600 pl-6">
              Širok izbor laminata, vinila, parketa i drugih podnih obloga od vodećih evropskih brendova.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/kategorije" className="btn-primary text-lg px-10 py-5 rounded-xl font-bold shadow-2xl hover:shadow-primary-600/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
                Pregledaj proizvode
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link href="/kontakt" className="px-10 py-5 rounded-xl font-bold text-lg text-white border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/50 transition-all duration-300 flex items-center justify-center">
                Kontaktirajte nas
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-gray-50">
        <div className="container">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Vrste podova
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Izaberite pod koji najbolje odgovara vašim potrebama iz naše bogate ponude
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} delay={index * 100}>
                <CategoryCard category={category} />
              </ScrollReveal>
            ))}
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

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        {/* Subtle pattern background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>

        <div className="container relative z-10">
          <div className="text-center mb-20">
            <span className="text-primary-600 font-bold tracking-wider uppercase text-sm">Naše prednosti</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-6">
              Zašto izabrati nas?
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <ScrollReveal>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-xl shadow-gray-200 border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-10 h-10 text-primary-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Proveren kvalitet</h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Radimo samo sa renomiranim evropskim proizvođačima sa dugogodišnjom tradicijom.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-gray-200 border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-10 h-10 text-primary-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Konkurentne cene</h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Najbolji odnos cene i kvaliteta zahvaljujući direktnoj saradnji sa proizvođačima.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-xl shadow-gray-200 border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-10 h-10 text-primary-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Stručna podrška</h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Naš tim stručnjaka će vam pomoći da izaberete idealno rešenje za vaš prostor.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTItMnYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTIgMnYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTItMnYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-900/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-900/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <ScrollReveal>
          <div className="container text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight">
              Spremni da transformišete <br /> <span className="text-primary-400">vaš prostor?</span>
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              Pošaljite nam upit i naš stručni tim će vam se javiti u najkraćem roku sa personalizovanom ponudom.
            </p>
            <Link href="/upiti" className="group inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-500 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-primary-600/50">
              Pošalji upit
              <svg className="w-6 h-6 ml-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
