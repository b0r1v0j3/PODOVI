'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Kritična greška
              </h1>
              
              <p className="text-gray-600 mb-8">
                Došlo je do kritične greške. Molimo osvežite stranicu ili pokušajte kasnije.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Pokušaj ponovo
                </button>
                
                <a
                  href="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Nazad na početnu
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
