import { getCommerceCustomer } from '@/lib/commerce/auth';
import { commerceFailure, privateJson, readCommerceBody } from '@/lib/commerce/http';
import { listOrders } from '@/lib/commerce/repository';
import { submitOrder } from '@/lib/commerce/service';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const customer = (await getCommerceCustomer(request, true))!;
    return privateJson({ orders: await listOrders(customer.id) });
  } catch (error) { return commerceFailure(error); }
}

export async function POST(request: Request) {
  try {
    const customer = (await getCommerceCustomer(request, true))!;
    return privateJson(await submitOrder(await readCommerceBody(request), customer));
  } catch (error) { return commerceFailure(error); }
}
