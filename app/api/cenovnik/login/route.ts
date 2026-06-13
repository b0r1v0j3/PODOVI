import { NextRequest, NextResponse } from 'next/server';
import {
  verifyCredentials,
  createSessionToken,
  CENOVNIK_COOKIE,
  CENOVNIK_COOKIE_MAX_AGE,
} from '@/lib/cenovnik/auth';

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev' }, { status: 400 });
  }

  const username = String(body?.username || '').trim();
  const password = String(body?.password || '');

  if (!verifyCredentials(username, password)) {
    // Blago usporavanje na neuspeli pokušaj (otežava naivni brute-force).
    // Gejt je namerno jednostavan; prava zaštita je „ništa ne ide u produkciju bez odobrenja".
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json(
      { error: 'Pogrešno korisničko ime ili lozinka' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CENOVNIK_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CENOVNIK_COOKIE_MAX_AGE,
  });
  return response;
}
