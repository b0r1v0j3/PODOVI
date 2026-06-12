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
      <div className="min-h-screen bg-white py-12">
        <div className="container max-w-5xl">
          <div className="mb-10">
            <nav className="text-[13px] text-ink-500 mb-4">
              <Link href="/" className="hover:text-ink-900">Početna</Link>
              <span className="mx-2">/</span>
              <span className="text-ink-900">Elektroda za varenje</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-4">
              {source?.displayName || accessory.displayName}
            </h1>
            <p className="text-base text-ink-600">
              {description || source?.sourceNoteSr || 'Zvanicno preporucena elektroda za varenje za odgovarajuce podne obloge.'}
            </p>
          </div>

          {specs.length > 0 && (
            <div className="mb-12">
              <h2 className="eyebrow mb-4">
                Tehnički podaci
              </h2>
              <dl>
                {specs.map((spec: ProductSpec) => (
                  <div key={spec.key} className="flex justify-between border-b border-ink-200 py-[9px] text-[13px]">
                    <dt className="text-ink-500">{spec.label}</dt>
                    <dd className="text-ink-900 text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <h2 className="eyebrow mb-4">
              Izvor i primena
            </h2>
            <div className="prose max-w-none text-ink-600">
              {source?.sourceNoteSr && <p>{source.sourceNoteSr}</p>}
              {source?.officialUrl && (
                <p>
                  Zvanični izvor:
                  {' '}
                  <a
                    href={source.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-900 underline underline-offset-4 hover:opacity-60"
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
    <div className="min-h-screen bg-white py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <nav className="text-[13px] text-ink-500 mb-4">
            <Link href="/" className="hover:text-ink-900">Početna</Link>
            <span className="mx-2">/</span>
            <span>Linoleum</span>
            <span className="mx-2">/</span>
            <span className="text-ink-900">Elektroda za varenje {weldingRodRef}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-ink-900 mb-4">
            ELEKTRODA ZA VARENJE {weldingRodRef.toUpperCase()}
          </h1>
          <p className="text-base text-ink-600">
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
                className="group block"
              >
                <div className="aspect-square relative overflow-hidden bg-paper">
                  {imageUrl && (
                    <ProductImage
                      src={imageUrl}
                      alt={color.name || `${color.code}`}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  )}
                </div>
                <div className="pt-3">
                  {color.collection && (
                    <p className="eyebrow mb-1 truncate">
                      {color.collection_name || color.collection}
                    </p>
                  )}
                  <p className="text-[15px] text-ink-900 line-clamp-2">
                    {color.code} {color.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-16 border-t border-ink-200 pt-8">
          <h2 className="eyebrow mb-4">
            O elektrodi za varenje
          </h2>
          <div className="prose max-w-none text-ink-600">
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
