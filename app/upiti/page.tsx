import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata = {
  title: 'Pošalji upit - Podovi',
  description: 'Pošaljite upit za proizvode koji vas interesuju. Naš tim će vam se javiti u najkraćem roku.',
};

export default function InquiryPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTItMnYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTQgMHYyaDJ2LTJoLTJ6bTIgMnYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTItMnYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="container py-12 md:py-16 relative z-10">
          <div className="mb-4">
            <Breadcrumbs items={[{ label: 'Upiti' }]} variant="dark" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Pošaljite upit
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Pregledajte naše proizvode i pošaljite upit za one koji vas interesuju
          </p>
        </div>
      </section>

      <div className="container py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-20 h-20 text-primary-600 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Kako poslati upit?
            </h2>

            <div className="text-left max-w-2xl mx-auto space-y-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mr-4">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Pronađite proizvod</h3>
                  <p className="text-gray-600">
                    Pregledajte naš katalog i pronađite proizvod koji vam odgovara
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mr-4">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Kliknite &quot;Pošalji upit&quot;</h3>
                  <p className="text-gray-600">
                    Na stranici proizvoda kliknite na dugme &quot;Pošalji upit&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mr-4">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Popunite formu</h3>
                  <p className="text-gray-600">
                    Unesite vaše podatke i dodatne informacije o upitu
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold mr-4">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Očekujte odgovor</h3>
                  <p className="text-gray-600">
                    Naš tim će vas kontaktirati u najkraćem mogućem roku
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-8">
              <p className="text-gray-600 mb-6">
                Spremni da počnete?
              </p>
              <Link href="/kategorije" className="btn-primary text-lg px-8 py-3">
                Pregledaj proizvode
              </Link>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-full mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Brz odgovor</h3>
              <p className="text-sm text-gray-600">
                Odgovaramo na sve upite u roku od 24h
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-full mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Besplatna konsultacija</h3>
              <p className="text-sm text-gray-600">
                Stručni savet bez obaveza
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-full mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Najbolje cene</h3>
              <p className="text-sm text-gray-600">
                Konkurentne cene garantovane
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
