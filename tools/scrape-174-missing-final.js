const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadImage(response.headers.location, filePath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function scrapeMissing174() {
  console.log('🚀 Scraping 174 missing colors...\n');

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const acceptCookies = async () => {
    const btn = page.locator('#onetrust-accept-btn-handler').first();
    if (await btn.count()) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  };

  const existingData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  const existingSlugs = new Set(existingData.colors.map(c => c.slug));

  const collections = [
    { url: 'https://www.gerflor-cee.com/products/premium-acoustic', slug: 'premium-acoustic', type: 'heterogeneous', expected: 29 },
    { url: 'https://www.gerflor-cee.com/products/premium-compact', slug: 'premium-compact', type: 'heterogeneous', expected: 81 },
    { url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order', slug: 'taralay-millenium-acoustic-order', type: 'heterogeneous', expected: 32 },
    { url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact', slug: 'taralay-millenium-compact', type: 'heterogeneous', expected: 32 }
  ];

  const newColors = [];

  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    console.log(`\n[${i + 1}/4] ${collection.slug} (očekujem ${collection.expected} boja)`);

    await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Try clicking "View all"
    const viewAllBtn = page.locator('a:has-text("View all"), button:has-text("View all")').first();
    if (await viewAllBtn.count() > 0 && await viewAllBtn.isVisible().catch(() => false)) {
      console.log('  Clicking "View all"...');
      await viewAllBtn.click();
      await page.waitForTimeout(2000);
    }

    // Click "Show more" if needed
    for (let j = 0; j < 20; j++) {
      const showMoreBtn = page.locator('button:has-text("Show more")').first();
      if (await showMoreBtn.count() === 0) break;
      const isVisible = await showMoreBtn.isVisible().catch(() => false);
      const isDisabled = await showMoreBtn.getAttribute('disabled').catch(() => null);
      if (isVisible && !isDisabled) {
        await showMoreBtn.click();
        await page.waitForTimeout(1000);
      } else break;
    }

    // Get all color links - try multiple selectors
    const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links.map(link => {
        const href = link.getAttribute('href');
        // Accept any link ending with 8+ digits (color products)
        if (!href || !href.includes('/products/') || !/\d{8,}$/.test(href)) return null;
        return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
      }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
    });

    console.log(`  Found ${colorLinks.length} color links (očekujem ${collection.expected})`);

    if (colorLinks.length === 0) {
      console.log('  ⚠️  Pokušavam alternativne selektore...');
      
      // Try clicking on color swatches directly
      const swatches = page.locator('[class*="color-swatch"], [class*="swatch"], [class*="color-item"]');
      const swatchCount = await swatches.count();
      console.log(`  Found ${swatchCount} color swatches`);
      
      // Extract links from swatches
      const swatchLinks = [];
      for (let s = 0; s < Math.min(swatchCount, collection.expected + 10); s++) {
        try {
          const swatch = swatches.nth(s);
          const link = await swatch.locator('a').first().getAttribute('href').catch(() => null);
          if (link) {
            const fullUrl = link.startsWith('http') ? link : `https://www.gerflor-cee.com${link}`;
            if (!swatchLinks.includes(fullUrl)) {
              swatchLinks.push(fullUrl);
            }
          }
        } catch (e) {}
      }
      
      colorLinks.push(...swatchLinks);
      console.log(`  Total after swatches: ${colorLinks.length}`);
    }

    if (colorLinks.length === 0) {
      console.log('  ❌ Ne mogu pronaći linkove');
      continue;
    }

    // Scrape each color
    for (let j = 0; j < colorLinks.length; j++) {
      const colorUrl = colorLinks[j];
      const urlSlug = colorUrl.split('/products/')[1]?.replace(/-\d{8,}$/, '') || null;
      
      if (!urlSlug || existingSlugs.has(urlSlug)) {
        process.stdout.write(`  [${j + 1}/${colorLinks.length}] ⏭️  skip\n`);
        continue;
      }

      process.stdout.write(`  [${j + 1}/${colorLinks.length}] `);

      try {
        await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await acceptCookies();
        await page.waitForTimeout(1500);

        const h1 = await page.locator('h1').first().textContent().catch(() => null);
        if (!h1) throw new Error('No h1');
        
        const parts = h1.trim().split(/\s+/);
        const code = parts[0];
        const name = parts.slice(1).join(' ');

        // Download image
        const cdnImgUrl = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
        let localImagePath = null;

        if (cdnImgUrl) {
          const imgPath = path.join('public/images/products/vinyl', collection.slug, urlSlug, `${code}-${urlSlug}.jpg`);
          await downloadImage(cdnImgUrl, imgPath).catch(() => {});
          if (fs.existsSync(imgPath)) {
            localImagePath = `/images/products/vinyl/${collection.slug}/${urlSlug}/${code}-${urlSlug}.jpg`;
          }
        }

        // Extract characteristics
        const chars = await page.$$eval('table, dl', (els) => {
          const data = {};
          els.forEach(el => {
            if (el.tagName === 'TABLE') {
              el.querySelectorAll('tr').forEach(row => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length >= 2) {
                  const k = cells[0].textContent?.trim();
                  const v = cells[1].textContent?.trim();
                  if (k && v) data[k] = v;
                }
              });
            } else if (el.tagName === 'DL') {
              const items = el.querySelectorAll('dt, dd');
              for (let idx = 0; idx < items.length - 1; idx += 2) {
                if (items[idx].tagName === 'DT' && items[idx + 1].tagName === 'DD') {
                  const k = items[idx].textContent?.trim();
                  const v = items[idx + 1].textContent?.trim();
                  if (k && v) data[k] = v;
                }
              }
            }
          });
          return data;
        }).catch(() => ({}));

        const dim = chars['Dimension'] || (chars['Width of sheet'] && chars['Length of sheet'] 
          ? `${chars['Width of sheet']} X ${chars['Length of sheet']}` : null);
        const thick = chars['Overall thickness'] || null;
        const format = chars['Format details'] || chars['Format'] || null;

        const normChars = {};
        if (dim) normChars['Dimenzije'] = dim;
        if (thick) normChars['Ukupna debljina'] = thick;
        Object.entries(chars).forEach(([k, v]) => {
          if (!['Dimenzije', 'Ukupna debljina', 'Dimension', 'Overall thickness', 'Width of sheet', 'Length of sheet'].includes(k) &&
              !(k === 'Format details' && format)) {
            normChars[k] = v;
          }
        });

        const colorData = {
          collection: collection.slug,
          collection_name: collection.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          collection_slug: collection.slug,
          type: collection.type,
          code: code,
          name: name,
          full_name: h1.trim(),
          slug: urlSlug,
          image_url: localImagePath || cdnImgUrl,
          texture_url: null,
          image_count: (localImagePath || cdnImgUrl) ? 1 : 0,
          dimension: dim,
          format: format,
          overall_thickness: thick,
          description: 'See full description',
          characteristics: normChars,
          welding_rod: chars['WELDING ROD REF.'] || chars['Welding rod ref.'] || null
        };

        newColors.push(colorData);
        existingSlugs.add(urlSlug);
        process.stdout.write(`✓ ${code}\n`);
      } catch (error) {
        process.stdout.write(`✗\n`);
      }
    }

    console.log(`  ✅ ${collection.slug}: ${colorLinks.length} boja pronađeno`);
  }

  await browser.close();

  // Merge
  const allColors = [...existingData.colors, ...newColors];
  const outputData = {
    total: allColors.length,
    homogeneous: allColors.filter(c => c.type === 'homogeneous').length,
    heterogeneous: allColors.filter(c => c.type === 'heterogeneous').length,
    colors: allColors,
    metadata: {
      scrapedAt: new Date().toISOString(),
      version: 'FINAL-COMPLETE'
    }
  };

  fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`\n✅ ZAVRŠENO!`);
  console.log(`   Dodato: ${newColors.length} novih boja`);
  console.log(`   Total: ${outputData.total} / 908`);
  console.log(`   Homogeneous: ${outputData.homogeneous}`);
  console.log(`   Heterogeneous: ${outputData.heterogeneous}`);

  return outputData;
}

scrapeMissing174().catch(console.error);
