import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth, resolveAuthenticatedOpsActorId } from '@/lib/auth/internal-basic-auth';
import { OpsValidationError, opsServiceContract } from '@/lib/ops';
import type { OpsDocumentDraftInput } from '@/lib/ops';

interface RouteParams {
    params: {
        id: string;
    };
}

interface UpsertDocumentPayload {
    actorId: string;
    document: OpsDocumentDraftInput;
}

function toBadRequest(message: string, issues: unknown) {
    return NextResponse.json(
        {
            ok: false,
            error: message,
            issues,
        },
        { status: 400 }
    );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = requireOpsBasicAuth(request);
        if (!auth.ok) {
            return auth.response;
        }

        const payload = (await request.json()) as UpsertDocumentPayload;
        const actor = resolveAuthenticatedOpsActorId(auth, payload.actorId);
        if (!actor.ok) {
            return actor.response;
        }

        const result = await opsServiceContract.upsertDocumentDraft({
            changeSetId: params.id,
            actorId: actor.actorId,
            document: payload.document,
        });

        return NextResponse.json({
            ok: true,
            changeSet: result.changeSet,
            changeItem: result.changeItem,
            issues: result.issues,
        });
    } catch (error) {
        if (error instanceof OpsValidationError) {
            return toBadRequest(error.message, error.issues);
        }

        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Nepoznata greška pri upisu document draft-a.',
            },
            { status: 500 }
        );
    }
}
