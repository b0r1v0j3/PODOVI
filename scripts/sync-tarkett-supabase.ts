import fs from 'node:fs/promises';
import path from 'node:path';

type SyncCategory = 'laminat' | 'parket';

type LocalProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  brandId: string;
  shortDescription?: string;
  description?: string;
  images: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
    order?: number;
  }>;
  specs: Array<{
    key: string;
    label: string;
    value: string;
  }>;
  price?: number;
  priceUnit?: string;
  inStock?: boolean;
  featured?: boolean;
  coveragePerPackage?: number;
  externalLink?: string;
  detailsSections?: unknown;
  documents?: unknown;
};

type DbProduct = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  category_id: string;
  brand_id: string;
  created_at?: string;
  updated_at?: string;
  product_images?: Array<{
    id: string;
    url: string;
    alt: string | null;
    is_primary: boolean | null;
    order_num: number | null;
  }>;
  product_specs?: Array<{
    id: string;
    key: string;
    label: string;
    value: string;
  }>;
};

type PlannedUpdate = {
  dbId: string;
  fromSlug: string;
  toSlug: string;
  sku: string;
  matchedBy: 'slug' | 'sku';
};

type PlannedInsert = {
  slug: string;
  sku: string;
};

type PlannedDelete = {
  dbId: string;
  slug: string;
  sku: string | null;
  name: string;
};

function parseBooleanFlag(flag: string | undefined) {
  return flag === 'true' || flag === '1';
}

async function loadLocalEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  try {
    const raw = await fs.readFile(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) continue;

      let value = trimmed.slice(separatorIndex + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch {
    // No local env file is fine as long as the caller already injected env vars.
  }
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function toSyncCategory(categoryId: string): SyncCategory {
  return categoryId === '3' ? 'parket' : 'laminat';
}

function sortBySlug<T extends { slug: string }>(items: T[]) {
  return [...items].sort((left, right) => left.slug.localeCompare(right.slug, 'sr'));
}

function buildProductPayload(
  product: LocalProduct,
  categoryUuid: string,
  brandUuid: string
) {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku || null,
    category_id: categoryUuid,
    brand_id: brandUuid,
    short_description: product.shortDescription || null,
    description: product.description || null,
    price: product.price ?? null,
    price_unit: product.priceUnit || null,
    in_stock: product.inStock ?? true,
    featured: product.featured ?? false,
    coverage_per_package: product.coveragePerPackage ?? null,
    external_link: product.externalLink || null,
    details_sections: product.detailsSections ?? null,
    documents: product.documents ?? null,
    updated_at: new Date().toISOString(),
  };
}

function buildImagePayloads(productId: string, product: LocalProduct) {
  return (product.images || []).map((image, index) => ({
    product_id: productId,
    url: image.url,
    alt: image.alt || product.name,
    is_primary: image.isPrimary ?? index === 0,
    order_num: image.order ?? index,
  }));
}

function buildSpecPayloads(productId: string, product: LocalProduct) {
  return (product.specs || []).map((spec) => ({
    product_id: productId,
    key: spec.key,
    label: spec.label,
    value: spec.value,
  }));
}

async function main() {
  await loadLocalEnvFile();

  const apply = process.argv.includes('--apply');
  const backupOnly = parseBooleanFlag(process.argv.find((arg) => arg.startsWith('--backup-only='))?.split('=')[1]);

  const [{ tarkettProducts }, supabaseModule, idMappingModule] = await Promise.all([
    import('../lib/data/tarkett-products'),
    import('../lib/supabase/client'),
    import('../lib/repositories/id-mapping'),
  ]);

  const { getServerSupabase, hasSupabaseServiceRoleConfig } = supabaseModule;
  const { mapBrandIdToUUID, mapCategoryIdToUUID } = idMappingModule;

  if (!hasSupabaseServiceRoleConfig()) {
    throw new Error('Supabase service role env vars nisu dostupni. Očekujem NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = getServerSupabase();
  const targetBrandUuid = mapBrandIdToUUID('3');
  const targetCategoryIds = ['1', '3'] as const;
  const targetCategoryUuids = targetCategoryIds.map((categoryId) => mapCategoryIdToUUID(categoryId));

  const { data: dbProductsRaw, error: dbProductsError } = await supabase
    .from('products')
    .select('id, slug, sku, name, brand_id, category_id, created_at, updated_at, product_images(id, url, alt, is_primary, order_num), product_specs(id, key, label, value)')
    .eq('brand_id', targetBrandUuid)
    .in('category_id', targetCategoryUuids)
    .order('slug');

  if (dbProductsError) {
    throw new Error(`Ne mogu da učitam Tarkett proizvode iz Supabase-a: ${dbProductsError.message}`);
  }

  const dbProducts = (dbProductsRaw || []) as DbProduct[];
  const localProducts = sortBySlug(
    (tarkettProducts as LocalProduct[]).filter(
      (product) => product.brandId === '3' && targetCategoryIds.includes(product.categoryId as '1' | '3')
    )
  );

  const dbBySlug = new Map<string, DbProduct[]>();
  const dbBySku = new Map<string, DbProduct[]>();

  for (const dbProduct of dbProducts) {
    const slugList = dbBySlug.get(dbProduct.slug) || [];
    slugList.push(dbProduct);
    dbBySlug.set(dbProduct.slug, slugList);

    if (dbProduct.sku) {
      const skuList = dbBySku.get(dbProduct.sku) || [];
      skuList.push(dbProduct);
      dbBySku.set(dbProduct.sku, skuList);
    }
  }

  const matchedDbIds = new Set<string>();
  const updates: PlannedUpdate[] = [];
  const inserts: PlannedInsert[] = [];
  const localToDbId = new Map<string, string>();

  function pickUnmatched(candidates: DbProduct[] | undefined) {
    return (candidates || []).find((candidate) => !matchedDbIds.has(candidate.id)) || null;
  }

  for (const localProduct of localProducts) {
    const exactSlugMatch = pickUnmatched(dbBySlug.get(localProduct.slug));
    const skuMatch = localProduct.sku ? pickUnmatched(dbBySku.get(localProduct.sku)) : null;
    const matched = exactSlugMatch || skuMatch;

    if (!matched) {
      inserts.push({
        slug: localProduct.slug,
        sku: localProduct.sku,
      });
      continue;
    }

    matchedDbIds.add(matched.id);
    localToDbId.set(localProduct.slug, matched.id);

    updates.push({
      dbId: matched.id,
      fromSlug: matched.slug,
      toSlug: localProduct.slug,
      sku: localProduct.sku,
      matchedBy: exactSlugMatch ? 'slug' : 'sku',
    });
  }

  const deletes: PlannedDelete[] = dbProducts
    .filter((dbProduct) => !matchedDbIds.has(dbProduct.id))
    .map((dbProduct) => ({
      dbId: dbProduct.id,
      slug: dbProduct.slug,
      sku: dbProduct.sku,
      name: dbProduct.name,
    }));

  const summaryByCategory = targetCategoryIds.map((categoryId) => {
    const categoryUuid = mapCategoryIdToUUID(categoryId);
    const localCount = localProducts.filter((product) => product.categoryId === categoryId).length;
    const dbCount = dbProducts.filter((product) => product.category_id === categoryUuid).length;
    const plannedInsertCount = inserts.filter((entry) =>
      localProducts.some((product) => product.slug === entry.slug && product.categoryId === categoryId)
    ).length;
    const plannedDeleteCount = deletes.filter((entry) =>
      dbProducts.some((product) => product.id === entry.dbId && product.category_id === categoryUuid)
    ).length;

    return {
      category: toSyncCategory(categoryId),
      localCount,
      dbCount,
      plannedInsertCount,
      plannedDeleteCount,
    };
  });

  const backupPayload = {
    generatedAt: new Date().toISOString(),
    apply,
    summaryByCategory,
    planned: {
      updates,
      inserts,
      deletes,
    },
    dbProducts,
  };

  await fs.mkdir(path.join(process.cwd(), 'output'), { recursive: true });
  const backupPath = path.join(
    process.cwd(),
    'output',
    `tarkett-supabase-backup-${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')}.json`
  );
  await fs.writeFile(backupPath, JSON.stringify(backupPayload, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        backupPath,
        summaryByCategory,
        planned: {
          updateCount: updates.length,
          insertCount: inserts.length,
          deleteCount: deletes.length,
          slugRenames: updates.filter((update) => update.fromSlug !== update.toSlug).map((update) => ({
            sku: update.sku,
            fromSlug: update.fromSlug,
            toSlug: update.toSlug,
            matchedBy: update.matchedBy,
          })),
        },
      },
      null,
      2
    )
  );

  if (!apply || backupOnly) {
    return;
  }

  async function replaceChildren(productId: string, product: LocalProduct) {
    const { error: deleteImagesError } = await supabase.from('product_images').delete().eq('product_id', productId);
    if (deleteImagesError) {
      throw new Error(`Ne mogu da obrišem stare slike za ${product.slug}: ${deleteImagesError.message}`);
    }

    const imagePayloads = buildImagePayloads(productId, product);
    if (imagePayloads.length > 0) {
      for (const imageChunk of chunk(imagePayloads, 100)) {
        const { error: insertImagesError } = await supabase.from('product_images').insert(imageChunk);
        if (insertImagesError) {
          throw new Error(`Ne mogu da upišem slike za ${product.slug}: ${insertImagesError.message}`);
        }
      }
    }

    const { error: deleteSpecsError } = await supabase.from('product_specs').delete().eq('product_id', productId);
    if (deleteSpecsError) {
      throw new Error(`Ne mogu da obrišem stare specifikacije za ${product.slug}: ${deleteSpecsError.message}`);
    }

    const specPayloads = buildSpecPayloads(productId, product);
    if (specPayloads.length > 0) {
      for (const specChunk of chunk(specPayloads, 200)) {
        const { error: insertSpecsError } = await supabase.from('product_specs').insert(specChunk);
        if (insertSpecsError) {
          throw new Error(`Ne mogu da upišem specifikacije za ${product.slug}: ${insertSpecsError.message}`);
        }
      }
    }
  }

  const localBySlug = new Map(localProducts.map((product) => [product.slug, product]));
  const appliedProductIds = new Set<string>();

  for (const update of updates) {
    const localProduct = localBySlug.get(update.toSlug);
    if (!localProduct) {
      throw new Error(`Lokalni proizvod nedostaje tokom sync-a: ${update.toSlug}`);
    }

    const categoryUuid = mapCategoryIdToUUID(localProduct.categoryId);
    const productPayload = buildProductPayload(localProduct, categoryUuid, targetBrandUuid);

    const { error: updateError } = await supabase
      .from('products')
      .update(productPayload)
      .eq('id', update.dbId);

    if (updateError) {
      throw new Error(`Ne mogu da ažuriram proizvod ${localProduct.slug}: ${updateError.message}`);
    }

    await replaceChildren(update.dbId, localProduct);
    appliedProductIds.add(update.dbId);
  }

  for (const insert of inserts) {
    const localProduct = localBySlug.get(insert.slug);
    if (!localProduct) {
      throw new Error(`Lokalni proizvod nedostaje tokom inserta: ${insert.slug}`);
    }

    const categoryUuid = mapCategoryIdToUUID(localProduct.categoryId);
    const productPayload = buildProductPayload(localProduct, categoryUuid, targetBrandUuid);

    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert(productPayload)
      .select('id')
      .single();

    if (insertError || !insertedProduct?.id) {
      throw new Error(`Ne mogu da ubacim proizvod ${localProduct.slug}: ${insertError?.message || 'missing id'}`);
    }

    await replaceChildren(insertedProduct.id, localProduct);
    appliedProductIds.add(insertedProduct.id);
  }

  for (const deleteEntry of deletes) {
    const { error: deleteImagesError } = await supabase.from('product_images').delete().eq('product_id', deleteEntry.dbId);
    if (deleteImagesError) {
      throw new Error(`Ne mogu da obrišem slike za zastareli proizvod ${deleteEntry.slug}: ${deleteImagesError.message}`);
    }

    const { error: deleteSpecsError } = await supabase.from('product_specs').delete().eq('product_id', deleteEntry.dbId);
    if (deleteSpecsError) {
      throw new Error(`Ne mogu da obrišem specifikacije za zastareli proizvod ${deleteEntry.slug}: ${deleteSpecsError.message}`);
    }

    const { error: deleteProductError } = await supabase.from('products').delete().eq('id', deleteEntry.dbId);
    if (deleteProductError) {
      throw new Error(`Ne mogu da obrišem zastareli proizvod ${deleteEntry.slug}: ${deleteProductError.message}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        applied: true,
        updatedCount: updates.length,
        insertedCount: inserts.length,
        deletedCount: deletes.length,
        affectedProductIds: Array.from(appliedProductIds),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
