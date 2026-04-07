import { getServerSupabase, hasSupabaseServiceRoleConfig } from '@/lib/supabase/client';
import type {
    OpsActorRole,
    OpsAuditAction,
    OpsAuditEventRecord,
    OpsChangeItemRecord,
    OpsChangeSetRecord,
    OpsChangeSetStatus,
    OpsCollectionDocument,
    OpsCollectionRecord,
    OpsDocumentRecord,
    OpsInvariantIssue,
    OpsReleaseKind,
    OpsReleaseRecord,
    OpsReleaseStatus,
    OpsReviewDecision,
    OpsReviewDecisionRecord,
    OpsRiskLevel,
    OpsSnapshotRecord,
    OpsVariantRecord,
} from './types';

interface CreateChangeSetParams {
    collectionSlug: string;
    collectionName: string;
    categoryId: string;
    brandId: string;
    status?: OpsChangeSetStatus;
    riskLevel: OpsRiskLevel;
    rationale: string;
    actorId: string;
}

interface UpdateChangeSetParams {
    status?: OpsChangeSetStatus;
    riskLevel?: OpsRiskLevel;
    rationale?: string;
    submittedAt?: string | null;
    approvedAt?: string | null;
    publishedAt?: string | null;
    updatedBy: string;
}

interface UpsertChangeItemParams {
    changeSetId: string;
    itemType: OpsChangeItemRecord['itemType'];
    targetKey: string;
    beforePayload: unknown;
    afterPayload: unknown;
    validationErrors: OpsInvariantIssue[];
    actorId: string;
}

interface InsertReviewDecisionParams {
    changeSetId: string;
    decision: OpsReviewDecision;
    reviewerId: string;
    reviewComment: string;
    riskLevel: OpsRiskLevel;
}

interface CreateReleaseParams {
    status?: OpsReleaseStatus;
    kind: OpsReleaseKind;
    requestedBy: string;
    reason?: string;
    incidentReference?: string | null;
    rolledBackFromReleaseId?: string | null;
    correlationId?: string | null;
}

interface UpdateReleaseParams {
    status?: OpsReleaseStatus;
    appliedAt?: string | null;
    failedAt?: string | null;
    finishedAt?: string | null;
    reason?: string;
    incidentReference?: string | null;
}

interface CreateSnapshotParams {
    releaseId: string;
    snapshotHash: string;
    snapshotPayload: Record<string, unknown>;
    createdBy: string;
}

interface UpsertCollectionStateParams {
    collectionSlug: string;
    collectionName: string;
    categoryId: string;
    brandId: string;
    metadata: Record<string, unknown>;
    sourceType?: string;
    sourceRef?: string | null;
    sourceFetchedAt?: string | null;
    state?: 'draft' | 'published' | 'archived';
    incrementPublishedVersion?: boolean;
    incrementDraftVersion?: boolean;
}

interface UpsertVariantStateParams {
    collectionSlug: string;
    variantSlug: string;
    variantCode: string;
    name: string;
    sortOrder?: number;
    isActive?: boolean;
    payload: Record<string, unknown>;
}

interface UpsertDocumentStateParams {
    collectionSlug: string;
    variantSlug?: string;
    title: string;
    type?: string | null;
    locale?: string;
    url: string;
    checksum?: string | null;
    payload?: Record<string, unknown>;
    isActive?: boolean;
}

interface InsertAuditEventParams {
    entityType: string;
    entityId: string;
    action: OpsAuditAction;
    actorType: 'agent' | 'user' | 'system';
    actorId: string;
    context?: Record<string, unknown>;
    payloadSummary?: Record<string, unknown>;
    payloadHash: string;
    correlationId?: string | null;
}

interface ListAuditEventsFilters {
    entityType?: string;
    entityId?: string;
    collectionSlug?: string;
    releaseId?: string;
    limit?: number;
}

const ROLE_PRECEDENCE: OpsActorRole[] = ['publisher', 'reviewer', 'editor'];

function mapChangeSetRow(row: any): OpsChangeSetRecord {
    return {
        id: row.id,
        collectionSlug: row.collection_slug,
        collectionName: row.collection_name,
        categoryId: row.category_id,
        brandId: row.brand_id,
        status: row.status,
        riskLevel: row.risk_level,
        rationale: row.rationale || '',
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        submittedAt: row.submitted_at,
        approvedAt: row.approved_at,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapChangeItemRow(row: any): OpsChangeItemRecord {
    return {
        id: row.id,
        changeSetId: row.change_set_id,
        itemType: row.item_type,
        targetKey: row.target_key,
        beforePayload: row.before_payload,
        afterPayload: row.after_payload,
        validationErrors: Array.isArray(row.validation_errors) ? row.validation_errors : [],
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapReviewDecisionRow(row: any): OpsReviewDecisionRecord {
    return {
        id: row.id,
        changeSetId: row.change_set_id,
        decision: row.decision,
        reviewerId: row.reviewer_id,
        reviewComment: row.review_comment || '',
        riskLevel: row.risk_level,
        createdAt: row.created_at,
    };
}

function mapCollectionRow(row: any): OpsCollectionRecord {
    return {
        id: row.id,
        collectionSlug: row.collection_slug,
        collectionName: row.collection_name,
        categoryId: row.category_id,
        brandId: row.brand_id,
        state: row.state,
        sourceType: row.source_type,
        sourceRef: row.source_ref,
        sourceFetchedAt: row.source_fetched_at,
        publishedVersion: Number(row.published_version || 0),
        draftVersion: Number(row.draft_version || 0),
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapVariantRow(row: any): OpsVariantRecord {
    return {
        id: row.id,
        collectionSlug: row.collection_slug,
        variantSlug: row.variant_slug,
        variantCode: row.variant_code,
        name: row.name,
        sortOrder: Number(row.sort_order || 0),
        isActive: Boolean(row.is_active),
        payload: row.payload || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapDocumentRow(row: any): OpsDocumentRecord {
    return {
        id: row.id,
        collectionSlug: row.collection_slug,
        variantSlug: row.variant_slug || '',
        scope: row.scope,
        documentKey: row.document_key,
        title: row.title,
        type: row.type,
        locale: row.locale,
        url: row.url,
        checksum: row.checksum,
        payload: row.payload || {},
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapReleaseRow(row: any): OpsReleaseRecord {
    return {
        id: row.id,
        status: row.status,
        kind: row.kind,
        requestedBy: row.requested_by,
        requestedAt: row.requested_at,
        appliedAt: row.applied_at,
        failedAt: row.failed_at,
        finishedAt: row.finished_at,
        rolledBackFromReleaseId: row.rolled_back_from_release_id,
        reason: row.reason || '',
        incidentReference: row.incident_reference,
        correlationId: row.correlation_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapSnapshotRow(row: any): OpsSnapshotRecord {
    return {
        id: row.id,
        releaseId: row.release_id,
        snapshotHash: row.snapshot_hash,
        snapshotPayload: row.snapshot_payload || {},
        createdBy: row.created_by,
        createdAt: row.created_at,
    };
}

function mapAuditEventRow(row: any): OpsAuditEventRecord {
    return {
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        actorType: row.actor_type,
        actorId: row.actor_id,
        context: row.context || {},
        payloadSummary: row.payload_summary || {},
        payloadHash: row.payload_hash,
        correlationId: row.correlation_id ?? null,
        occurredAt: row.occurred_at,
        createdAt: row.created_at,
    };
}

function assertOpsDbReady() {
    if (!hasSupabaseServiceRoleConfig()) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY je obavezan za ops-console service contract.');
    }
}

function ensureSuccess(error: any, fallback: string): void {
    if (error) {
        throw new Error(`${fallback}: ${error.message || 'unknown error'}`);
    }
}

export class OpsRepository {
    async createChangeSet(params: CreateChangeSetParams): Promise<OpsChangeSetRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_change_sets')
            .insert({
                collection_slug: params.collectionSlug,
                collection_name: params.collectionName,
                category_id: params.categoryId,
                brand_id: params.brandId,
                status: params.status ?? 'draft',
                risk_level: params.riskLevel,
                rationale: params.rationale,
                created_by: params.actorId,
                updated_by: params.actorId,
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Kreiranje ops change-set-a nije uspelo: ${error?.message || 'unknown error'}`);
        }

        return mapChangeSetRow(data);
    }

    async updateChangeSet(changeSetId: string, params: UpdateChangeSetParams): Promise<OpsChangeSetRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const patch: Record<string, unknown> = {
            updated_by: params.updatedBy,
            updated_at: new Date().toISOString(),
        };

        if (params.status) patch.status = params.status;
        if (params.riskLevel) patch.risk_level = params.riskLevel;
        if (typeof params.rationale === 'string') patch.rationale = params.rationale;
        if (params.submittedAt !== undefined) patch.submitted_at = params.submittedAt;
        if (params.approvedAt !== undefined) patch.approved_at = params.approvedAt;
        if (params.publishedAt !== undefined) patch.published_at = params.publishedAt;

        const { data, error } = await supabase
            .from('ops_change_sets')
            .update(patch)
            .eq('id', changeSetId)
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Ažuriranje ops change-set-a nije uspelo: ${error?.message || 'unknown error'}`);
        }

        return mapChangeSetRow(data);
    }

    async getChangeSetById(changeSetId: string): Promise<OpsChangeSetRecord | null> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_change_sets')
            .select('*')
            .eq('id', changeSetId)
            .maybeSingle();

        ensureSuccess(error, 'Čitanje ops change-set-a nije uspelo');
        return data ? mapChangeSetRow(data) : null;
    }

    async listChangeSetsByIds(changeSetIds: string[]): Promise<OpsChangeSetRecord[]> {
        if (changeSetIds.length === 0) return [];
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_change_sets')
            .select('*')
            .in('id', changeSetIds);

        ensureSuccess(error, 'Čitanje ops change-set liste nije uspelo');
        return ((data as any[]) || []).map(mapChangeSetRow);
    }

    async listChangeItems(changeSetId: string): Promise<OpsChangeItemRecord[]> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_change_items')
            .select('*')
            .eq('change_set_id', changeSetId)
            .order('created_at', { ascending: true });

        ensureSuccess(error, 'Čitanje ops change-item zapisa nije uspelo');
        return ((data as any[]) || []).map(mapChangeItemRow);
    }

    async upsertChangeItem(params: UpsertChangeItemParams): Promise<OpsChangeItemRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_change_items')
            .upsert(
                {
                    change_set_id: params.changeSetId,
                    item_type: params.itemType,
                    target_key: params.targetKey,
                    before_payload: params.beforePayload,
                    after_payload: params.afterPayload,
                    validation_errors: params.validationErrors,
                    created_by: params.actorId,
                    updated_by: params.actorId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'change_set_id,item_type,target_key' }
            )
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Upsert ops change-item zapisa nije uspeo: ${error?.message || 'unknown error'}`);
        }

        return mapChangeItemRow(data);
    }

    async listReviewDecisions(changeSetId: string): Promise<OpsReviewDecisionRecord[]> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_review_decisions')
            .select('*')
            .eq('change_set_id', changeSetId)
            .order('created_at', { ascending: true });

        ensureSuccess(error, 'Čitanje review odluka nije uspelo');
        return ((data as any[]) || []).map(mapReviewDecisionRow);
    }

    async insertReviewDecision(params: InsertReviewDecisionParams): Promise<OpsReviewDecisionRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_review_decisions')
            .insert({
                change_set_id: params.changeSetId,
                decision: params.decision,
                reviewer_id: params.reviewerId,
                review_comment: params.reviewComment,
                risk_level: params.riskLevel,
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Upis review odluke nije uspeo: ${error?.message || 'unknown error'}`);
        }

        return mapReviewDecisionRow(data);
    }

    async resolveActorRole(actorId: string): Promise<OpsActorRole | null> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_role_bindings')
            .select('role')
            .eq('actor_id', actorId)
            .eq('is_active', true);

        ensureSuccess(error, 'Čitanje role binding-a nije uspelo');

        const roles = new Set(((data as any[]) || []).map((row) => row.role));
        for (const role of ROLE_PRECEDENCE) {
            if (roles.has(role)) return role;
        }

        return null;
    }

    async upsertCollectionState(params: UpsertCollectionStateParams): Promise<OpsCollectionRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();

        const existing = await this.getCollectionState(params.collectionSlug);
        const nextPublishedVersion = existing
            ? existing.publishedVersion + (params.incrementPublishedVersion ? 1 : 0)
            : params.incrementPublishedVersion
              ? 1
              : 0;
        const nextDraftVersion = existing
            ? existing.draftVersion + (params.incrementDraftVersion ? 1 : 0)
            : params.incrementDraftVersion
              ? 1
              : 0;

        const { data, error } = await supabase
            .from('ops_collections')
            .upsert(
                {
                    collection_slug: params.collectionSlug,
                    collection_name: params.collectionName,
                    category_id: params.categoryId,
                    brand_id: params.brandId,
                    state: params.state || 'published',
                    source_type: params.sourceType || 'resolver',
                    source_ref: params.sourceRef ?? null,
                    source_fetched_at: params.sourceFetchedAt ?? null,
                    published_version: nextPublishedVersion,
                    draft_version: nextDraftVersion,
                    metadata: params.metadata,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'collection_slug' }
            )
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Upsert ops_collections nije uspeo: ${error?.message || 'unknown error'}`);
        }

        return mapCollectionRow(data);
    }

    async getCollectionState(collectionSlug: string): Promise<OpsCollectionRecord | null> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_collections')
            .select('*')
            .eq('collection_slug', collectionSlug)
            .maybeSingle();

        ensureSuccess(error, 'Čitanje ops_collections zapisa nije uspelo');
        return data ? mapCollectionRow(data) : null;
    }

    async upsertVariantState(params: UpsertVariantStateParams): Promise<OpsVariantRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_variants')
            .upsert(
                {
                    collection_slug: params.collectionSlug,
                    variant_slug: params.variantSlug,
                    variant_code: params.variantCode,
                    name: params.name,
                    sort_order: params.sortOrder || 0,
                    is_active: params.isActive ?? true,
                    payload: params.payload,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'collection_slug,variant_slug' }
            )
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Upsert ops_variants nije uspeo: ${error?.message || 'unknown error'}`);
        }

        return mapVariantRow(data);
    }

    async listCollectionVariants(collectionSlug: string): Promise<OpsVariantRecord[]> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_variants')
            .select('*')
            .eq('collection_slug', collectionSlug)
            .order('sort_order', { ascending: true });

        ensureSuccess(error, 'Čitanje ops_variants nije uspelo');
        return ((data as any[]) || []).map(mapVariantRow);
    }

    async replaceCollectionVariants(collectionSlug: string, variants: OpsVariantRecord[]): Promise<void> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { error: deleteError } = await supabase.from('ops_variants').delete().eq('collection_slug', collectionSlug);
        ensureSuccess(deleteError, 'Brisanje starih ops_variants redova nije uspelo');

        if (variants.length === 0) return;

        const rows = variants.map((variant) => ({
            collection_slug: collectionSlug,
            variant_slug: variant.variantSlug,
            variant_code: variant.variantCode,
            name: variant.name,
            sort_order: variant.sortOrder,
            is_active: variant.isActive,
            payload: variant.payload,
        }));

        const { error } = await supabase.from('ops_variants').insert(rows);
        ensureSuccess(error, 'Upis rollback ops_variants redova nije uspeo');
    }

    async upsertDocumentState(params: UpsertDocumentStateParams): Promise<OpsDocumentRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const variantSlug = String(params.variantSlug || '').trim();
        const scope = variantSlug ? 'variant' : 'collection';
        const documentKey = String(params.title || '').trim().toLowerCase();

        const { data, error } = await supabase
            .from('ops_documents')
            .upsert(
                {
                    collection_slug: params.collectionSlug,
                    variant_slug: variantSlug,
                    scope,
                    document_key: documentKey,
                    title: params.title,
                    type: params.type || null,
                    locale: params.locale || 'sr-RS',
                    url: params.url,
                    checksum: params.checksum || null,
                    payload: params.payload || {},
                    is_active: params.isActive ?? true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'collection_slug,variant_slug,document_key' }
            )
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Upsert ops_documents nije uspeo: ${error?.message || 'unknown error'}`);
        }

        return mapDocumentRow(data);
    }

    async listCollectionDocuments(collectionSlug: string): Promise<OpsDocumentRecord[]> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_documents')
            .select('*')
            .eq('collection_slug', collectionSlug)
            .eq('is_active', true)
            .order('scope', { ascending: true })
            .order('title', { ascending: true });

        ensureSuccess(error, 'Čitanje ops_documents nije uspelo');
        return ((data as any[]) || []).map(mapDocumentRow);
    }

    async replaceCollectionDocuments(collectionSlug: string, documents: OpsDocumentRecord[]): Promise<void> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { error: deleteError } = await supabase.from('ops_documents').delete().eq('collection_slug', collectionSlug);
        ensureSuccess(deleteError, 'Brisanje starih ops_documents redova nije uspelo');

        if (documents.length === 0) return;

        const rows = documents.map((document) => ({
            collection_slug: collectionSlug,
            variant_slug: document.variantSlug,
            scope: document.scope,
            document_key: document.documentKey,
            title: document.title,
            type: document.type,
            locale: document.locale,
            url: document.url,
            checksum: document.checksum,
            payload: document.payload,
            is_active: document.isActive,
        }));

        const { error } = await supabase.from('ops_documents').insert(rows);
        ensureSuccess(error, 'Upis rollback ops_documents redova nije uspeo');
    }

    async createRelease(params: CreateReleaseParams): Promise<OpsReleaseRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_releases')
            .insert({
                status: params.status || 'queued',
                kind: params.kind,
                requested_by: params.requestedBy,
                reason: params.reason || '',
                incident_reference: params.incidentReference || null,
                rolled_back_from_release_id: params.rolledBackFromReleaseId || null,
                correlation_id: params.correlationId || null,
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Kreiranje ops_release zapisa nije uspelo: ${error?.message || 'unknown error'}`);
        }

        return mapReleaseRow(data);
    }

    async updateRelease(releaseId: string, params: UpdateReleaseParams): Promise<OpsReleaseRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();

        const patch: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (params.status) patch.status = params.status;
        if (params.appliedAt !== undefined) patch.applied_at = params.appliedAt;
        if (params.failedAt !== undefined) patch.failed_at = params.failedAt;
        if (params.finishedAt !== undefined) patch.finished_at = params.finishedAt;
        if (params.reason !== undefined) patch.reason = params.reason;
        if (params.incidentReference !== undefined) patch.incident_reference = params.incidentReference;

        const { data, error } = await supabase
            .from('ops_releases')
            .update(patch)
            .eq('id', releaseId)
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Ažuriranje ops_release zapisa nije uspelo: ${error?.message || 'unknown error'}`);
        }

        return mapReleaseRow(data);
    }

    async getReleaseById(releaseId: string): Promise<OpsReleaseRecord | null> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_releases')
            .select('*')
            .eq('id', releaseId)
            .maybeSingle();

        ensureSuccess(error, 'Čitanje ops_release zapisa nije uspelo');
        return data ? mapReleaseRow(data) : null;
    }

    async getLatestStableReleaseBefore(createdAt: string, excludeReleaseId?: string): Promise<OpsReleaseRecord | null> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        let query = supabase
            .from('ops_releases')
            .select('*')
            .in('status', ['applied', 'rolled_back'])
            .lt('created_at', createdAt)
            .order('created_at', { ascending: false })
            .limit(1);

        if (excludeReleaseId) {
            query = query.neq('id', excludeReleaseId);
        }

        const { data, error } = await query.maybeSingle();
        ensureSuccess(error, 'Čitanje prethodnog stabilnog ops_release zapisa nije uspelo');
        return data ? mapReleaseRow(data) : null;
    }

    async getActiveRelease(): Promise<OpsReleaseRecord | null> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_releases')
            .select('*')
            .eq('status', 'queued')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        ensureSuccess(error, 'Čitanje aktivnog ops_release zapisa nije uspelo');
        return data ? mapReleaseRow(data) : null;
    }

    async attachReleaseChangeSet(releaseId: string, changeSetId: string): Promise<void> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { error } = await supabase
            .from('ops_release_change_sets')
            .upsert({ release_id: releaseId, change_set_id: changeSetId }, { onConflict: 'release_id,change_set_id' });

        ensureSuccess(error, 'Povezivanje release-change_set nije uspelo');
    }

    async createSnapshot(params: CreateSnapshotParams): Promise<OpsSnapshotRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_snapshots')
            .insert({
                release_id: params.releaseId,
                snapshot_hash: params.snapshotHash,
                snapshot_payload: params.snapshotPayload,
                created_by: params.createdBy,
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Upis ops_snapshot zapisa nije uspeo: ${error?.message || 'unknown error'}`);
        }

        return mapSnapshotRow(data);
    }

    async getSnapshotByReleaseId(releaseId: string): Promise<OpsSnapshotRecord | null> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_snapshots')
            .select('*')
            .eq('release_id', releaseId)
            .maybeSingle();

        ensureSuccess(error, 'Čitanje ops_snapshot zapisa nije uspelo');
        return data ? mapSnapshotRow(data) : null;
    }

    async insertAuditEvent(params: InsertAuditEventParams): Promise<OpsAuditEventRecord> {
        assertOpsDbReady();
        const supabase = getServerSupabase();
        const { data, error } = await supabase
            .from('ops_audit_events')
            .insert({
                entity_type: params.entityType,
                entity_id: params.entityId,
                action: params.action,
                actor_type: params.actorType,
                actor_id: params.actorId,
                context: params.context || {},
                payload_summary: params.payloadSummary || {},
                payload_hash: params.payloadHash,
                correlation_id: params.correlationId || null,
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Upis ops_audit_event zapisa nije uspeo: ${error?.message || 'unknown error'}`);
        }

        return mapAuditEventRow(data);
    }

    async listAuditEvents(filters: ListAuditEventsFilters): Promise<OpsAuditEventRecord[]> {
        assertOpsDbReady();
        const supabase = getServerSupabase();

        let query = supabase.from('ops_audit_events').select('*').order('occurred_at', { ascending: false });

        if (filters.entityType) {
            query = query.eq('entity_type', filters.entityType);
        }

        if (filters.entityId) {
            query = query.eq('entity_id', filters.entityId);
        }

        if (filters.collectionSlug) {
            query = query.contains('context', { collectionSlug: filters.collectionSlug });
        }

        if (filters.releaseId) {
            query = query.contains('context', { releaseId: filters.releaseId });
        }

        if (filters.limit && Number.isFinite(filters.limit) && filters.limit > 0) {
            query = query.limit(Math.min(filters.limit, 200));
        } else {
            query = query.limit(100);
        }

        const { data, error } = await query;
        ensureSuccess(error, 'Čitanje ops_audit_events nije uspelo');
        return ((data as any[]) || []).map(mapAuditEventRow);
    }
}

export const opsRepository = new OpsRepository();
