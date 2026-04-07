import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth, resolveAuthenticatedOpsActorId } from '@/lib/auth/internal-basic-auth';
import { OpsValidationError, opsServiceContract } from '@/lib/ops';
import type { ReviewChangeSetInput } from '@/lib/ops';

interface RouteParams {
  params: { id: string };
}

interface ReviewPayload {
  actorId: string;
  decision: ReviewChangeSetInput['decision'];
  reviewComment: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireOpsBasicAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as ReviewPayload;
    const actor = resolveAuthenticatedOpsActorId(auth, payload.actorId);
    if (!actor.ok) {
      return actor.response;
    }

    const result = await opsServiceContract.reviewChangeSet({
      changeSetId: params.id,
      actorId: actor.actorId,
      decision: payload.decision,
      reviewComment: payload.reviewComment,
    });

    return NextResponse.json({ ok: true, changeSet: result });
  } catch (error) {
    if (error instanceof OpsValidationError) {
      return NextResponse.json({ ok: false, error: error.message, issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Review change-set akcija nije uspela.' },
      { status: 500 }
    );
  }
}
