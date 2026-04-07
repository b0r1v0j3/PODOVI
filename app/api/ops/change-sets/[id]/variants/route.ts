import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth, resolveAuthenticatedOpsActorId } from '@/lib/auth/internal-basic-auth';
import { OpsValidationError, opsServiceContract } from '@/lib/ops';
import type { OpsVariantMetadataPatch } from '@/lib/ops/types';

interface RouteParams {
  params: { id: string };
}

interface VariantPayload {
  actorId: string;
  variantSlug: string;
  variantPatch: OpsVariantMetadataPatch;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = requireOpsBasicAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as VariantPayload;
    const actor = resolveAuthenticatedOpsActorId(auth, payload.actorId);
    if (!actor.ok) {
      return actor.response;
    }

    const result = await opsServiceContract.upsertVariantDraft({
      changeSetId: params.id,
      actorId: actor.actorId,
      variantSlug: payload.variantSlug,
      variantPatch: payload.variantPatch,
    });

    return NextResponse.json({
      ok: true,
      changeSet: result.changeSet,
      changeItem: result.changeItem,
      issues: result.issues,
    });
  } catch (error) {
    if (error instanceof OpsValidationError) {
      return NextResponse.json({ ok: false, error: error.message, issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Variant draft upis nije uspeo.' },
      { status: 500 }
    );
  }
}
