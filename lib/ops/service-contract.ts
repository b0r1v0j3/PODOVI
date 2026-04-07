import { createHash } from 'node:crypto';
import { resolveProductBySlug } from '@/lib/product-page/resolve-product';
import { normalizeDocumentForStorage, productToDocumentSet, validateDocumentDraft, validateDocumentSet, validateMetadataPatch, validateVariantPatch } from './invariants';
import { opsRepository } from './repository';
import type {
  CreateMetadataDraftInput,
  OpsActorRole,
  OpsAuditAction,
  OpsChangeItemRecord,
  OpsChangeSetRecord,
  OpsCollectionDocument,
  OpsCollectionRecord,
  OpsCollectionMetadataPatch,
  OpsDocumentRecord,
  OpsDraftDetails,
  OpsDraftResult,
  OpsInvariantIssue,
  OpsPublishResult,
  OpsReleaseRecord,
  OpsRollbackResult,
  OpsVariantRecord,
  OpsVariantMetadataPatch,
  PublishReleaseInput,
  ReviewChangeSetInput,
  RollbackReleaseInput,
  SubmitChangeSetInput,
  UpsertDocumentDraftRequest,
  UpsertVariantDraftRequest,
} from './types';
import { OpsValidationError } from './types';

const err = (code: OpsInvariantIssue['code'], message: string, field?: string): OpsInvariantIssue => ({ code, level: 'error', message, field });
const hash = (payload: unknown) => `sha256:${createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex')}`;
const blocking = (issues: OpsInvariantIssue[]) => issues.filter((i) => i.level === 'error');

function slugify(value: string) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function variantSlug(collectionSlug: string, color: Record<string, unknown>) {
  return `${collectionSlug}-${String(color.code || 'variant')}-${slugify(String(color.name || ''))}`.replace(/-+/g, '-');
}

function findVariant(product: any, collectionSlug: string, lookup: string) {
  const q = String(lookup || '').trim().toLowerCase();
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  for (let i = 0; i < colors.length; i += 1) {
    const color = colors[i] as Record<string, any>;
    const explicit = String(color.slug || '').trim().toLowerCase();
    const generated = variantSlug(collectionSlug, color).toLowerCase();
    const code = String(color.code || '').trim().toLowerCase();
    if (explicit === q || generated === q || code === q || q.endsWith(`-${code}`)) {
      return {
        variantSlug: explicit || generated,
        variantCode: String(color.code || '').trim(),
        name: String(color.name || color.code || generated).trim(),
        sortOrder: i,
        payload: {
          code: String(color.code || '').trim(),
          name: String(color.name || '').trim(),
          description: String(color.description || '').trim(),
          imageUrl: String(color.image_url || color.image || '').trim(),
          overallThickness: String(color.overall_thickness || '').trim(),
          format: String(color.format || '').trim(),
          dimension: String(color.dimension || '').trim(),
          characteristics: color.characteristics && typeof color.characteristics === 'object' ? color.characteristics : {},
        },
      };
    }
  }
  return null;
}

function docTarget(targetKey: string) {
  const t = String(targetKey || '').trim();
  if (!t.startsWith('variant:')) return { titleKey: t.replace('document:', '').trim().toLowerCase() };
  const [v, d] = t.split('/document:');
  return { variantSlug: v.replace('variant:', '').trim(), titleKey: String(d || '').trim().toLowerCase() };
}

function parseVariantTargetKey(targetKey: string) {
  if (targetKey.startsWith('variant:')) return targetKey.slice('variant:'.length).trim();
  return String(targetKey || '').trim();
}

async function requireRole(actorId: string, allowed: OpsActorRole[]) {
  const id = String(actorId || '').trim();
  if (!id) throw new OpsValidationError('Actor missing.', [err('actor_id_missing', 'actorId je obavezan.', 'actorId')]);
  const role = await opsRepository.resolveActorRole(id);
  if (!role) throw new OpsValidationError('Actor role missing.', [err('actor_role_missing', `Nema role za ${id}.`, 'actorId')]);
  if (!allowed.includes(role)) throw new OpsValidationError('Permission denied.', [err('permission_denied', `Rola ${role} nema pristup.`, 'actorId')]);
  return role;
}

async function audit(action: OpsAuditAction, actorId: string, entityType: string, entityId: string, summary: Record<string, unknown>, context: Record<string, unknown>, correlationId?: string | null) {
  await opsRepository.insertAuditEvent({
    action,
    actorType: 'agent',
    actorId,
    entityType,
    entityId,
    payloadSummary: summary,
    context,
    correlationId: correlationId || null,
    payloadHash: hash({ action, summary, context }),
  });
}

async function resolveCollection(collectionSlug: string) {
  const product = await resolveProductBySlug(collectionSlug);
  if (!product) throw new OpsValidationError('Collection missing.', [err('collection_not_found', `Kolekcija ${collectionSlug} nije pronađena.`, 'collectionSlug')]);
  return product;
}

export class OpsServiceContract {
  async createMetadataDraft(input: CreateMetadataDraftInput): Promise<OpsDraftResult> {
    await requireRole(input.actorId, ['editor', 'reviewer', 'publisher']);
    const actorId = String(input.actorId || '').trim();
    const collectionSlug = String(input.collectionSlug || '').trim();
    const issues = [...validateMetadataPatch(input.metadataPatch || {})];
    const product = collectionSlug ? await resolveProductBySlug(collectionSlug) : null;
    if (!product) issues.push(err('collection_not_found', `Kolekcija ${collectionSlug} nije pronađena.`, 'collectionSlug'));
    if (blocking(issues).length) throw new OpsValidationError('Metadata draft nije validan.', issues);

    const changeSet = await opsRepository.createChangeSet({
      collectionSlug,
      collectionName: product!.name,
      categoryId: product!.categoryId,
      brandId: product!.brandId,
      rationale: input.rationale || '',
      riskLevel: input.riskLevel || 'medium',
      actorId,
    });

    const changeItem = await opsRepository.upsertChangeItem({
      changeSetId: changeSet.id,
      itemType: 'collection_metadata',
      targetKey: `collection:${collectionSlug}`,
      beforePayload: {
        name: product!.name,
        shortDescription: product!.shortDescription,
        description: product!.description,
        externalLink: product!.externalLink || '',
        detailsSections: product!.detailsSections || [],
      },
      afterPayload: input.metadataPatch,
      validationErrors: issues,
      actorId,
    });

    await audit('change_set.created', actorId, 'change_set', changeSet.id, { itemType: changeItem.itemType, targetKey: changeItem.targetKey }, { changeSetId: changeSet.id, collectionSlug });
    return { changeSet, changeItem, issues };
  }

  async upsertVariantDraft(input: UpsertVariantDraftRequest): Promise<OpsDraftResult> {
    await requireRole(input.actorId, ['editor', 'reviewer', 'publisher']);
    const actorId = String(input.actorId || '').trim();
    const changeSet = await opsRepository.getChangeSetById(input.changeSetId);
    if (!changeSet) throw new OpsValidationError('Change-set missing.', [err('change_set_not_found', `Change-set ${input.changeSetId} ne postoji.`, 'changeSetId')]);
    if (changeSet.status !== 'draft' && changeSet.status !== 'rejected') throw new OpsValidationError('State invalid.', [err('change_set_state_invalid', `Variant draft nije dozvoljen za status ${changeSet.status}.`, 'status')]);

    const issues = [...validateVariantPatch(input.variantPatch || {})];
    const product = await resolveCollection(changeSet.collectionSlug);
    const base = findVariant(product, changeSet.collectionSlug, input.variantSlug);
    if (!base) issues.push(err('variant_not_found', `Variant ${input.variantSlug} nije pronađen.`, 'variantSlug'));
    if (blocking(issues).length) throw new OpsValidationError('Variant draft nije validan.', issues);

    const changeItem = await opsRepository.upsertChangeItem({
      changeSetId: changeSet.id,
      itemType: 'variant_metadata',
      targetKey: `variant:${base!.variantSlug}`,
      beforePayload: base!.payload,
      afterPayload: { ...base!.payload, ...input.variantPatch },
      validationErrors: issues,
      actorId,
    });

    await audit('change_set.updated', actorId, 'change_set', changeSet.id, { itemType: changeItem.itemType, targetKey: changeItem.targetKey }, { changeSetId: changeSet.id, collectionSlug: changeSet.collectionSlug, variantSlug: base!.variantSlug });
    return { changeSet, changeItem, issues };
  }

  async upsertDocumentDraft(input: UpsertDocumentDraftRequest): Promise<OpsDraftResult> {
    await requireRole(input.actorId, ['editor', 'reviewer', 'publisher']);
    const actorId = String(input.actorId || '').trim();
    const changeSet = await opsRepository.getChangeSetById(input.changeSetId);
    if (!changeSet) throw new OpsValidationError('Change-set missing.', [err('change_set_not_found', `Change-set ${input.changeSetId} ne postoji.`, 'changeSetId')]);
    if (changeSet.status !== 'draft' && changeSet.status !== 'rejected') throw new OpsValidationError('State invalid.', [err('change_set_state_invalid', `Document draft nije dozvoljen za status ${changeSet.status}.`, 'status')]);

    const issues = [...validateDocumentDraft(input.document)];
    const product = await resolveCollection(changeSet.collectionSlug);
    if ((input.document.scope || 'collection') === 'variant') {
      const v = findVariant(product, changeSet.collectionSlug, String(input.document.variantSlug || ''));
      if (!v) issues.push(err('variant_not_found', `Variant ${input.document.variantSlug} nije pronađen.`, 'variantSlug'));
    }

    const baseDocs = productToDocumentSet(product);
    const existingItems = await opsRepository.listChangeItems(changeSet.id);
    const mergedDocs = (() => {
      const map = new Map<string, OpsCollectionDocument>();
      for (const d of baseDocs) {
        const scope = d.variantSlug ? `variant:${d.variantSlug}` : 'collection';
        map.set(`${scope}:${d.title.trim().toLowerCase()}`, d);
      }
      for (const i of existingItems) {
        if (i.itemType !== 'document') continue;
        const next = i.afterPayload as OpsCollectionDocument;
        if (!next?.title) continue;
        const p = docTarget(i.targetKey);
        const scope = p.variantSlug ? `variant:${p.variantSlug}` : 'collection';
        map.set(`${scope}:${p.titleKey}`, next);
      }
      const normalized = normalizeDocumentForStorage(input.document);
      const scope = normalized.variantSlug ? `variant:${normalized.variantSlug}` : 'collection';
      map.set(`${scope}:${normalized.title.toLowerCase()}`, normalized);
      return Array.from(map.values());
    })();

    issues.push(...validateDocumentSet(mergedDocs));
    if (blocking(issues).length) throw new OpsValidationError('Document draft nije validan.', issues);

    const normalized = normalizeDocumentForStorage(input.document);
    const scopePrefix = normalized.variantSlug ? `variant:${normalized.variantSlug}` : 'collection';
    const targetKey = `${scopePrefix}/document:${normalized.title.trim().toLowerCase()}`;

    const changeItem = await opsRepository.upsertChangeItem({
      changeSetId: changeSet.id,
      itemType: 'document',
      targetKey,
      beforePayload: mergedDocs.find((d) => String(d.variantSlug || '') === String(normalized.variantSlug || '') && d.title.trim().toLowerCase() === normalized.title.trim().toLowerCase()) || null,
      afterPayload: normalized,
      validationErrors: issues,
      actorId,
    });

    await audit('change_set.updated', actorId, 'change_set', changeSet.id, { itemType: changeItem.itemType, targetKey: changeItem.targetKey }, { changeSetId: changeSet.id, collectionSlug: changeSet.collectionSlug });
    return { changeSet, changeItem, issues };
  }

  async submitChangeSet(input: SubmitChangeSetInput): Promise<OpsChangeSetRecord> {
    await requireRole(input.actorId, ['editor', 'reviewer', 'publisher']);
    const actorId = String(input.actorId || '').trim();
    const changeSet = await opsRepository.getChangeSetById(input.changeSetId);
    if (!changeSet) throw new OpsValidationError('Change-set missing.', [err('change_set_not_found', `Change-set ${input.changeSetId} ne postoji.`, 'changeSetId')]);
    if (changeSet.status !== 'draft' && changeSet.status !== 'rejected') throw new OpsValidationError('State invalid.', [err('change_set_state_invalid', `Submit nije dozvoljen za status ${changeSet.status}.`, 'status')]);

    const items = await opsRepository.listChangeItems(changeSet.id);
    if (!items.length) throw new OpsValidationError('Empty change-set.', [err('change_set_has_no_items', 'Change-set mora imati bar jednu stavku.', 'items')]);
    if (items.some((i) => blocking(i.validationErrors || []).length > 0)) throw new OpsValidationError('Validation failed.', [err('change_set_validation_failed', 'Postoje blokirajuce validation greske.', 'validationErrors')]);

    const updated = await opsRepository.updateChangeSet(changeSet.id, { status: 'pending_review', submittedAt: new Date().toISOString(), updatedBy: actorId });
    await audit('change_set.submitted', actorId, 'change_set', changeSet.id, { riskLevel: updated.riskLevel, items: items.length }, { changeSetId: changeSet.id, collectionSlug: changeSet.collectionSlug });
    return updated;
  }

  async reviewChangeSet(input: ReviewChangeSetInput): Promise<OpsChangeSetRecord> {
    await requireRole(input.actorId, ['reviewer', 'publisher']);
    const actorId = String(input.actorId || '').trim();
    const changeSet = await opsRepository.getChangeSetById(input.changeSetId);
    if (!changeSet) throw new OpsValidationError('Change-set missing.', [err('change_set_not_found', `Change-set ${input.changeSetId} ne postoji.`, 'changeSetId')]);
    if (changeSet.status !== 'pending_review') throw new OpsValidationError('State invalid.', [err('change_set_state_invalid', `Review nije dozvoljen za status ${changeSet.status}.`, 'status')]);

    const reviewComment = String(input.reviewComment || '').trim();
    if (input.decision === 'rejected' && !reviewComment) throw new OpsValidationError('Review comment required.', [err('review_comment_required', 'Review komentar je obavezan za reject.', 'reviewComment')]);
    if ((changeSet.riskLevel === 'high' || changeSet.riskLevel === 'critical') && changeSet.createdBy === actorId && input.decision === 'approved') {
      throw new OpsValidationError('Self approval disallowed.', [err('review_self_approval_disallowed', 'Self-approve nije dozvoljen za high/critical.', 'actorId')]);
    }

    await opsRepository.insertReviewDecision({ changeSetId: changeSet.id, decision: input.decision, reviewerId: actorId, reviewComment, riskLevel: changeSet.riskLevel });
    const updated = await opsRepository.updateChangeSet(changeSet.id, { status: input.decision === 'approved' ? 'approved' : 'rejected', approvedAt: input.decision === 'approved' ? new Date().toISOString() : null, updatedBy: actorId });
    await audit(input.decision === 'approved' ? 'change_set.approved' : 'change_set.rejected', actorId, 'change_set', changeSet.id, { decision: input.decision, riskLevel: changeSet.riskLevel }, { changeSetId: changeSet.id, collectionSlug: changeSet.collectionSlug });
    return updated;
  }

  private async applyChangeSet(changeSet: OpsChangeSetRecord, items: OpsChangeItemRecord[], actorId: string) {
    const product = await resolveCollection(changeSet.collectionSlug);
    const metadataBase = {
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      externalLink: product.externalLink || '',
      detailsSections: product.detailsSections || [],
    };

    const collectionPatch: OpsCollectionMetadataPatch = {};
    const variantItems: OpsChangeItemRecord[] = [];
    const documentItems: OpsChangeItemRecord[] = [];

    for (const item of items) {
      if (item.itemType === 'collection_metadata') Object.assign(collectionPatch, (item.afterPayload || {}) as OpsCollectionMetadataPatch);
      else if (item.itemType === 'variant_metadata') variantItems.push(item);
      else if (item.itemType === 'document') documentItems.push(item);
    }

    const metadata = { ...metadataBase, ...collectionPatch };
    await opsRepository.upsertCollectionState({
      collectionSlug: changeSet.collectionSlug,
      collectionName: String(metadata.name || product.name),
      categoryId: product.categoryId,
      brandId: product.brandId,
      metadata,
      sourceType: 'resolver',
      sourceRef: `/proizvodi/${changeSet.collectionSlug}`,
      sourceFetchedAt: new Date().toISOString(),
      state: 'published',
      incrementPublishedVersion: true,
      incrementDraftVersion: true,
    });

    for (const item of variantItems) {
      const key = parseVariantTargetKey(item.targetKey);
      const base = findVariant(product, changeSet.collectionSlug, key);
      if (!base) throw new OpsValidationError('Variant missing while publishing.', [err('variant_not_found', `Variant ${key} nije pronadjen tokom publish-a.`, 'targetKey')]);
      const payload = { ...base.payload, ...((item.afterPayload || {}) as OpsVariantMetadataPatch) };
      await opsRepository.upsertVariantState({ collectionSlug: changeSet.collectionSlug, variantSlug: base.variantSlug, variantCode: base.variantCode, name: String(payload.name || base.name), sortOrder: base.sortOrder, isActive: true, payload });
    }

    for (const item of documentItems) {
      const normalized = normalizeDocumentForStorage((item.afterPayload || {}) as OpsCollectionDocument);
      const parsed = docTarget(item.targetKey);
      await opsRepository.upsertDocumentState({
        collectionSlug: changeSet.collectionSlug,
        variantSlug: normalized.variantSlug || parsed.variantSlug,
        title: normalized.title,
        type: normalized.type || null,
        locale: normalized.locale || 'sr-RS',
        url: normalized.url,
        checksum: hash({ title: normalized.title, url: normalized.url }),
        payload: normalized as unknown as Record<string, unknown>,
        isActive: true,
      });
    }

    await opsRepository.updateChangeSet(changeSet.id, { status: 'published', publishedAt: new Date().toISOString(), updatedBy: actorId });
  }

  private async releaseSnapshot(changeSets: OpsChangeSetRecord[], release: OpsReleaseRecord) {
    const slugs = Array.from(new Set(changeSets.map((changeSet) => changeSet.collectionSlug)));
    const collections: Array<{ collection: any; variants: any[]; documents: any[] }> = [];
    for (const slug of slugs) {
      const collection = await opsRepository.getCollectionState(slug);
      if (!collection) continue;
      const [variants, documents] = await Promise.all([opsRepository.listCollectionVariants(slug), opsRepository.listCollectionDocuments(slug)]);
      collections.push({ collection, variants, documents });
    }
    return {
      release: { id: release.id, kind: release.kind, status: release.status },
      generatedAt: new Date().toISOString(),
      changeSetIds: changeSets.map((changeSet) => changeSet.id),
      collections,
    };
  }

  async publishRelease(input: PublishReleaseInput): Promise<OpsPublishResult> {
    await requireRole(input.actorId, ['publisher']);
    const actorId = String(input.actorId || '').trim();
    const changeSetIds = Array.from(new Set((input.changeSetIds || []).map((id) => String(id).trim()).filter(Boolean)));
    if (!changeSetIds.length) throw new OpsValidationError('No change sets.', [err('change_set_not_found', 'Prosledjen je prazan changeSetIds niz.', 'changeSetIds')]);

    const active = await opsRepository.getActiveRelease();
    if (active) throw new OpsValidationError('Release conflict.', [err('release_conflict', `Aktivan release ${active.id} blokira novi publish.`, 'release')]);

    const changeSets = await opsRepository.listChangeSetsByIds(changeSetIds);
    if (changeSets.length !== changeSetIds.length) throw new OpsValidationError('Change set missing.', [err('change_set_not_found', 'Neki change-set ID nije pronadjen.', 'changeSetIds')]);

    for (const changeSet of changeSets) {
      if (changeSet.status !== 'approved') throw new OpsValidationError('State invalid.', [err('change_set_state_invalid', `Change-set ${changeSet.id} nije approved.`, 'status')]);
      const items = await opsRepository.listChangeItems(changeSet.id);
      if (!items.length) throw new OpsValidationError('Empty change-set.', [err('change_set_has_no_items', `Change-set ${changeSet.id} nema stavke.`, 'items')]);
      if (items.some((item) => blocking(item.validationErrors || []).length > 0)) throw new OpsValidationError('Validation failed.', [err('change_set_validation_failed', `Change-set ${changeSet.id} ima validation error.`, 'validationErrors')]);
      if (changeSet.riskLevel !== 'low') {
        const decisions = await opsRepository.listReviewDecisions(changeSet.id);
        if (!decisions.some((decision) => decision.decision === 'approved')) throw new OpsValidationError('Approval required.', [err('change_set_requires_approval', `Change-set ${changeSet.id} nema approval.`, 'review')]);
      }
    }

    const release = await opsRepository.createRelease({ kind: 'publish', status: 'queued', requestedBy: actorId, reason: input.reason || '', correlationId: input.correlationId || null });
    await audit('release.started', actorId, 'release', release.id, { kind: release.kind, changeSetIds }, { releaseId: release.id }, release.correlationId);

    try {
      for (const changeSet of changeSets) {
        const items = await opsRepository.listChangeItems(changeSet.id);
        await opsRepository.attachReleaseChangeSet(release.id, changeSet.id);
        await this.applyChangeSet(changeSet, items, actorId);
      }

      const snapshotPayload = await this.releaseSnapshot(changeSets, release);
      const snapshot = await opsRepository.createSnapshot({ releaseId: release.id, snapshotHash: hash(snapshotPayload), snapshotPayload, createdBy: actorId });
      const applied = await opsRepository.updateRelease(release.id, { status: 'applied', appliedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });

      await audit('release.applied', actorId, 'release', applied.id, { snapshotId: snapshot.id, changeSetIds }, { releaseId: applied.id, snapshotId: snapshot.id }, applied.correlationId);
      return { release: applied, snapshot, changeSets };
    } catch (e) {
      const failed = await opsRepository.updateRelease(release.id, { status: 'failed', failedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });
      await audit('release.failed', actorId, 'release', failed.id, { error: e instanceof Error ? e.message : 'Unknown error', changeSetIds }, { releaseId: failed.id }, failed.correlationId);
      throw e;
    }
  }

  private async applySnapshot(snapshotPayload: Record<string, unknown>) {
    const collections = Array.isArray((snapshotPayload as any).collections) ? ((snapshotPayload as any).collections as Array<{ collection: any; variants: any[]; documents: any[] }>) : [];
    for (const node of collections) {
      const collection = node.collection as OpsCollectionRecord | undefined;
      if (!collection) continue;
      await opsRepository.upsertCollectionState({
        collectionSlug: collection.collectionSlug,
        collectionName: collection.collectionName,
        categoryId: collection.categoryId,
        brandId: collection.brandId,
        metadata: collection.metadata,
        sourceType: collection.sourceType,
        sourceRef: collection.sourceRef,
        sourceFetchedAt: new Date().toISOString(),
        state: collection.state,
        incrementPublishedVersion: true,
        incrementDraftVersion: true,
      });
      await opsRepository.replaceCollectionVariants(collection.collectionSlug, (node.variants || []) as OpsVariantRecord[]);
      await opsRepository.replaceCollectionDocuments(collection.collectionSlug, (node.documents || []) as OpsDocumentRecord[]);
    }
  }

  private async resolveRollbackSnapshotTarget(target: OpsReleaseRecord) {
    if (target.kind === 'rollback' && target.rolledBackFromReleaseId) {
      const snapshot = await opsRepository.getSnapshotByReleaseId(target.rolledBackFromReleaseId);
      if (!snapshot) {
        throw new OpsValidationError('Snapshot missing.', [
          err(
            'snapshot_not_found',
            `Snapshot ne postoji za release ${target.rolledBackFromReleaseId} koji rollback ${target.id} poništava.`,
            'releaseId'
          ),
        ]);
      }

      return {
        snapshot,
        restoredFromReleaseId: target.rolledBackFromReleaseId,
      };
    }

    const previousStableRelease = await opsRepository.getLatestStableReleaseBefore(target.createdAt, target.id);
    if (!previousStableRelease) {
      throw new OpsValidationError('Snapshot missing.', [
        err(
          'snapshot_not_found',
          `Ne postoji prethodni stabilni release pre ${target.id}, pa rollback nema na šta da vrati stanje.`,
          'releaseId'
        ),
      ]);
    }

    const snapshot = await opsRepository.getSnapshotByReleaseId(previousStableRelease.id);
    if (!snapshot) {
      throw new OpsValidationError('Snapshot missing.', [
        err(
          'snapshot_not_found',
          `Snapshot ne postoji za prethodni stabilni release ${previousStableRelease.id}.`,
          'releaseId'
        ),
      ]);
    }

    return {
      snapshot,
      restoredFromReleaseId: previousStableRelease.id,
    };
  }

  async rollbackRelease(input: RollbackReleaseInput): Promise<OpsRollbackResult> {
    await requireRole(input.actorId, ['publisher']);
    const actorId = String(input.actorId || '').trim();
    const reason = String(input.reason || '').trim();
    const incidentReference = String(input.incidentReference || '').trim();

    if (!reason) throw new OpsValidationError('Rollback reason missing.', [err('rollback_reason_missing', 'Rollback razlog je obavezan.', 'reason')]);
    if (!incidentReference) throw new OpsValidationError('Incident ref missing.', [err('incident_reference_missing', 'Incident reference je obavezan.', 'incidentReference')]);

    const active = await opsRepository.getActiveRelease();
    if (active) throw new OpsValidationError('Release conflict.', [err('release_conflict', `Aktivan release ${active.id} blokira rollback.`, 'release')]);

     const target = await opsRepository.getReleaseById(input.releaseId);
     if (!target) throw new OpsValidationError('Release missing.', [err('release_not_found', `Release ${input.releaseId} nije pronadjen.`, 'releaseId')]);
     if (target.status !== 'applied' && target.status !== 'rolled_back') throw new OpsValidationError('Release state invalid.', [err('release_state_invalid', `Rollback nije dozvoljen za status ${target.status}.`, 'status')]);

    const rollbackTarget = await this.resolveRollbackSnapshotTarget(target);

    const rollback = await opsRepository.createRelease({ kind: 'rollback', status: 'queued', requestedBy: actorId, reason, incidentReference, rolledBackFromReleaseId: target.id, correlationId: input.correlationId || target.correlationId });
    await audit(
      'rollback.requested',
      actorId,
      'release',
      rollback.id,
      { targetReleaseId: target.id, restoredFromReleaseId: rollbackTarget.restoredFromReleaseId, reason, incidentReference },
      { releaseId: rollback.id, targetReleaseId: target.id, restoredFromReleaseId: rollbackTarget.restoredFromReleaseId },
      rollback.correlationId
    );

    try {
      await this.applySnapshot((rollbackTarget.snapshot.snapshotPayload || {}) as Record<string, unknown>);
      const snapshotPayload = {
        ...(rollbackTarget.snapshot.snapshotPayload || {}),
        rollbackFromReleaseId: target.id,
        rollbackReleaseId: rollback.id,
        restoredFromReleaseId: rollbackTarget.restoredFromReleaseId,
        generatedAt: new Date().toISOString(),
      };
      const snapshot = await opsRepository.createSnapshot({ releaseId: rollback.id, snapshotHash: hash(snapshotPayload), snapshotPayload, createdBy: actorId });
      const rolledBack = await opsRepository.updateRelease(rollback.id, { status: 'rolled_back', appliedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });

      await audit(
        'rollback.applied',
        actorId,
        'release',
        rolledBack.id,
        { targetReleaseId: target.id, restoredFromReleaseId: rollbackTarget.restoredFromReleaseId, snapshotId: snapshot.id },
        { releaseId: rolledBack.id, targetReleaseId: target.id, restoredFromReleaseId: rollbackTarget.restoredFromReleaseId, snapshotId: snapshot.id },
        rolledBack.correlationId
      );
      return { release: rolledBack, snapshot, targetRelease: target };
    } catch (e) {
      const failed = await opsRepository.updateRelease(rollback.id, { status: 'failed', failedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });
      await audit(
        'rollback.failed',
        actorId,
        'release',
        failed.id,
        {
          targetReleaseId: target.id,
          restoredFromReleaseId: rollbackTarget.restoredFromReleaseId,
          error: e instanceof Error ? e.message : 'Unknown error',
        },
        { releaseId: failed.id, targetReleaseId: target.id, restoredFromReleaseId: rollbackTarget.restoredFromReleaseId },
        failed.correlationId
      );
      throw e;
    }
  }

  async getDraftDetails(changeSetId: string): Promise<OpsDraftDetails | null> {
    const changeSet = await opsRepository.getChangeSetById(changeSetId);
    if (!changeSet) return null;
    const items = await opsRepository.listChangeItems(changeSetId);
    return { changeSet, items };
  }

  async getAuditEvents(filters: { entityType?: string; entityId?: string; collectionSlug?: string; releaseId?: string; limit?: number }) {
    return opsRepository.listAuditEvents(filters);
  }
}

export const opsServiceContract = new OpsServiceContract();
