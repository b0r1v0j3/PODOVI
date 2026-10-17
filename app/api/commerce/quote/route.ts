import { getCommerceCustomer } from '@/lib/commerce/auth';
import { commerceFailure, privateJson, readCommerceBody } from '@/lib/commerce/http';
import { quoteCart } from '@/lib/commerce/service';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    const customer = await getCommerceCustomer(request);
    const body = await readCommerceBody(request);
    return privateJson(await quoteCart(body.items, customer));
  } catch (error) { return commerceFailure(error); }
}
