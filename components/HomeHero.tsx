import Image from 'next/image';
import Link from 'next/link';

// Full-bleed hero — galerija estetika: slika u prvom planu, monohrom tekst preko.
// Hero slika je self-hostovana na Supabase (iD Inspiration Loose Lay lifestyle); lako zamenljiva.
const HERO_IMAGE =
  'https://nnjmrfwepylrheykalik.supabase.co/storage/v1/object/public/product-images/products/tarkett-migrated/in-hp-id-inspiration-loose-lay-24640024-24644037.jpg';

export default function HomeHero() {
  return (
    <section className="relative isolate flex min-h-[72vh] items-end overflow-hidden bg-ink-900 md:min-h-[84vh]">
      <Image
        src={HERO_IMAGE}
        alt="Enterijer sa podnom oblogom iz ponude Podovi"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Ink gradient za čitljivost teksta — monohrom, bez akcentne boje */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/30 to-ink-900/5" />

      <div className="container relative pb-14 pt-28 md:pb-24 md:pt-40">
        <div className="max-w-3xl">
          <p className="mb-5 text-[11px] uppercase tracking-label text-white/70">Galerija podova</p>
          <h1 className="text-4xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
            Pod čini prostor
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/75 md:text-lg md:leading-8">
            Vinil, LVT, parket, linoleum, tepih, sport i protivklizni podovi — hiljade dekora
            vodećih evropskih proizvođača, na jednom mestu.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/kategorije/lvt" className="btn-inverse inline-flex items-center justify-center">
              Istraži kolekcije
            </Link>
            <Link
              href="/upiti"
              className="inline-flex items-center justify-center border border-white/40 px-6 py-3 text-[13px] uppercase tracking-label text-white transition-colors hover:bg-white hover:text-ink-900"
            >
              Pošalji upit
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
