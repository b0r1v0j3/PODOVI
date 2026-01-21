const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const collections = [
  {
    name: 'Premium Acoustic',
    slug: 'premium-acoustic',
    url: 'https://www.gerflor-cee.com/products/premium-acoustic'
  },
  {
    name: 'Premium Compact',
    slug: 'premium-compact',
    url: 'https://www.gerflor-cee.com/products/premium-compact'
  },
  {
    name: 'Taralay Millenium Acoustic Order',
    slug: 'taralay-millenium-acoustic-order',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order'
  },
  {
    name: 'Taralay Millenium Compact',
    slug: 'taralay-millenium-compact',
    url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact'
  }
];

async function interactiveScrape() {
  console.log('🚀 Starting interactive scraping...\n');
  console.log('Otvorio sam browser. Klikni na slike boja, ja ću pratiti i ekstraktovati podatke.\n');
  console.log('Kada završiš sa jednom kolekcijom, pritisni ENTER u terminalu da pređem na sledeću.\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 100 
  });
  
  const allColors = [];
  
  try {
    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${i + 1}/${collections.length}] ${collection.name}`);
      console.log(`${'='.repeat(60)}\n`);
      
      const page = await browser.newPage();
      
      // Listen for navigation events
      const colors = [];
      const seenUrls = new Set();
      
      page.on('framenavigated', async (frame) => {
        if (frame === page.mainFrame()) {
          const url = frame.url();
          
          // Check if this is a color page (has 4-digit code in URL)
          const match = url.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
          
          if (match && !seenUrls.has(url)) {
            seenUrls.add(url);
            
            const [, slug, code, namePart, sku] = match;
            
            // Verify it's from the current collection
            if (slug === collection.slug || url.includes(collection.slug)) {
              const name = namePart.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              
              const colorData = {
                code: code,
                name: name.toUpperCase(),
                slug: `${collection.slug}-${code}-${namePart}`,
                href: url,
                sku: sku,
                collection_slug: collection.slug,
                collection_name: collection.slug.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              };
              
              colors.push(colorData);
              allColors.push(colorData);
              
              console.log(`  ✓ Extracted: ${code} ${name.toUpperCase()} (${colors.length} total)`);
            }
          }
        }
      });
      
      // Navigate to collection page
      console.log(`Opening: ${collection.url}`);
      await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      
      // Click Colors button if exists
      try {
        const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors"), button:has-text("Boje"), a:has-text("Boje")');
        if (colorButton) {
          await colorButton.click();
          console.log('  ✓ Clicked colors button');
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        // Continue
      }
      
      console.log('\n  👆 Sada klikni na slike boja. Ja pratim navigaciju i ekstraktujem podatke...');
      console.log('  Kada završiš, pritisni ENTER u terminalu.\n');
      
      // Wait for user to press Enter
      await new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('Pritisni ENTER kada završiš sa ovom kolekcijom...\n', () => {
          rl.close();
          resolve();
        });
      });
      
      console.log(`\n  ✅ Collected ${colors.length} colors from ${collection.name}`);
      
      // Update collection data
      collection.colors = colors;
      collection.colorCount = colors.length;
      
      await page.close();
    }
    
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ Scraping complete!');
    console.log(`${'='.repeat(60)}\n`);
    
    // Group colors by collection
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
    
    const collectionsArray = Array.from(collectionsMap.values()).map(col => ({
      ...col,
      colorCount: col.colors.length
    }));
    
    console.log(`📊 Summary:\n`);
    collectionsArray.forEach(col => {
      console.log(`  ${col.name}: ${col.colorCount} colors`);
    });
    
    const totalColors = collectionsArray.reduce((sum, col) => sum + col.colorCount, 0);
    console.log(`\n📈 Total: ${totalColors} colors\n`);
    
    // Update linoleum file
    const rootDir = path.join(__dirname, '..');
    const linoleumPath = path.join(rootDir, 'public', 'data', 'gerflor_linoleum_colors_complete.json');
    const linoleumData = JSON.parse(fs.readFileSync(linoleumPath, 'utf8'));
    
    collectionsArray.forEach(col => {
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
    console.log(`📊 Total colors: ${linoleumData.totalColors}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
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

interactiveScrape().catch(console.error);
