import { NextResponse } from 'next/server';
import { CommerceError } from './errors';

export function privateJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization, Cookie' } });
}

export function commerceFailure(error: unknown) {
  if (error instanceof CommerceError) {
    return privateJson({ error: error.message, code: error.code, ...(error.lineKey ? { lineKey: error.lineKey } : {}),
      ...('quote' in error ? { quote: error.quote } : {}) }, error.status);
  }
  return privateJson({ error: 'Zahtev trenutno nije moguće obraditi. Pokušajte ponovo.', code: 'SERVICE_UNAVAILABLE' }, 503);
}

export async function readCommerceBody(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') || 0) > 32768) throw new CommerceError('Zahtev je prevelik.', 413);
  const text = await request.text();
  if (Buffer.byteLength(text) > 32768) throw new CommerceError('Zahtev je prevelik.', 413);
  try {
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error();
    return body;
  } catch { throw new CommerceError('Podaci nisu u ispravnom formatu.'); }
}

export function validateId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new CommerceError('Zapis nije pronađen.', 404);
  }
  return id;
}
