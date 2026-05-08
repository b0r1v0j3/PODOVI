import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import linoleumColorsData from '@/public/data/linoleum_colors_complete.json';
import ProductImage from '@/components/ProductImage';
import {
  getWeldingAccessoryByRef,
  getWeldingAccessoryDescription,
  getWeldingAccessorySource,
  getWeldingAccessorySpecs,
} from '@/lib/product-page/welding-helpers';
import type { ProductSpec } from '@/types';

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
  const accessory = getWeldingAccessoryByRef(params.ref);
  if (accessory) {
    const source = getWeldingAccessorySource(params.ref);
    const description = getWeldingAccessoryDescription(params.ref) || source?.sourceNoteSr || '';
    return {
      title: `${source?.displayName || accessory.displayName} | podovi.online`,
      description: description || `Detalji o elektrodi za varenje ${source?.displayName || accessory.displayName}.`,
    };
  }

  const colors = getColorsByWeldingRod(params.ref);

  if (colors.length === 0) {
    return {
      title: 'Elektroda za varenje nije pronađena',
    };
  }

  const firstColor = colors[0];

  return {
    title: `Elektroda za varenje ${params.ref.toUpperCase()} - ${colors.length} boja | podovi.online`,
    description: `Elektroda za varenje ${params.ref.toUpperCase()} za ${colors.length} boja linoleuma. Pogledajte sve boje koje koriste ovu elektrodu.`,
  };
}

export default async function WeldingRodPage({ params }: Props) {
  const accessory = getWeldingAccessoryByRef(params.ref);
  if (accessory) {
    const specs = getWeldingAccessorySpecs(params.ref);
    const description = getWeldingAccessoryDescription(params.ref);
    const source = getWeldingAccessorySource(params.ref);

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container max-w-5xl">
          <div className="mb-8">
            <nav className="text-sm text-gray-600 mb-4">
              <Link href="/" className="hover:text-primary-600">Početna</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Elektroda za varenje</span>
            </nav>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {source?.displayName || accessory.displayName}
            </h1>
            <p className="text-lg text-gray-600">
              {description || source?.sourceNoteSr || 'Zvanicno preporucena elektroda za varenje za odgovarajuce podne obloge.'}
            </p>
          </div>

          {specs.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tehnički podaci
              </h2>
              <dl className="divide-y divide-gray-200">
                {specs.map((spec: ProductSpec) => (
                  <div key={spec.key} className="flex items-center justify-between py-3.5">
                    <dt className="text-sm font-medium text-gray-500">{spec.label}</dt>
                    <dd className="text-sm font-semibold text-gray-900 text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Izvor i primena
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              {source?.sourceNoteSr && <p>{source.sourceNoteSr}</p>}
              {source?.officialUrl && (
                <p>
                  Zvanični izvor:
                  {' '}
                  <a
                    href={source.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 underline underline-offset-4"
                  >
                    {source.officialUrl}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <span>Linoleum</span>
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
