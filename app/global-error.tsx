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
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
          <div className="max-w-xl w-full text-center">
            <p className="text-[11px] uppercase tracking-label text-ink-500 mb-6">Greška</p>
            <h1 className="text-4xl font-normal text-ink-900 mb-6">
              Kritična greška
            </h1>
            <p className="text-ink-600 mb-10">
              Došlo je do kritične greške. Molimo osvežite stranicu ili pokušajte kasnije.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <button
                onClick={reset}
                className="bg-ink-900 text-white text-[13px] font-medium px-[26px] py-3 hover:bg-ink-700 transition-colors min-h-[44px]"
              >
                Pokušaj ponovo
              </button>
              <a
                href="/"
                className="text-[13px] text-ink-900 border-b border-ink-900 pb-0.5 hover:opacity-60 transition-opacity"
              >
                Nazad na početnu
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
