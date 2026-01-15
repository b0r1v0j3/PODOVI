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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="container max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ups! Nešto nije u redu
          </h1>
          
          <p className="text-gray-600 mb-8">
            Došlo je do greške prilikom učitavanja stranice. 
            Molimo pokušajte ponovo ili se vratite na početnu stranicu.
          </p>

          {error.message && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-mono">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="btn-primary focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Pokušaj ponovo
            </button>
            
            <a
              href="/"
              className="btn-outline focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Nazad na početnu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
