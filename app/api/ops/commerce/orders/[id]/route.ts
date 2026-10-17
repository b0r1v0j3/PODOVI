import { NextRequest } from 'next/server';
import { requireCommerceStaff } from '@/lib/commerce/auth';
import { CommerceError } from '@/lib/commerce/errors';
import { commerceFailure, privateJson, readCommerceBody, validateId } from '@/lib/commerce/http';
import { updateOrderStatus } from '@/lib/commerce/repository';
import { ORDER_STATUSES, OrderStatus } from '@/lib/commerce/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actorId = await requireCommerceStaff(request);
    const body = await readCommerceBody(request);
    if (!ORDER_STATUSES.includes(body.status as OrderStatus)) throw new CommerceError('Izaberite ispravan status.');
    return privateJson({ order: await updateOrderStatus(validateId(params.id), body.status as OrderStatus, actorId) });
  } catch (error) { return commerceFailure(error); }
}
