import fs from 'fs';
import path from 'path';
import { Product } from '@/types';
import * as loader from '@/lib/utils/productDataLoader';
import { products as mockDataProducts } from '@/lib/data/mock-data';
import { tarkettProducts } from '@/lib/data/tarkett-products';
import { PARKET_HEADER_COLLECTIONS } from '@/lib/data/parket-collection-mapping';

type BasicIssue = {
    id: string;
    name: string;
};

type LowSpecIssue = BasicIssue & {
    count: number;
};

type CollectionDrivenLowSpecIssue = LowSpecIssue & {
    kind: 'bloq-collection' | 'parket-collection' | 'parket-variant' | 'lvt-variant';
    reason: string;
};

type HealthIssues = {
    missingImage: BasicIssue[];
    missingDescription: BasicIssue[];
    lowSpecs: LowSpecIssue[];
    collectionDrivenLowSpecs: CollectionDrivenLowSpecIssue[];
};

function countMeaningfulSpecs(product: Product) {
    return (product.specs || []).filter((spec) =>
        spec &&
        String(spec.value || '').trim().length > 0 &&
        spec.key !== 'collection' &&
        !String(spec.key || '').startsWith('__')
    ).length;
}

function productHealthScore(product: Product) {
    const hasImage = product.images?.some((image) => image.url && image.url !== '/images/placeholder.svg') ? 1 : 0;
    const hasDescription = product.description?.trim().length >= 20 || product.shortDescription?.trim().length >= 20 ? 1 : 0;

    return countMeaningfulSpecs(product) * 10 + hasImage * 5 + hasDescription * 3;
}

function dedupeProductsForHealth(products: Product[]) {
    const byCatalogKey = new Map<string, Product>();

    for (const product of products) {
        const key = product.slug || product.id;
        const existing = byCatalogKey.get(key);

        if (!existing || productHealthScore(product) > productHealthScore(existing)) {
            byCatalogKey.set(key, product);
        }
    }

    return Array.from(byCatalogKey.values());
}

function getCollectionDrivenLowSpecInfo(product: Product): CollectionDrivenLowSpecIssue | null {
    const name = product.name || product.slug;
    const count = countMeaningfulSpecs(product);

    if (product.categoryId === '4' && product.id.startsWith('bloq-coll-')) {
        return {
            id: product.id,
            name,
            count,
            kind: 'bloq-collection',
            reason: 'BLOQ collection page shows color-driven specs, so the base collection card intentionally stays slim.',
        };
    }

    if (product.categoryId === '6' && !product.id.startsWith('lvt-coll-') && !product.sku?.startsWith('LVT-COLL')) {
        return {
            id: product.id,
            name,
            count,
            kind: 'lvt-variant',
            reason: 'LVT variant routes use collection and selected-color context for visible specs, so the base variant entry can stay slim.',
        };
    }

    if (product.categoryId === '3' && product.sku && !product.sku.startsWith('PARKET-')) {
        return {
            id: product.id,
            name,
            count,
            kind: 'parket-variant',
            reason: 'Parket variant redirects to its collection page where visible specs come from collection and selected color context.',
        };
    }

    if (
        product.categoryId === '3' &&
        product.sku?.startsWith('PARKET-') &&
        (PARKET_HEADER_COLLECTIONS as readonly string[]).includes(product.name)
    ) {
        return {
            id: product.id,
            name,
            count,
            kind: 'parket-collection',
            reason: 'Parket collection header relies on variant-driven specs, so the base collection entry can legitimately stay minimal.',
        };
    }

    return null;
}

async function runHealthCheck() {
    console.log('=== PODOVI.ONLINE PRODUCT HEALTH CHECK ===\n');
    console.log('Loading product data...\n');

    try {
        let allProducts: Product[] = [];
        allProducts.push(...loader.getAllGerflorProducts());
        allProducts.push(...loader.getAllBloqCarpetProducts());
        allProducts.push(...loader.getAllTarkettLVTProducts());
        allProducts.push(...loader.getTarkettLVTCollections());
        allProducts.push(...loader.getAllDekingProducts());
        allProducts.push(...loader.getAllTechemProducts());
        allProducts.push(...loader.getVinylCollectionProducts());
        allProducts.push(...loader.getEsdCollectionProducts());

        if (mockDataProducts) {
            const existingIds = new Set(allProducts.map(p => p.id));
            const newMockProducts = mockDataProducts.filter((p: any) => !existingIds.has(p.id));
            allProducts.push(...newMockProducts);
        }

        if (tarkettProducts) {
            const existingIds = new Set(allProducts.map(p => p.id));
            const newTarkettProducts = tarkettProducts.filter((p: any) => !existingIds.has(p.id));
            allProducts.push(...newTarkettProducts);
        }

        allProducts = dedupeProductsForHealth(allProducts);

        console.log(`Total unique products loaded: ${allProducts.length}\n`);

        const issues: HealthIssues = {
            missingImage: [],
            missingDescription: [],
            lowSpecs: [],
            collectionDrivenLowSpecs: [],
        };

        allProducts.forEach(product => {
            const name = product.name || product.slug;

            // Check images
            if (!product.images || product.images.length === 0 || product.images[0].url === '/images/placeholder.svg') {
                issues.missingImage.push({ id: product.id, name });
            }

            // Check description
            if (!product.description || product.description.trim().length < 20) {
                if (!product.shortDescription || product.shortDescription.trim().length < 20) {
                    issues.missingDescription.push({ id: product.id, name });
                }
            }

            // Check specs
            const specsCount = countMeaningfulSpecs(product);
            if (specsCount < 3) {
                const collectionDrivenInfo = getCollectionDrivenLowSpecInfo(product);
                if (collectionDrivenInfo) {
                    issues.collectionDrivenLowSpecs.push(collectionDrivenInfo);
                } else {
                    issues.lowSpecs.push({ id: product.id, name, count: specsCount });
                }
            }
        });

        console.log('--- HEALTH REPORT ---');
        const actionableProblemIds = new Set([
            ...issues.missingImage.map(i => i.id),
            ...issues.missingDescription.map(i => i.id),
            ...issues.lowSpecs.map(i => i.id)
        ]);

        console.log(`🟢 Healthy Products: ${allProducts.length - actionableProblemIds.size}`);
        console.log(`🔴 Products with actionable issues: ${actionableProblemIds.size}`);
        console.log(`ℹ️ Collection-driven products with lean base specs: ${issues.collectionDrivenLowSpecs.length}\n`);

        console.log(`⚠️ Missing or Placeholder Images (${issues.missingImage.length}):`);
        if (issues.missingImage.length > 0) {
            issues.missingImage.slice(0, 10).forEach(i => console.log(`   - [${i.id}] ${i.name}`));
            if (issues.missingImage.length > 10) console.log(`   ...and ${issues.missingImage.length - 10} more.`);
        } else {
            console.log('   Svi proizvodi imaju slike. Odlično!');
        }
        console.log('');

        console.log(`⚠️ Missing Description (< 20 chars) (${issues.missingDescription.length}):`);
        if (issues.missingDescription.length > 0) {
            issues.missingDescription.slice(0, 10).forEach(i => console.log(`   - [${i.id}] ${i.name}`));
            if (issues.missingDescription.length > 10) console.log(`   ...and ${issues.missingDescription.length - 10} more.`);
        } else {
            console.log('   Svi proizvodi imaju opise. Odlično!');
        }
        console.log('');

        console.log(`⚠️ Less than 3 Specifications (${issues.lowSpecs.length}):`);
        if (issues.lowSpecs.length > 0) {
            issues.lowSpecs.slice(0, 10).forEach(i => console.log(`   - [${i.id}] ${i.name} (${i.count} specs)`));
            if (issues.lowSpecs.length > 10) console.log(`   ...and ${issues.lowSpecs.length - 10} more.`);
        } else {
            console.log('   Svi proizvodi imaju bar 3 specifikacije. Odlično!');
        }
        console.log('');

        console.log(`ℹ️ Collection-driven Low Spec Entries (${issues.collectionDrivenLowSpecs.length}):`);
        if (issues.collectionDrivenLowSpecs.length > 0) {
            const grouped = issues.collectionDrivenLowSpecs.reduce<Record<string, number>>((acc, issue) => {
                acc[issue.kind] = (acc[issue.kind] || 0) + 1;
                return acc;
            }, {});
            const labels: Record<CollectionDrivenLowSpecIssue['kind'], string> = {
                'bloq-collection': 'BLOQ collection pages',
                'lvt-variant': 'LVT variant redirects',
                'parket-collection': 'Parket collection headers',
                'parket-variant': 'Parket variant redirects',
            };

            (Object.entries(grouped) as Array<[CollectionDrivenLowSpecIssue['kind'], number]>).forEach(([kind, count]) => {
                console.log(`   - ${labels[kind]}: ${count}`);
            });
            console.log('   Visible specs on these pages come from collection/color context, so they are reported separately.');
        } else {
            console.log('   Nema collection-driven izuzetaka.');
        }
        console.log('');

        // Save report
        const reportPath = path.join(__dirname, 'health-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
        console.log(`Full report saved to: scripts/health-report.json`);

    } catch (err) {
        console.error('Failed to run health check:', err);
    }
}

runHealthCheck();
