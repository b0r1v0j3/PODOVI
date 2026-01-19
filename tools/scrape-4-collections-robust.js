const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function scrape4Collections() {
  console.log('🚀 Scraping 4 kolekcije - ROBUST metoda\n');

  const browser = await chromium.launch({ 
    headless: false, 
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 }, 
    acceptDownloads: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  const acceptCookies = async () => {
    const btn = page.locator('#onetrust-accept-btn-handler').first();
    if (await btn.count()) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  };

  const collections = [
    { url: 'https://www.gerflor-cee.com/products/premium-acoustic', slug: 'premium-acoustic', type: 'heterogeneous' },
    { url: 'https://www.gerflor-cee.com/products/premium-compact', slug: 'premium-compact', type: 'heterogeneous' },
    { url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order', slug: 'taralay-millenium-acoustic-order', type: 'heterogeneous' },
    { url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact', slug: 'taralay-millenium-compact', type: 'heterogeneous' }
  ];

  const existingData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  const existingSlugs = new Set(existingData.colors.map(c => c.slug));
  const updatedColors = [...existingData.colors];

  for (let i = 0; i < collections.length; i++) {
    const config = collections[i];
    console.log(`\n[${i + 1}/4] ${config.slug}`);

    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(3000);

    // Scroll to load lazy content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Try clicking "View all" if exists
    const viewAllSelectors = [
      'a:has-text("View all")',
      'button:has-text("View all")',
      'a:has-text("view all")',
      'button:has-text("view all")',
      '[class*="view-all"]',
      '[class*="ViewAll"]'
    ];
    
    for (const selector of viewAllSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        const isVisible = await btn.isVisible().catch(() => false);
        if (isVisible) {
          console.log('  Clicking "View all"...');
          await btn.scrollIntoViewIfNeeded();
          await btn.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    }

    // Extract ALL links - multiple strategies
    let colorLinks = [];

    // Strategy 1: Original method (with "view product" text)
    const links1 = await page.$$eval('a[href*="/products/"]', (links) => {
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
        .filter(Boolean);
    }).catch(() => []);

    colorLinks.push(...links1);

    // Strategy 2: Any link ending with 8+ digits (no text filter)
    if (colorLinks.length === 0) {
      const links2 = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links
          .map(link => {
            const href = link.getAttribute('href');
            if (!href || !href.includes('/products/')) return null;
            const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
            if (/\d{8,}$/.test(href)) {
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
      }).catch(() => []);
      colorLinks.push(...links2);
    }

    // Strategy 3: Look for color swatches/images
    if (colorLinks.length === 0) {
      const swatchLinks = await page.$$eval('a[href*="/products/"], [class*="color"] a, [class*="swatch"] a', (elements) => {
        const seen = new Set();
        return elements
          .map(el => {
            const href = el.getAttribute('href');
            if (!href || !href.includes('/products/')) return null;
            const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
            if (/\d{8,}$/.test(href)) {
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
      }).catch(() => []);
      colorLinks.push(...swatchLinks);
    }

    // Remove duplicates
    colorLinks = [...new Set(colorLinks)];

    console.log(`  Found ${colorLinks.length} colors`);

    if (colorLinks.length === 0) {
      console.log('  ⚠️  No colors found, trying to find any product links...');
      
      // Last resort: get ALL product links
      const allProductLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links
          .map(link => {
            const href = link.getAttribute('href');
            if (!href || !href.includes('/products/')) return null;
            return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
          })
          .filter(Boolean)
          .filter(url => {
            if (seen.has(url)) return false;
            seen.add(url);
            return true;
          });
      }).catch(() => []);

      // Filter to only those with collection slug + digits
      colorLinks = allProductLinks.filter(url => {
        return url.includes(config.slug) && /\d{4,}$/.test(url);
      });

      console.log(`  After filtering: ${colorLinks.length} colors`);
    }

    // Process each color
    for (let j = 0; j < colorLinks.length; j++) {
      const colorUrl = colorLinks[j];
      const slugMatch = colorUrl.match(/\/products\/([^?]+)/);
      const fullSlug = slugMatch ? slugMatch[1] : null;
      const slug = fullSlug?.replace(/-\d{8,}$/, '') || fullSlug;

      // Check if already exists
      const existingColor = existingData.colors.find(c => c.slug === slug || c.slug === fullSlug);
      if (existingColor) {
        process.stdout.write(`  [${j + 1}/${colorLinks.length}] ⏭ Already exists\n`);
        continue;
      }

      process.stdout.write(`  [${j + 1}/${colorLinks.length}] `);

      try {
        await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await acceptCookies();
        await page.waitForTimeout(2000);

        const h1 = await page.locator('h1').first().textContent().catch(() => null);
        if (!h1) throw new Error('No h1');

        const parts = h1.trim().split(/\s+/);
        const code = parts[0];
        const name = parts.slice(1).join(' ');

        // Download image
        const mainImage = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
        let localImagePath = null;
        
        if (mainImage) {
          try {
            const imageDir = path.join('public', 'images', 'products', 'vinyl', config.slug, slug);
            fs.mkdirSync(imageDir, { recursive: true });
            const fileName = `${code}-${slug}.jpg`;
            const imgPath = path.join(imageDir, fileName);
            await downloadFile(mainImage, imgPath);
            if (fs.existsSync(imgPath)) {
              localImagePath = `/images/products/vinyl/${config.slug}/${slug}/${fileName}`;
            }
          } catch (error) {
            // Continue without image
          }
        }

        // Extract characteristics
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
              for (let idx = 0; idx < items.length - 1; idx += 2) {
                if (items[idx].tagName === 'DT' && items[idx + 1].tagName === 'DD') {
                  const key = items[idx].textContent?.trim();
                  const value = items[idx + 1].textContent?.trim();
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

        const collectionName = config.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        const colorData = {
          collection: config.slug,
          collection_name: collectionName,
          collection_slug: config.slug,
          type: config.type,
          code: code || null,
          name: name || null,
          full_name: h1.trim(),
          slug: slug || null,
          image_url: localImagePath || mainImage || null,
          texture_url: null,
          image_count: (localImagePath || mainImage) ? 1 : 0,
          dimension: dimension || null,
          format: format || null,
          overall_thickness: overallThickness || null,
          description: 'See full description',
          characteristics: normalizedCharacteristics,
          welding_rod: null
        };

        updatedColors.push(colorData);
        process.stdout.write(`✓ ${code}\n`);
      } catch (error) {
        process.stdout.write(`✗ ${error.message}\n`);
      }
    }
  }

  await browser.close();

  const outputData = {
    total: updatedColors.length,
    homogeneous: updatedColors.filter(c => c.type === 'homogeneous').length,
    heterogeneous: updatedColors.filter(c => c.type === 'heterogeneous').length,
    colors: updatedColors,
    metadata: {
      scrapedAt: new Date().toISOString(),
      version: 'FINAL-COMPLETE-ROBUST'
    }
  };

  fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`\n✅ ZAVRŠENO!`);
  console.log(`   Total: ${outputData.total} / 908`);
  console.log(`   Homogeneous: ${outputData.homogeneous}`);
  console.log(`   Heterogeneous: ${outputData.heterogeneous}`);

  return outputData;
}

scrape4Collections().catch(console.error);
