import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import ProductImage from '@/components/ProductImage';

interface Props {
  params: { ref: string };
}

const linoleumColors = (linoleumColorsData as { colors?: any[] }).colors || [];

function getColorsByWeldingRod(weldingRodRef: string) {
  return linoleumColors.filter(color => 
    color.welding_rod && color.welding_rod.toLowerCase() === weldingRodRef.toLowerCase()
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const colors = getColorsByWeldingRod(params.ref);
  
  if (colors.length === 0) {
    return {
      title: 'Elektroda za varenje nije pronađena',
    };
  }
  
  const firstColor = colors[0];
  
  return {
    title: `Elektroda za varenje ${params.ref.toUpperCase()} - ${colors.length} boja | Podovi.online`,
    description: `Elektroda za varenje ${params.ref.toUpperCase()} za ${colors.length} boja linoleuma. Pogledajte sve boje koje koriste ovu elektrodu.`,
  };
}

export default async function WeldingRodPage({ params }: Props) {
  const colors = getColorsByWeldingRod(params.ref);
  
  if (colors.length === 0) {
    notFound();
  }
  
  const firstColor = colors[0];
  const weldingRodRef = firstColor.welding_rod || params.ref;
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-primary-600">Početna</Link>
            <span className="mx-2">/</span>
            <Link href="/kategorije/linoleum" className="hover:text-primary-600">Linoleum</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Elektroda za varenje {weldingRodRef}</span>
          </nav>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ELEKTRODA ZA VARENJE {weldingRodRef.toUpperCase()}
          </h1>
          <p className="text-lg text-gray-600">
            Prikazano {colors.length} boja koje koriste ovu elektrodu za varenje
          </p>
        </div>
        
        {/* Colors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {colors.map((color) => {
            const slug = color.slug || `${color.code}-${color.name}`.toLowerCase().replace(/\s+/g, '-');
            const imageUrl = color.image_url || color.texture_url || '/images/placeholder.svg';
            
            return (
              <Link
                key={color.slug || color.code}
                href={`/proizvodi/linoleum-${slug}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-square relative bg-gray-100">
                  {imageUrl && (
                    <ProductImage
                      src={imageUrl}
                      alt={color.name || `${color.code}`}
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {color.code}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {color.name}
                  </p>
                  {color.collection && (
                    <p className="text-xs text-gray-500 mt-2">
                      {color.collection_name || color.collection}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* Info Box */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            O elektrodi za varenje
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Elektroda za varenje {weldingRodRef} je specijalizovana elektroda dizajnirana za linoleum podne obloge.
              Koristite ovu elektrodu za profesionalno varenje spojeva kod {colors.length} različitih boja.
            </p>
            <ul>
              <li>Referenca: <strong>{weldingRodRef}</strong></li>
              <li>Broj boja: <strong>{colors.length}</strong></li>
              <li>Tip: Linoleum welding rod 4mm</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
