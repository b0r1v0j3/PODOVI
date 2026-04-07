import { NextRequest, NextResponse } from 'next/server';
import { requireOpsBasicAuth } from '@/lib/auth/internal-basic-auth';
import { opsServiceContract } from '@/lib/ops';

interface RouteParams {
    params: {
        id: string;
    };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const auth = requireOpsBasicAuth(_request);
        if (!auth.ok) {
            return auth.response;
        }

        const details = await opsServiceContract.getDraftDetails(params.id);
        if (!details) {
            return NextResponse.json(
                {
                    ok: false,
                    error: `Change-set \`${params.id}\` nije pronađen.`,
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            changeSet: details.changeSet,
            items: details.items,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Nepoznata greška pri čitanju change-set-a.',
            },
            { status: 500 }
        );
    }
}
