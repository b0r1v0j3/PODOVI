'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-xl text-center">
        <p className="eyebrow mb-6">Greška</p>
        <h1 className="text-4xl md:text-5xl font-normal text-ink-900 mb-6">
          Ups! Nešto nije u redu
        </h1>
        <p className="text-ink-600 mb-10">
          Došlo je do greške prilikom učitavanja stranice.
          Molimo pokušajte ponovo ili se vratite na početnu stranicu.
        </p>

        {error.message && (
          <div className="mb-10 p-4 bg-red-50 border border-red-200 text-left">
            <p className="text-sm text-red-600 font-mono">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <button onClick={reset} className="btn-primary min-h-[44px]">
            Pokušaj ponovo
          </button>
          <a href="/" className="btn-link inline-flex items-center min-h-[44px]">
            Nazad na početnu
          </a>
        </div>
      </div>
    </div>
  );
}
