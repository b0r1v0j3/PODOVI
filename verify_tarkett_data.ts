
import { getAllTarkettLVTProducts, getTarkettLVTCollections } from './lib/utils/productDataLoader';

// Mock TARKETT_COLLECTION_NAMES since it's used in the loader
// (In a real run this would be imported, but for this script we just want to run the loader logic)
// effectively we are running the loader code. 

// Actually, let's just use the existing loader file directly if possible, 
// but since it's TS, I need to use ts-node or similar. 
// Easier to just read the file and eval the logic or simple: 
// create a small test script that imports the actual file.

// We will use a script that just imports the loader and prints sample data.
console.log("Checking Tarkett Data...");

const products = getAllTarkettLVTProducts();
console.log(`Total Products: ${products.length}`);

const sampleProduct = products.find(p => p.name.includes("Essence") || p.slug.includes("essence"));
console.log("\nSample Product (Essence):");
console.log("Name:", sampleProduct?.name);
console.log("Slug:", sampleProduct?.slug);
console.log("Docs:", sampleProduct?.documents?.length);
if (sampleProduct?.documents?.length) {
    console.log("First Doc:", sampleProduct.documents[0]);
}

const collections = getTarkettLVTCollections();
console.log(`\nTotal Collections: ${collections.length}`);

const essenceCol = collections.find(c => c.slug.includes("essence"));
console.log("\nCollection (Essence):");
console.log("Name:", essenceCol?.name);
console.log("Specs:", JSON.stringify(essenceCol?.specs, null, 2));
console.log("Docs:", essenceCol?.documents?.length);
if (essenceCol?.documents?.length) {
    console.log("First Col Doc:", essenceCol.documents[0]);
}
