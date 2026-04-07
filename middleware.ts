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

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
