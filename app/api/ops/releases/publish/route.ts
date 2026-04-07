import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth, resolveAuthenticatedOpsActorId } from '@/lib/auth/internal-basic-auth';
import { OpsValidationError, opsServiceContract } from '@/lib/ops';
import type { PublishReleaseInput } from '@/lib/ops';

export async function POST(request: NextRequest) {
  try {
    const auth = requireOpsBasicAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as PublishReleaseInput;
    const actor = resolveAuthenticatedOpsActorId(auth, payload.actorId);
    if (!actor.ok) {
      return actor.response;
    }

    const result = await opsServiceContract.publishRelease({
      ...payload,
      actorId: actor.actorId,
    });

    return NextResponse.json({
      ok: true,
      release: result.release,
      snapshot: result.snapshot,
      changeSets: result.changeSets,
    });
  } catch (error) {
    if (error instanceof OpsValidationError) {
      return NextResponse.json({ ok: false, error: error.message, issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Publish release akcija nije uspela.' },
      { status: 500 }
    );
  }
}
