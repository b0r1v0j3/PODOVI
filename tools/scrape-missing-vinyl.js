const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeMissing() {
  console.log('🔍 Checking for missing vinyl colors...\n');

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Load existing data
  const existingData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  const existingSlugs = new Set(existingData.colors.map(c => c.slug));
  const existingUrls = new Set(existingData.colors.map(c => {
    // Reconstruct URL from slug
    const parts = c.slug.split('-');
    if (parts.length >= 3) {
      return `https://www.gerflor-cee.com/products/${c.slug}-${c.code.padStart(8, '0')}`;
    }
    return null;
  }).filter(Boolean));

  console.log(`Existing colors: ${existingData.total}`);
  console.log(`Expected: 908`);
  console.log(`Missing: ${908 - existingData.total}\n`);

  const acceptCookies = async () => {
    const selectors = ['#onetrust-accept-btn-handler', 'button:has-text("Accept")', 'button:has-text("Prihvati")'];
    for (const selector of selectors) {
      const btn = page.locator(selector).first();
      if (await btn.count()) {
        try {
          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(500);
          return true;
        } catch (error) {}
      }
    }
    return false;
  };

  const extractColorData = async (page, type, collectionSlug) => {
    try {
      const productName = await page.locator('h1').first().textContent().catch(() => null);
      if (!productName) return null;
      
      const nameParts = productName.trim().split(/\s+/);
      const code = nameParts[0] || null;
      const name = nameParts.slice(1).join(' ') || null;

      const url = page.url();
      const slugMatch = url.match(/\/products\/([^?]+)/);
      const fullSlug = slugMatch ? slugMatch[1] : null;
      const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;

      const mainImage = await page.locator('[class*="product-image"] img, .hero img, img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);

      let description = null;
      const descEl = page.locator('[class*="description"], [class*="product-description"]').first();
      if (await descEl.count() > 0) {
        description = await descEl.textContent().catch(() => null);
      }

      const characteristics = await page.$$eval('table, dl', (elements) => {
        const data = {};
        elements.forEach(el => {
          if (el.tagName === 'TABLE') {
            const rows = el.querySelectorAll('tr');
            rows.forEach(row => {
              const cells = row.querySelectorAll('td, th');
              if (cells.length >= 2) {
                const key = cells[0].textContent?.trim();
                const value = cells[1].textContent?.trim();
                if (key && value) data[key] = value;
              }
            });
          } else if (el.tagName === 'DL') {
            const items = el.querySelectorAll('dt, dd');
            for (let i = 0; i < items.length - 1; i += 2) {
              if (items[i].tagName === 'DT' && items[i + 1].tagName === 'DD') {
                const key = items[i].textContent?.trim();
                const value = items[i + 1].textContent?.trim();
                if (key && value) data[key] = value;
              }
            }
          }
        });
        return data;
      }).catch(() => ({}));

      const dimension = characteristics['Dimension'] || 
        (characteristics['Width of sheet'] && characteristics['Length of sheet'] 
          ? `${characteristics['Width of sheet']} X ${characteristics['Length of sheet']}`
          : null);
      const format = characteristics['Format details'] || characteristics['Format'] || null;
      const overallThickness = characteristics['Overall thickness'] || null;
      const weldingRod = characteristics['WELDING ROD REF.'] || characteristics['Welding rod ref.'] || null;

      const normalizedCharacteristics = {};
      if (dimension) normalizedCharacteristics['Dimenzije'] = dimension;
      if (overallThickness) normalizedCharacteristics['Ukupna debljina'] = overallThickness;
      
      Object.entries(characteristics).forEach(([key, value]) => {
        if (key !== 'Dimenzije' && key !== 'Ukupna debljina' && 
            key !== 'Dimension' && key !== 'Overall thickness' &&
            key !== 'Width of sheet' && key !== 'Length of sheet' &&
            !(key === 'Format details' && format)) {
          normalizedCharacteristics[key] = value;
        }
      });

      const collectionName = collectionSlug 
        ? collectionSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : null;

      return {
        collection: collectionSlug || null,
        collection_name: collectionName,
        collection_slug: collectionSlug || null,
        type: type,
        code: code || null,
        name: name || null,
        full_name: productName.trim(),
        slug: slug || null,
        image_url: mainImage || null,
        texture_url: null,
        image_count: mainImage ? 1 : 0,
        dimension: dimension || null,
        format: format || null,
        overall_thickness: overallThickness || null,
        description: description?.trim() || null,
        characteristics: normalizedCharacteristics,
        welding_rod: weldingRod || null
      };
    } catch (error) {
      console.error(`Error extracting: ${error.message}`);
      return null;
    }
  };

  const configs = [
    { type: 'homogeneous', url: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles' },
    { type: 'heterogeneous', url: 'https://www.gerflor-cee.com/category/heterogeneous-rolls' }
  ];

  const newColors = [];

  for (const config of configs) {
    console.log(`\n=== ${config.type.toUpperCase()} ===`);
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Click "Show more"
    let clicks = 0;
    while (clicks < 50) {
      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) break;
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.getAttribute('disabled').catch(() => null);
      if (isVisible && !isDisabled) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await page.waitForTimeout(1000);
        clicks++;
      } else {
        break;
      }
    }

    const collectionLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links
        .map(link => {
          const href = link.getAttribute('href');
          if (!href) return null;
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          if (/\d{8,}$/.test(href)) return null;
          return fullUrl;
        })
        .filter(Boolean)
        .filter(url => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
    });

    console.log(`Found ${collectionLinks.length} collections`);

    for (let i = 0; i < collectionLinks.length; i++) {
      const collectionUrl = collectionLinks[i];
      const collectionSlug = collectionUrl.split('/products/')[1]?.split('?')[0] || '';
      
      process.stdout.write(`\n[${i + 1}/${collectionLinks.length}] ${collectionSlug}... `);

      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links
          .map(link => {
            const href = link.getAttribute('href');
            const text = link.textContent?.trim() || '';
            if (!href || !href.includes('/products/')) return null;
            const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
            if (/\d{8,}$/.test(href) && text.toLowerCase().includes('view product')) {
              return fullUrl;
            }
            return null;
          })
          .filter(Boolean)
          .filter(url => {
            if (seen.has(url)) return false;
            seen.add(url);
            return true;
          });
      });

      process.stdout.write(`Found ${colorLinks.length} colors\n`);

      // Check and scrape missing colors
      let foundNew = 0;
      for (let j = 0; j < colorLinks.length; j++) {
        const colorUrl = colorLinks[j];
        
        // Check if already exists
        if (existingUrls.has(colorUrl)) {
          continue;
        }

        // Extract slug from URL to double-check
        const slugMatch = colorUrl.match(/\/products\/([^?]+)/);
        const fullSlug = slugMatch ? slugMatch[1] : null;
        const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;
        
        if (slug && existingSlugs.has(slug)) {
          continue;
        }

        // This is a new color - scrape it
        process.stdout.write(`    [${j + 1}/${colorLinks.length}] `);
        
        try {
          await page.goto(colorUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await acceptCookies();
          await page.waitForTimeout(800);

          const colorData = await extractColorData(page, config.type, collectionSlug);
          if (colorData && colorData.code && colorData.slug) {
            newColors.push(colorData);
            existingSlugs.add(colorData.slug);
            existingUrls.add(colorUrl);
            foundNew++;
            process.stdout.write(`✓ ${colorData.code}\n`);
          } else {
            process.stdout.write(`✗ Failed\n`);
          }
        } catch (error) {
          process.stdout.write(`✗ Error\n`);
        }
      }

      if (foundNew > 0) {
        console.log(`  ✅ Added ${foundNew} new colors`);
      }
    }
  }

  await browser.close();

  // Merge with existing
  const allColors = [...existingData.colors, ...newColors];
  const homogeneous = allColors.filter(c => c.type === 'homogeneous').length;
  const heterogeneous = allColors.filter(c => c.type === 'heterogeneous').length;

  const outputData = {
    total: allColors.length,
    homogeneous: homogeneous,
    heterogeneous: heterogeneous,
    colors: allColors,
    metadata: {
      scrapedAt: new Date().toISOString(),
      version: '2.1',
      added: newColors.length
    }
  };

  fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`\n✅ Complete!`);
  console.log(`   Total colors: ${outputData.total}`);
  console.log(`   Homogeneous: ${homogeneous}`);
  console.log(`   Heterogeneous: ${heterogeneous}`);
  console.log(`   New colors added: ${newColors.length}`);
  console.log(`   Still missing: ${908 - outputData.total}`);

  return outputData;
}

scrapeMissing().catch(console.error);
