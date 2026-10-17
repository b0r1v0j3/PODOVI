import { getCommerceCustomer } from '@/lib/commerce/auth';
import { CommerceError } from '@/lib/commerce/errors';
import { commerceFailure, privateJson, validateId } from '@/lib/commerce/http';
import { getOwnOrder } from '@/lib/commerce/repository';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const customer = (await getCommerceCustomer(request, true))!;
    const order = await getOwnOrder(customer.id, validateId(params.id));
    if (!order) throw new CommerceError('Porudžbina nije pronađena.', 404);
    return privateJson({ order });
  } catch (error) { return commerceFailure(error); }
}
