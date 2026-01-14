// Check for products without images in gerflor-products-generated.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/data/gerflor-products-generated.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Extract products array
const productsMatch = content.match(/export const gerflor_products: Product\[\] = \[([\s\S]*?)\];/);
if (!productsMatch) {
  console.error('Could not find gerflor_products array');
  process.exit(1);
}

// Count products with empty or missing images
let productsWithoutImages = [];
let totalProducts = 0;
let currentProduct = null;
let inImagesArray = false;
let imagesCount = 0;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect product start
  if (line.trim().startsWith('{')) {
    currentProduct = { line: i + 1, images: [] };
    inImagesArray = false;
    imagesCount = 0;
  }
  
  // Detect images array start
  if (line.includes('images: [')) {
    inImagesArray = true;
    imagesCount = 0;
  }
  
  // Count image objects
  if (inImagesArray && line.includes('{')) {
    imagesCount++;
  }
  
  // Detect images array end
  if (inImagesArray && line.includes(']')) {
    inImagesArray = false;
    if (currentProduct) {
      currentProduct.imagesCount = imagesCount;
      if (imagesCount === 0) {
        productsWithoutImages.push(currentProduct);
      }
    }
  }
  
  // Detect product end
  if (line.trim() === '},' || line.trim() === '}') {
    if (currentProduct && currentProduct.imagesCount === undefined) {
      // Product ended without images array
      productsWithoutImages.push({ ...currentProduct, imagesCount: 0 });
    }
    totalProducts++;
    currentProduct = null;
  }
  
  // Try to extract product name
  if (currentProduct && line.includes("name:")) {
    const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
    if (nameMatch) {
      currentProduct.name = nameMatch[1];
    }
  }
  
  // Try to extract product id
  if (currentProduct && line.includes("id:")) {
    const idMatch = line.match(/id:\s*['"]([^'"]+)['"]/);
    if (idMatch) {
      currentProduct.id = idMatch[1];
    }
  }
}

console.log(`Total products: ${totalProducts}`);
console.log(`Products without images: ${productsWithoutImages.length}`);

if (productsWithoutImages.length > 0) {
  console.log('\nFirst 10 products without images:');
  productsWithoutImages.slice(0, 10).forEach(p => {
    console.log(`  - Line ${p.line}: ${p.id || 'unknown'} - ${p.name || 'unknown'}`);
  });
}
