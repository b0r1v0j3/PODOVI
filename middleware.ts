import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  canAccessCrm,
  getCrmUnauthorizedResponse,
  getOpsBasicAuthConfig,
  requireOpsBasicAuth,
} from '@/lib/auth/internal-basic-auth';

/** Allegro: jedino validne boje (kao na Tarkett.rs). */
const ALLEGRO_VALID_COLORS = ['hrast-essence-2-strip', 'hrast-sand-ro-2-strip', 'hrast-sienna-ro-2-strip'];

// Sirovi kataloški JSON-ovi u public/data služe ISKLJUČIVO build-u (import u
// server komponentama) — sajt ih ne povlači preko HTTP-a. Jul 2026: scraper je
// skidao svih 14 kataloga (~30MB) na svakih ~70s → Vercel usage alarmi i curenje
// bandwidth-a. Jedini legitimni klijentski fetch-evi su indeksi dokumenata
// (components/ProductDocuments.tsx) — oni ostaju dostupni.
const PUBLIC_DATA_ALLOWLIST = new Set([
  '/data/documents_index.json',
  '/data/tarkett_documents_index.json',
]);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith('/data/') && !PUBLIC_DATA_ALLOWLIST.has(pathname)) {
    return new NextResponse('Not available', { status: 403 });
  }

  if (pathname === '/crm' || pathname.startsWith('/crm/')) {
    if (!canAccessCrm(request)) {
      return getCrmUnauthorizedResponse();
    }
  }

  if (pathname === '/api/ops' || pathname.startsWith('/api/ops/')) {
    const opsAuthConfigured = Boolean(getOpsBasicAuthConfig());
    if (opsAuthConfigured) {
      const authResult = requireOpsBasicAuth(request);
      if (!authResult.ok) {
        return authResult.response;
      }
    }
  }

  // /proizvodi/allegro?color=... – redirect nevažećeg ?color= na prvu validnu boju
  if (pathname === '/proizvodi/allegro') {
    const color = searchParams.get('color');
    if (color && !ALLEGRO_VALID_COLORS.includes(color)) {
      const url = request.nextUrl.clone();
      url.searchParams.set('color', ALLEGRO_VALID_COLORS[0]);
      return NextResponse.redirect(url, 307);
    }
  }

  return NextResponse.next();
}
