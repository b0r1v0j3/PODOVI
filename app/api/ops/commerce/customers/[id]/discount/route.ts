import { NextRequest } from 'next/server';
import { requireCommerceStaff } from '@/lib/commerce/auth';
import { CommerceError } from '@/lib/commerce/errors';
import { commerceFailure, privateJson, readCommerceBody, validateId } from '@/lib/commerce/http';
import { customerDiscount } from '@/lib/commerce/pricing';
import { commerceDb, getDiscountOverride, updateDiscount } from '@/lib/commerce/repository';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

async function customerIdentity(id: string) {
  const { data, error } = await commerceDb().auth.admin.getUserById(validateId(id));
  if (error || !data?.user?.email || !data.user.email_confirmed_at || data.user.is_anonymous) {
    throw new CommerceError('Potvrđen korisnički nalog nije pronađen.', 404);
  }
  return { id, email: data.user.email as string };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireCommerceStaff(request);
    const customer = await customerIdentity(params.id);
    const discountOverride = await getDiscountOverride(customer.id);
    return privateJson({ customer: { ...customer, discountPercent: customerDiscount(discountOverride), discountOverride } });
  } catch (error) { return commerceFailure(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actorId = await requireCommerceStaff(request);
    const body = await readCommerceBody(request);
    if (body.discountPercent !== null && (typeof body.discountPercent !== 'number' || !Number.isInteger(body.discountPercent) || body.discountPercent < 0 || body.discountPercent > 100)) {
      throw new CommerceError('Rabat mora biti ceo broj od 0 do 100, ili prazan za osnovnih 10%.');
    }
    const customer = await customerIdentity(params.id);
    const discountOverride = body.discountPercent as number | null;
    await updateDiscount(customer.id, customer.email, discountOverride, actorId);
    return privateJson({ customer: { ...customer, discountPercent: customerDiscount(discountOverride), discountOverride } });
  } catch (error) { return commerceFailure(error); }
}
