'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PriceLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cenovnik/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Prijava nije uspela.');
    } catch {
      setError('Greška u komunikaciji. Pokušajte ponovo.');
    }
    setLoading(false);
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <p className="eyebrow mb-3">Podovi</p>
        <h1 className="mb-2 text-[28px]">Unos cena</h1>
        <p className="mb-8 text-[15px] text-ink-600">
          Stranica je zaštićena. Unesite pristupne podatke koje ste dobili mejlom.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label" htmlFor="cenovnik-username">
              Korisničko ime
            </label>
            <input
              id="cenovnik-username"
              className="input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="cenovnik-password">
              Lozinka
            </label>
            <input
              id="cenovnik-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Prijava…' : 'Uđi'}
          </button>
        </form>
      </div>
    </div>
  );
}
