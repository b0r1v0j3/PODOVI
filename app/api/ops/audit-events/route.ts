import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth } from '@/lib/auth/internal-basic-auth';
import { opsServiceContract } from '@/lib/ops';

export async function GET(request: NextRequest) {
  try {
    const auth = requireOpsBasicAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    const events = await opsServiceContract.getAuditEvents({
      entityType: searchParams.get('entity_type') || undefined,
      entityId: searchParams.get('entity_id') || undefined,
      collectionSlug: searchParams.get('collection_slug') || undefined,
      releaseId: searchParams.get('release_id') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });

    return NextResponse.json({ ok: true, events });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Čitanje audit događaja nije uspelo.' },
      { status: 500 }
    );
  }
}
