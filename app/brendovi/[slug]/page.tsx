import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBrandBySlug } from '@/lib/repositories/brand-repository';
import { getProductsByBrand } from '@/lib/repositories/product-repository';
import ProductCard from '@/components/ProductCard';
import { FaExternalLinkAlt, FaGlobe } from 'react-icons/fa';

interface BrandPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.podovi.online';
  const brand = await getBrandBySlug(params.slug);

  if (!brand) {
    return {
      metadataBase: new URL(baseUrl),
      title: 'Brend nije pronađen',
    };
  }

  return {
    metadataBase: new URL(baseUrl),
    title: `${brand.name} Proizvodi | Podovi Doo`,
    description: `${brand.description} - Pogledajte sve ${brand.name} proizvode u našoj ponudi.`,
    openGraph: {
      title: `${brand.name} Proizvodi`,
      description: brand.description,
      type: 'website',
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const brand = await getBrandBySlug(params.slug);

  if (!brand) {
    notFound();
  }

  const products = await getProductsByBrand(brand.id);

  const isGerflor = brand.slug === 'gerflor';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-grow">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{brand.name}</h1>
              <p className="text-xl text-gray-700 mb-4">{brand.description}</p>
              <div className="flex flex-wrap gap-4 items-center text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">Zemlja porekla:</span>
                  {brand.countryOfOrigin}
                </span>
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <FaGlobe />
                    Zvanični sajt
                    <FaExternalLinkAlt className="text-sm" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gerflor Special Notice */}
        {isGerflor && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-l-4 border-primary-600 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center">
                <FaExternalLinkAlt />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Gerflor Kolekcije - Zvanični Zastupnik
                </h2>
                <p className="text-gray-700 mb-3">
                  Kao zvanični zastupnik Gerflor brenda za Srbiju, nudimo kompletnu paletu njihovih premium vinilnih podova. 
                  Kliknite na bilo koju kolekciju ispod da biste videli detalje, specifikacije i pošaljite upit za cene i dostupnost.
                </p>
                <a
                  href="https://www.gerflor-cee.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Pogledaj kompletnu kolekciju na Gerflor sajtu
                  <FaExternalLinkAlt className="text-sm" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isGerflor ? 'Dostupne Kolekcije' : 'Proizvodi'} ({products.length})
          </h2>
          
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">
                Trenutno nemamo proizvode ovog brenda u ponudi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <a
            href="/brendovi"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            ← Nazad na sve brendove
          </a>
        </div>
      </div>
    </div>
  );
}
