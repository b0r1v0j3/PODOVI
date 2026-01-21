const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.gerflor-cee.com/category/heterogeneous-rolls';

async function watchAndExtract() {
  console.log('🚀 Otvorio sam browser. Ti listaj i klikaj "Show more", ja vadim linkove...\n');
  console.log('Kada završiš sa svim stranicama, pritisni ENTER u terminalu.\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  
  const allColors = [];
  const seenUrls = new Set();
  
  // Periodically extract all visible links
  const extractInterval = setInterval(async () => {
    try {
      const pageColors = await page.evaluate(() => {
        const colors = [];
        const seen = new Set();
        
        const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
        
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (!href) return;
          
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          
          const match = fullUrl.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
          
          if (match && !seen.has(fullUrl)) {
            seen.add(fullUrl);
            
            const [, collectionSlug, code, namePart, sku] = match;
            const name = namePart.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            colors.push({
              code: code,
              name: name.toUpperCase(),
              slug: `${collectionSlug}-${code}-${namePart}`,
              href: fullUrl,
              sku: sku,
              collection_slug: collectionSlug,
              collection_name: collectionSlug.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            });
          }
        });
        
        return colors;
      });
      
      // Add new colors
      let newCount = 0;
      pageColors.forEach(color => {
        if (!seenUrls.has(color.href)) {
          seenUrls.add(color.href);
          allColors.push(color);
          newCount++;
        }
      });
      
      if (newCount > 0) {
        console.log(`  ✓ Pronađeno ${newCount} novih boja (${allColors.length} ukupno)`);
      }
      
    } catch (e) {
      // Page might be navigating, ignore
    }
  }, 2000); // Check every 2 seconds
  
  try {
    // Start with page 1
    console.log('Opening page 1...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Click Colors button
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
      if (colorButton) {
        await colorButton.click();
        console.log('✓ Clicked colors button');
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // Continue
    }
    
    console.log('\n👆 Sada listaj kroz stranice i klikaj "Show more". Ja vadim linkove...\n');
    console.log('Kada završiš sa svim stranicama, pritisni ENTER u terminalu.\n');
    
    // Wait for user to press Enter
    await new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Pritisni ENTER kada završiš...\n', () => {
        rl.close();
        clearInterval(extractInterval);
        resolve();
      });
    });
    
    console.log(`\n\n✅ Završeno! Ekstraktovano ${allColors.length} boja\n`);
    
    // Group by collection
    const collectionsMap = new Map();
    
    allColors.forEach(color => {
      if (!collectionsMap.has(color.collection_slug)) {
        collectionsMap.set(color.collection_slug, {
          name: color.collection_name,
          slug: color.collection_slug,
          url: `https://www.gerflor-cee.com/products/${color.collection_slug}`,
          colors: []
        });
      }
      collectionsMap.get(color.collection_slug).colors.push(color);
    });
    
    const collections = Array.from(collectionsMap.values()).map(col => ({
      ...col,
      colorCount: col.colors.length
    }));
    
    collections.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Kolekcije:\n`);
    collections.forEach(col => {
      console.log(`  ${col.name}: ${col.colorCount} colors`);
    });
    
    const totalColors = collections.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n📈 Total: ${totalColors} colors\n`);
    
    // Update linoleum file (for heterogeni vinil)
    const rootDir = path.join(__dirname, '..');
    const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
    const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
    
    collections.forEach(col => {
      const existingCol = linoleumData.collections.find(c => c.slug === col.slug);
      if (existingCol) {
        existingCol.colors = col.colors;
        existingCol.colorCount = col.colorCount;
        console.log(`  ✓ Updated ${col.name}: ${col.colorCount} colors`);
      }
    });
    
    linoleumData.totalColors = linoleumData.collections.reduce((sum, col) => sum + (col.colorCount || 0), 0);
    linoleumData.generatedAt = new Date().toISOString();
    
    fs.writeFileSync(linoleumPath, JSON.stringify(linoleumData, null, 2));
    console.log(`\n💾 Updated: ${linoleumPath}`);
    console.log(`📊 Total: ${linoleumData.totalColors} colors`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    clearInterval(extractInterval);
    console.log('\n\nPritisni ENTER da zatvorim browser...');
    await new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
    
    await browser.close();
  }
}

watchAndExtract().catch(console.error);
