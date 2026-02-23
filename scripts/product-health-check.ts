import fs from 'fs';
import path from 'path';
import { Product } from '@/types';
import * as loader from '@/lib/utils/productDataLoader';
import { products as mockDataProducts } from '@/lib/data/mock-data';
import { tarkettProducts } from '@/lib/data/tarkett-products';

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

        console.log(`Total unique products loaded: ${allProducts.length}\n`);

        let issues: { missingImage: any[], missingDescription: any[], lowSpecs: any[] } = {
            missingImage: [],
            missingDescription: [],
            lowSpecs: [],
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
            if (!product.specs || product.specs.length < 3) {
                issues.lowSpecs.push({ id: product.id, name, count: product.specs ? product.specs.length : 0 });
            }
        });

        console.log('--- HEALTH REPORT ---');
        const problemIds = new Set([
            ...issues.missingImage.map(i => i.id),
            ...issues.missingDescription.map(i => i.id),
            ...issues.lowSpecs.map(i => i.id)
        ]);

        console.log(`🟢 Healthy Products: ${allProducts.length - problemIds.size}`);
        console.log(`🔴 Products with issues: ${problemIds.size}\n`);

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

        // Save report
        const reportPath = path.join(__dirname, 'health-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
        console.log(`Full report saved to: scripts/health-report.json`);

    } catch (err) {
        console.error('Failed to run health check:', err);
    }
}

runHealthCheck();
