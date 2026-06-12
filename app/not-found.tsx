import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-white flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-xl">
        <p className="eyebrow mb-6">Greška 404</p>
        <h1 className="text-4xl md:text-5xl font-normal text-ink-900 mb-6">Stranica nije pronađena</h1>
        <p className="text-ink-600 mb-12">
          Izgleda da smo zagubili podnu oblogu koju tražite. <br />
          Vratite se na početnu ili pogledajte naš katalog.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <Link href="/" className="btn-link inline-flex items-center min-h-[44px]">
            Nazad na početnu
          </Link>
          <Link href="/" className="btn-primary inline-flex items-center min-h-[44px]">
            Pregledaj katalog
          </Link>
        </div>
      </div>
    </div>
  );
}
