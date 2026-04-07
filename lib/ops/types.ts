import type { Product } from '@/types';

export const OPS_CHANGE_SET_STATUSES = [
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'published',
] as const;

export const OPS_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const OPS_CHANGE_ITEM_TYPES = [
    'collection_metadata',
    'variant_metadata',
    'document',
    'curation_rule',
] as const;

export const OPS_REVIEW_DECISIONS = ['approved', 'rejected'] as const;

export const OPS_RELEASE_STATUSES = ['queued', 'applied', 'failed', 'rolled_back'] as const;
export const OPS_RELEASE_KINDS = ['publish', 'rollback'] as const;
export const OPS_ACTOR_ROLES = ['editor', 'reviewer', 'publisher'] as const;

export const OPS_AUDIT_ACTIONS = [
    'change_set.created',
    'change_set.updated',
    'change_set.submitted',
    'change_set.approved',
    'change_set.rejected',
    'release.started',
    'release.applied',
    'release.failed',
    'rollback.requested',
    'rollback.applied',
    'rollback.failed',
    'role_binding.updated',
    'validation.failed',
] as const;

export type OpsChangeSetStatus = (typeof OPS_CHANGE_SET_STATUSES)[number];
export type OpsRiskLevel = (typeof OPS_RISK_LEVELS)[number];
export type OpsChangeItemType = (typeof OPS_CHANGE_ITEM_TYPES)[number];
export type OpsReviewDecision = (typeof OPS_REVIEW_DECISIONS)[number];
export type OpsReleaseStatus = (typeof OPS_RELEASE_STATUSES)[number];
export type OpsReleaseKind = (typeof OPS_RELEASE_KINDS)[number];
export type OpsActorRole = (typeof OPS_ACTOR_ROLES)[number];
export type OpsAuditAction = (typeof OPS_AUDIT_ACTIONS)[number];

export type OpsCollectionMetadataPatch = Partial<{
    name: string;
    shortDescription: string;
    description: string;
    externalLink: string;
    detailsSections: Product['detailsSections'];
}>;

export type OpsVariantMetadataPatch = Partial<{
    name: string;
    imageUrl: string;
    description: string;
    overallThickness: string;
    format: string;
    dimension: string;
    characteristics: Record<string, string>;
}>;

export interface OpsDocumentDraftInput {
    title: string;
    url: string;
    type?: string;
    locale?: string;
    scope?: 'collection' | 'variant';
    variantSlug?: string;
}

export interface OpsCollectionDocument {
    title: string;
    url: string;
    type?: string;
    locale?: string;
    variantSlug?: string;
}

export interface OpsCollectionRecord {
    id: string;
    collectionSlug: string;
    collectionName: string;
    categoryId: string;
    brandId: string;
    state: 'draft' | 'published' | 'archived';
    sourceType: string;
    sourceRef: string | null;
    sourceFetchedAt: string | null;
    publishedVersion: number;
    draftVersion: number;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface OpsVariantRecord {
    id: string;
    collectionSlug: string;
    variantSlug: string;
    variantCode: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
    payload: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface OpsDocumentRecord {
    id: string;
    collectionSlug: string;
    variantSlug: string;
    scope: 'collection' | 'variant';
    documentKey: string;
    title: string;
    type: string | null;
    locale: string;
    url: string;
    checksum: string | null;
    payload: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface OpsChangeSetRecord {
    id: string;
    collectionSlug: string;
    collectionName: string;
    categoryId: string;
    brandId: string;
    status: OpsChangeSetStatus;
    riskLevel: OpsRiskLevel;
    rationale: string;
    createdBy: string;
    updatedBy: string;
    submittedAt: string | null;
    approvedAt: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface OpsChangeItemRecord {
    id: string;
    changeSetId: string;
    itemType: OpsChangeItemType;
    targetKey: string;
    beforePayload: unknown;
    afterPayload: unknown;
    validationErrors: OpsInvariantIssue[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface OpsReviewDecisionRecord {
    id: string;
    changeSetId: string;
    decision: OpsReviewDecision;
    reviewerId: string;
    reviewComment: string;
    riskLevel: OpsRiskLevel;
    createdAt: string;
}

export interface OpsReleaseRecord {
    id: string;
    status: OpsReleaseStatus;
    kind: OpsReleaseKind;
    requestedBy: string;
    requestedAt: string;
    appliedAt: string | null;
    failedAt: string | null;
    finishedAt: string | null;
    rolledBackFromReleaseId: string | null;
    reason: string;
    incidentReference: string | null;
    correlationId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface OpsSnapshotRecord {
    id: string;
    releaseId: string;
    snapshotHash: string;
    snapshotPayload: Record<string, unknown>;
    createdBy: string;
    createdAt: string;
}

export interface OpsRoleBindingRecord {
    id: string;
    actorType: 'agent' | 'user';
    actorId: string;
    role: OpsActorRole;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface OpsAuditEventRecord {
    id: string;
    entityType: string;
    entityId: string;
    action: OpsAuditAction;
    actorType: 'agent' | 'user' | 'system';
    actorId: string;
    context: Record<string, unknown>;
    payloadSummary: Record<string, unknown>;
    payloadHash: string;
    correlationId: string | null;
    occurredAt: string;
    createdAt: string;
}

export interface OpsInvariantIssue {
    code:
        | 'collection_not_found'
        | 'metadata_patch_empty'
        | 'metadata_field_invalid'
        | 'metadata_value_invalid'
        | 'metadata_external_link_invalid'
        | 'variant_slug_missing'
        | 'variant_not_found'
        | 'variant_patch_empty'
        | 'variant_patch_invalid'
        | 'document_title_missing'
        | 'document_url_missing'
        | 'document_url_protocol'
        | 'document_url_local_path'
        | 'document_url_not_pdf'
        | 'document_duplicate_url'
        | 'document_url_normalized'
        | 'change_set_not_found'
        | 'change_set_state_invalid'
        | 'change_set_has_no_items'
        | 'change_set_validation_failed'
        | 'change_set_requires_approval'
        | 'release_conflict'
        | 'release_not_found'
        | 'release_state_invalid'
        | 'snapshot_not_found'
        | 'rollback_reason_missing'
        | 'incident_reference_missing'
        | 'actor_id_missing'
        | 'actor_role_missing'
        | 'permission_denied'
        | 'review_self_approval_disallowed'
        | 'review_comment_required';
    level: 'error' | 'warning';
    message: string;
    field?: string;
}

export interface CreateMetadataDraftInput {
    collectionSlug: string;
    actorId: string;
    rationale?: string;
    riskLevel?: OpsRiskLevel;
    metadataPatch: OpsCollectionMetadataPatch;
}

export interface UpsertVariantDraftRequest {
    changeSetId: string;
    actorId: string;
    variantSlug: string;
    variantPatch: OpsVariantMetadataPatch;
}

export interface UpsertDocumentDraftRequest {
    changeSetId: string;
    actorId: string;
    document: OpsDocumentDraftInput;
}

export interface SubmitChangeSetInput {
    changeSetId: string;
    actorId: string;
}

export interface ReviewChangeSetInput {
    changeSetId: string;
    actorId: string;
    decision: OpsReviewDecision;
    reviewComment: string;
}

export interface PublishReleaseInput {
    actorId: string;
    changeSetIds: string[];
    reason?: string;
    correlationId?: string;
}

export interface RollbackReleaseInput {
    actorId: string;
    releaseId: string;
    reason: string;
    incidentReference: string;
    correlationId?: string;
}

export interface OpsDraftResult {
    changeSet: OpsChangeSetRecord;
    changeItem: OpsChangeItemRecord;
    issues: OpsInvariantIssue[];
}

export interface OpsDraftDetails {
    changeSet: OpsChangeSetRecord;
    items: OpsChangeItemRecord[];
}

export interface OpsPublishResult {
    release: OpsReleaseRecord;
    snapshot: OpsSnapshotRecord;
    changeSets: OpsChangeSetRecord[];
}

export interface OpsRollbackResult {
    release: OpsReleaseRecord;
    snapshot: OpsSnapshotRecord;
    targetRelease: OpsReleaseRecord;
}

export class OpsValidationError extends Error {
    issues: OpsInvariantIssue[];

    constructor(message: string, issues: OpsInvariantIssue[]) {
        super(message);
        this.name = 'OpsValidationError';
        this.issues = issues;
    }
}