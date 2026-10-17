import { NextRequest } from 'next/server';
import { requireCommerceStaff } from '@/lib/commerce/auth';
import { commerceFailure, privateJson } from '@/lib/commerce/http';
import { listOrders } from '@/lib/commerce/repository';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    await requireCommerceStaff(request);
    return privateJson({ orders: await listOrders() });
  } catch (error) { return commerceFailure(error); }
}
