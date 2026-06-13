// Zaseban login-gate za stranicu /cenovnik (korisnik: podovi, lozinka: online).
// Namerno NE koristi lib/auth/internal-basic-auth.ts (CRM/OPS) — ovo su odvojeni
// kredencijali koji se šalju dobavljaču (Tatjani) mejlom, pa ih držimo izolovano.
//
// Mehanizam: HMAC-potpisan kolačić (bez dodatnih zavisnosti, koristi ugrađeni `crypto`).

import { createHmac, timingSafeEqual } from 'crypto';

export const CENOVNIK_COOKIE = 'cenovnik_session';
export const CENOVNIK_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dana

const TOKEN_VERSION = 'v1';

function getUsername(): string {
  return process.env.CENOVNIK_USER || 'podovi';
}

function getPassword(): string {
  return process.env.CENOVNIK_PASS || 'online';
}

function getSecret(): string {
  // Fallback dozvoljava rad i bez konfiguracije; preporuka je postaviti CENOVNIK_COOKIE_SECRET.
  return (
    process.env.CENOVNIK_COOKIE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'podovi-cenovnik-fallback-secret-2026'
  );
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function verifyCredentials(username: string, password: string): boolean {
  return username === getUsername() && password === getPassword();
}

/** Pravi novi potpisani token sesije. */
export function createSessionToken(): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${TOKEN_VERSION}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Validira token sesije (potpis + rok trajanja). */
export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [version, issuedAtRaw, signature] = parts;
  if (version !== TOKEN_VERSION) return false;

  const payload = `${version}.${issuedAtRaw}`;
  if (!safeEqualHex(signature, sign(payload))) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSeconds < 0 || ageSeconds > CENOVNIK_COOKIE_MAX_AGE) return false;

  return true;
}
