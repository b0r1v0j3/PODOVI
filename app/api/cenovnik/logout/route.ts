import { NextResponse } from 'next/server';
import { CENOVNIK_COOKIE } from '@/lib/cenovnik/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CENOVNIK_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
