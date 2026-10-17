import { getCommerceCustomer } from '@/lib/commerce/auth';
import { commerceFailure, privateJson } from '@/lib/commerce/http';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try { return privateJson({ customer: await getCommerceCustomer(request) }); }
  catch (error) { return commerceFailure(error); }
}
