import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth, resolveAuthenticatedOpsActorId } from '@/lib/auth/internal-basic-auth';
import { OpsValidationError, opsServiceContract } from '@/lib/ops';
import type { CreateMetadataDraftInput } from '@/lib/ops';

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

export async function POST(request: NextRequest) {
    try {
        const auth = requireOpsBasicAuth(request);
        if (!auth.ok) {
            return auth.response;
        }

        const payload = (await request.json()) as CreateMetadataDraftInput;
        const actor = resolveAuthenticatedOpsActorId(auth, payload.actorId);
        if (!actor.ok) {
            return actor.response;
        }

        const result = await opsServiceContract.createMetadataDraft({
            ...payload,
            actorId: actor.actorId,
        });

        return NextResponse.json(
            {
                ok: true,
                changeSet: result.changeSet,
                changeItem: result.changeItem,
                issues: result.issues,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof OpsValidationError) {
            return toBadRequest(error.message, error.issues);
        }

        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Nepoznata greška pri kreiranju change-set-a.',
            },
            { status: 500 }
        );
    }
}
