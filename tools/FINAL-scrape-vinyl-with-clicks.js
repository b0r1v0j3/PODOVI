const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const CHECKPOINT_FILE = path.join(__dirname, '../tmp/vinyl-checkpoint.json');
const OUTPUT_FILE = path.join(__dirname, '../public/data/vinyl_colors_complete.json');
const IMAGES_DIR = path.join(__dirname, '../public/images/products/vinyl');

function saveCheckpoint(data) {
  fs.mkdirSync(path.dirname(CHECKPOINT_FILE), { recursive: true });
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function finalScrape() {
  console.log('🚀 FINAL VINYL SCRAPER - SA KLIKTANJEM NA DOWNLOAD I .JPG!\n');

  const browser = await chromium.launch({ 
    headless: false, 
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const checkpoint = loadCheckpoint() || { processedColors: [] };
  const allColors = [];
  const processedSlugs = new Set(checkpoint.processedColors || []);

  const acceptCookies = async () => {
    const btn = page.locator('#onetrust-accept-btn-handler').first();
    if (await btn.count()) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  };

  const configs = [
    { type: 'homogeneous', url: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles' },
    { type: 'heterogeneous', url: 'https://www.gerflor-cee.com/category/heterogeneous-rolls' }
  ];

  for (const config of configs) {
    console.log(`\n=== ${config.type.toUpperCase()} ===`);
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Click "Show more"
    for (let i = 0; i < 50; i++) {
      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) break;
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible && !await btn.getAttribute('disabled')) {
        await btn.click();
        await page.waitForTimeout(1000);
      } else break;
    }

    const collectionLinks = await page.$$eval('a[href*="/products/"]', (links) => {
      const seen = new Set();
      return links.map(link => {
        const href = link.getAttribute('href');
        if (!href || /\d{8,}$/.test(href)) return null;
        return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
      }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
    });

    console.log(`Found ${collectionLinks.length} collections\n`);

    for (let i = 0; i < collectionLinks.length; i++) {
      const collectionUrl = collectionLinks[i];
      const collectionSlug = collectionUrl.split('/products/')[1]?.split('?')[0] || '';
      
      console.log(`[${i + 1}/${collectionLinks.length}] ${collectionSlug}`);

      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links.map(link => {
          const href = link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          if (!href || !text.toLowerCase().includes('view product') || !/\d{8,}$/.test(href)) return null;
          return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
      });

      console.log(`  ${colorLinks.length} colors`);

      for (let j = 0; j < colorLinks.length; j++) {
        const colorUrl = colorLinks[j];
        const urlSlug = colorUrl.split('/products/')[1]?.replace(/-\d{8,}$/, '') || '';
        
        if (processedSlugs.has(urlSlug)) {
          process.stdout.write(`  [${j + 1}/${colorLinks.length}] ⏭️  skip\n`);
          continue;
        }

        process.stdout.write(`  [${j + 1}/${colorLinks.length}] `);

        try {
          await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
          await acceptCookies();
          await page.waitForTimeout(2000);

          // Extract basic info
          const h1 = await page.locator('h1').first().textContent().catch(() => null);
          if (!h1) throw new Error('No h1');
          
          const parts = h1.trim().split(/\s+/);
          const code = parts[0];
          const name = parts.slice(1).join(' ');

          // ===== DOWNLOAD IMAGE (KLIK NA DOWNLOAD PA .JPG) =====
          let localImagePath = null;
          
          // Find download icon button (usually in color swatch area)
          const downloadBtnSelectors = [
            'button[aria-label*="download" i]',
            'button[aria-label*="Download" i]',
            'button[title*="download" i]',
            'button:has(svg) >> nth=0', // First button with SVG (usually download icon)
            '[class*="color-swatch"] button',
            '[class*="swatch"] button >> nth=0',
            '[class*="download"]'
          ];

          let downloadClicked = false;
          for (const selector of downloadBtnSelectors) {
            const btn = page.locator(selector).first();
            if (await btn.count() > 0) {
              const isVisible = await btn.isVisible().catch(() => false);
              if (isVisible) {
                try {
                  await btn.scrollIntoViewIfNeeded();
                  await btn.click();
                  await page.waitForTimeout(1000);
                  downloadClicked = true;
                  break;
                } catch (e) {}
              }
            }
          }

          if (downloadClicked) {
            // Look for .JPG button
            const jpgBtnSelectors = [
              'button:has-text(".JPG")',
              'button:has-text("JPG")',
              'a:has-text(".JPG")',
              'a:has-text("JPG")',
              'button[aria-label*="jpg" i]',
              'button[aria-label*="JPG" i]',
              '[class*="jpg"]'
            ];

            for (const selector of jpgBtnSelectors) {
              const jpgBtn = page.locator(selector).first();
              if (await jpgBtn.count() > 0) {
                const isVisible = await jpgBtn.isVisible().catch(() => false);
                if (isVisible) {
                  try {
                    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
                    await jpgBtn.click();
                    await page.waitForTimeout(500);

                    const download = await downloadPromise;
                    if (download) {
                      const imgDir = path.join(IMAGES_DIR, collectionSlug, urlSlug);
                      fs.mkdirSync(imgDir, { recursive: true });
                      
                      const fileName = `${code}-${urlSlug}.jpg`;
                      const imgPath = path.join(imgDir, fileName);
                      
                      await download.saveAs(imgPath);
                      localImagePath = `/images/products/vinyl/${collectionSlug}/${urlSlug}/${fileName}`;
                      break;
                    }
                  } catch (e) {}
                }
              }
            }
          }

          // Fallback: download from CDN if click method didn't work
          if (!localImagePath) {
            const cdnImgUrl = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
            if (cdnImgUrl) {
              localImagePath = cdnImgUrl; // Use CDN URL as fallback
            }
          }

          // ===== OPEN DESCRIPTION TAB AND EXTRACT =====
          let description = null;
          const descTabSelectors = [
            'button[role="tab"]:has-text("Description")',
            'button[role="tab"]:has-text("Product")',
            '[role="tab"]:has-text("Description")'
          ];

          for (const selector of descTabSelectors) {
            const tab = page.locator(selector).first();
            if (await tab.count() > 0 && await tab.isVisible().catch(() => false)) {
              try {
                await tab.click();
                await page.waitForTimeout(1000);
                break;
              } catch (e) {}
            }
          }

          const descEl = page.locator('[class*="description"], [class*="product-description"]').first();
          if (await descEl.count() > 0) {
            description = await descEl.textContent().catch(() => null);
          }

          // ===== OPEN CHARACTERISTICS TAB AND EXTRACT =====
          const charTabSelectors = [
            'button[role="tab"]:has-text("Characteristics")',
            'button[role="tab"]:has-text("Specifications")',
            '[role="tab"]:has-text("Characteristics")'
          ];

          for (const selector of charTabSelectors) {
            const tab = page.locator(selector).first();
            if (await tab.count() > 0 && await tab.isVisible().catch(() => false)) {
              try {
                await tab.click();
                await page.waitForTimeout(1000);
                break;
              } catch (e) {}
            }
          }

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
                for (let i = 0; i < items.length - 1; i += 2) {
                  if (items[i].tagName === 'DT' && items[i + 1].tagName === 'DD') {
                    const k = items[i].textContent?.trim();
                    const v = items[i + 1].textContent?.trim();
                    if (k && v) data[k] = v;
                  }
                }
              }
            });
            return data;
          }).catch(() => ({}));

          // Normalize
          const dim = chars['Dimension'] || (chars['Width of sheet'] && chars['Length of sheet'] 
            ? `${chars['Width of sheet']} X ${chars['Length of sheet']}` : null);
          const thick = chars['Overall thickness'] || null;
          const format = chars['Format details'] || chars['Format'] || null;
          const weldingRod = chars['WELDING ROD REF.'] || chars['Welding rod ref.'] || null;

          const normChars = {};
          if (dim) normChars['Dimenzije'] = dim;
          if (thick) normChars['Ukupna debljina'] = thick;
          Object.entries(chars).forEach(([k, v]) => {
            if (k !== 'Dimenzije' && k !== 'Ukupna debljina' && 
                k !== 'Dimension' && k !== 'Overall thickness' &&
                k !== 'Width of sheet' && k !== 'Length of sheet' &&
                !(k === 'Format details' && format)) {
              normChars[k] = v;
            }
          });

          const colorData = {
            collection: collectionSlug,
            collection_name: collectionSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            collection_slug: collectionSlug,
            type: config.type,
            code: code,
            name: name,
            full_name: h1.trim(),
            slug: urlSlug,
            image_url: localImagePath || null,
            texture_url: null,
            image_count: localImagePath ? 1 : 0,
            dimension: dim,
            format: format,
            overall_thickness: thick,
            description: description?.trim() || 'See full description',
            characteristics: normChars,
            welding_rod: weldingRod
          };

          allColors.push(colorData);
          processedSlugs.add(urlSlug);
          
          // Save checkpoint every 25 colors
          if (allColors.length % 25 === 0) {
            saveCheckpoint({ processedColors: Array.from(processedSlugs) });
            console.log(`    💾 Checkpoint saved (${allColors.length} colors)`);
          }

          process.stdout.write(`✓ ${code}\n`);
        } catch (error) {
          process.stdout.write(`✗ ${error.message}\n`);
        }
      }
    }
  }

  await browser.close();

  // Save final
  const homogeneous = allColors.filter(c => c.type === 'homogeneous').length;
  const heterogeneous = allColors.filter(c => c.type === 'heterogeneous').length;

  const outputData = {
    total: allColors.length,
    homogeneous: homogeneous,
    heterogeneous: heterogeneous,
    colors: allColors,
    metadata: {
      scrapedAt: new Date().toISOString(),
      version: 'FINAL'
    }
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);

  console.log(`\n✅ ZAVRŠENO!`);
  console.log(`   Total: ${outputData.total}`);
  console.log(`   Homogeneous: ${homogeneous}`);
  console.log(`   Heterogeneous: ${heterogeneous}`);
  console.log(`   Slike: ${allColors.filter(c => c.image_url && c.image_url.startsWith('/images/')).length} lokalno preuzeto`);

  return outputData;
}

finalScrape().catch(console.error);
