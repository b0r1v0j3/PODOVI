import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth, resolveAuthenticatedOpsActorId } from '@/lib/auth/internal-basic-auth';
import { OpsValidationError, opsServiceContract } from '@/lib/ops';
import type { RollbackReleaseInput } from '@/lib/ops';

interface RouteParams {
  params: { id: string };
}

interface RollbackPayload {
  actorId: RollbackReleaseInput['actorId'];
  reason: RollbackReleaseInput['reason'];
  incidentReference: RollbackReleaseInput['incidentReference'];
  correlationId?: RollbackReleaseInput['correlationId'];
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireOpsBasicAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as RollbackPayload;
    const actor = resolveAuthenticatedOpsActorId(auth, payload.actorId);
    if (!actor.ok) {
      return actor.response;
    }

    const result = await opsServiceContract.rollbackRelease({
      releaseId: params.id,
      actorId: actor.actorId,
      reason: payload.reason,
      incidentReference: payload.incidentReference,
      correlationId: payload.correlationId,
    });

    return NextResponse.json({
      ok: true,
      release: result.release,
      snapshot: result.snapshot,
      targetRelease: result.targetRelease,
    });
  } catch (error) {
    if (error instanceof OpsValidationError) {
      return NextResponse.json({ ok: false, error: error.message, issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Rollback release akcija nije uspela.' },
      { status: 500 }
    );
  }
}
