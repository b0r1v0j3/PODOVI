import { NextRequest } from 'next/server';
import { requireOpsBasicAuth } from '@/lib/auth/internal-basic-auth';
import { opsRepository } from '@/lib/ops/repository';
import { CommerceError } from './errors';
import { commerceDb, getDiscountOverride } from './repository';
import { customerDiscount } from './pricing';
import type { CommerceCustomer } from './types';

export async function getCommerceCustomer(request: Request, required = false): Promise<CommerceCustomer | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization && !required) return null;
  const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token || token.length > 8192) throw new CommerceError('Prijavite se da biste nastavili.', 401, 'AUTH_REQUIRED');
  const { data, error } = await commerceDb().auth.getUser(token);
  // Only a 4xx means Supabase rejected the token; network errors and 5xx must not sign the customer out.
  const status = Number(error?.status ?? 0);
  if (error && !(status >= 400 && status < 500 && status !== 429)) {
    throw new CommerceError('Provera prijave trenutno nije dostupna. Pokušajte ponovo.', 503, 'SERVICE_UNAVAILABLE');
  }
  const user = data?.user;
  if (error || !user) throw new CommerceError('Prijava je istekla. Prijavite se ponovo.', 401, 'AUTH_REQUIRED');
  if (!user.email || !user.email_confirmed_at || user.is_anonymous) {
    throw new CommerceError('Potvrdite svoju mejl adresu da biste nastavili.', 403, 'EMAIL_NOT_VERIFIED');
  }
  return { id: user.id, email: user.email, discountPercent: customerDiscount(await getDiscountOverride(user.id)) };
}

export async function requireCommerceStaff(request: NextRequest): Promise<string> {
  const auth = requireOpsBasicAuth(request);
  if (!auth.ok) throw new CommerceError('Potreban je interni Podovi pristup.', auth.response.status, 'STAFF_AUTH_REQUIRED');
  const origin = request.headers.get('origin');
  if (request.method !== 'GET' && origin && origin !== request.nextUrl.origin) {
    throw new CommerceError('Zahtev nije dozvoljen.', 403);
  }
  if (await opsRepository.resolveActorRole(auth.actorId) !== 'publisher') {
    throw new CommerceError('Nalog nema ovlašćenje za porudžbine i rabate.', 403, 'STAFF_ROLE_REQUIRED');
  }
  return auth.actorId;
}
