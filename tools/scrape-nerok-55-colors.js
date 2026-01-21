const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const colorsJsonPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');

async function scrapeNerok55Colors() {
  console.log('🚀 Starting Nerok 55 color scraping...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to Nerok 55 collection page
    const collectionUrl = 'https://www.gerflor-cee.com/products/nerok-55';
    console.log(`📄 Navigating to: ${collectionUrl}`);
    await page.goto(collectionUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for colors section to load
    await page.waitForSelector('[data-testid="product-colors"], .product-colors, .colors-grid, [class*="color"]', { timeout: 10000 }).catch(() => {});
    
    // Scroll to load all colors
    console.log('📜 Scrolling to load all colors...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    // Extract all colors from the page
    console.log('🔍 Extracting colors...');
    const colors = await page.evaluate(() => {
      const colorElements = [];
      
      // Try multiple selectors to find color swatches
      const selectors = [
        '[data-testid="color-swatch"]',
        '.color-swatch',
        '[class*="color-swatch"]',
        '[class*="ColorSwatch"]',
        'a[href*="/products/nerok-55-"]',
        '[class*="product-card"]',
        '[class*="swatch"]'
      ];
      
      let elements = [];
      for (const selector of selectors) {
        elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) break;
      }
      
      // If no specific selectors work, look for links containing nerok-55 and a code
      if (elements.length === 0) {
        const allLinks = Array.from(document.querySelectorAll('a[href*="nerok-55"]'));
        elements = allLinks.filter(link => {
          const href = link.getAttribute('href');
          return href && /nerok-55-\d{4}/.test(href);
        });
      }
      
      elements.forEach((element, index) => {
        try {
          // Try to get href from link
          const link = element.closest('a') || element.querySelector('a') || element;
          const href = link.getAttribute('href') || link.href;
          
          if (!href || !href.includes('nerok-55')) return;
          
          // Extract code, name, and SKU from href
          // Format: /products/nerok-55-0476-noma-miel-28130476
          const match = href.match(/nerok-55-(\d{4})-([^-]+(?:-[^-]+)*)-(\d+)/);
          if (!match) return;
          
          const [, code, nameParts, sku] = match;
          const name = nameParts.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          ).join(' ');
          
          // Try to get image URL
          const img = element.querySelector('img') || link.querySelector('img');
          const imageUrl = img ? (img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src')) : null;
          
          colorElements.push({
            code: code,
            name: name.toUpperCase(),
            slug: `nerok-55-${code}-${nameParts}`,
            href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
            sku: sku,
            image_url: imageUrl,
            collection_slug: 'nerok-55',
            collection_name: 'Nerok 55'
          });
        } catch (e) {
          console.error('Error extracting color:', e);
        }
      });
      
      return colorElements;
    });
    
    console.log(`✅ Found ${colors.length} colors\n`);
    
    // Load existing data
    const existingData = JSON.parse(fs.readFileSync(colorsJsonPath, 'utf8'));
    const nerok55Collection = existingData.collections.find(c => c.slug === 'nerok-55');
    
    if (!nerok55Collection) {
      console.log('❌ Nerok 55 collection not found in JSON');
      await browser.close();
      return;
    }
    
    // Merge new colors with existing ones
    const existingCodes = new Set(nerok55Collection.colors.map(c => c.code));
    const newColors = colors.filter(c => !existingCodes.has(c.code));
    const updatedColors = [...nerok55Collection.colors];
    
    // Add new colors
    newColors.forEach(color => {
      updatedColors.push({
        code: color.code,
        name: color.name,
        slug: color.slug,
        href: color.href,
        sku: color.sku,
        collection_slug: color.collection_slug,
        collection_name: color.collection_name
      });
    });
    
    // Update collection
    nerok55Collection.colors = updatedColors;
    nerok55Collection.colorCount = updatedColors.length;
    
    // Update total colors
    existingData.totalColors = existingData.collections.reduce((sum, col) => sum + (col.colorCount || col.colors.length || 0), 0);
    existingData.generatedAt = new Date().toISOString();
    
    // Save updated JSON
    fs.writeFileSync(colorsJsonPath, JSON.stringify(existingData, null, 2));
    
    console.log(`📊 Summary:`);
    console.log(`   Existing colors: ${nerok55Collection.colors.length - newColors.length}`);
    console.log(`   New colors found: ${newColors.length}`);
    console.log(`   Total colors now: ${nerok55Collection.colors.length}`);
    console.log(`\n✅ Updated: ${colorsJsonPath}\n`);
    
    if (newColors.length > 0) {
      console.log('🆕 New colors added:');
      newColors.forEach(c => console.log(`   - ${c.code} ${c.name}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

scrapeNerok55Colors();
