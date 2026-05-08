import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-lg bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Stranica nije pronađena</h1>
        <p className="text-gray-500 mb-8 text-lg">
          Izgleda da smo zagubili podnu oblogu koju tražite. <br />
          Vratite se na početnu ili pogledajte naš katalog.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="px-8 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
            Nazad na početnu
          </Link>
          <Link href="/" className="px-8 py-3 rounded-xl font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-primary-600/30 transition-all">
            Pregledaj katalog
          </Link>
        </div>
      </div>
    </div>
  );
}
