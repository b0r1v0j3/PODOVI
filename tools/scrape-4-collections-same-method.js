const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrape4Collections() {
  console.log('🚀 Scraping 4 kolekcije ISTOM metodom koja je radila!\n');

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
  const page = await context.newPage();

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

  // RUČNO DODAJEM 4 KOLEKCIJE
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
    await page.waitForTimeout(2000);

    // ISTA LOGIKA kao u radnoj skripti
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

    console.log(`  Found ${colorLinks.length} colors`);

    // Process each color - ISTA LOGIKA
    for (let j = 0; j < colorLinks.length; j++) {
      const colorUrl = colorLinks[j];
      const slugMatch = colorUrl.match(/\/products\/([^?]+)/);
      const fullSlug = slugMatch ? slugMatch[1] : null;
      const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;

      // Find existing color data
      const existingColor = existingData.colors.find(c => c.slug === slug);
      
      if (existingColor) {
        process.stdout.write(`  [${j + 1}/${colorLinks.length}] ⏭ Already exists\n`);
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

        // Download image direktno sa CDN
        const mainImage = await page.locator('[class*="product-image"] img, .hero img, img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
        
        let localImagePath = null;
        if (mainImage) {
          const https = require('https');
          const imageDir = path.join('public', 'images', 'products', 'vinyl', config.slug, slug);
          fs.mkdirSync(imageDir, { recursive: true });
          const fileName = `${code}-${slug}.jpg`;
          const imgPath = path.join(imageDir, fileName);
          
          await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(imgPath);
            https.get(mainImage, (response) => {
              if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
              } else {
                file.close();
                reject(new Error(`HTTP ${response.statusCode}`));
              }
            }).on('error', reject);
          }).catch(() => {});

          if (fs.existsSync(imgPath)) {
            localImagePath = `/images/products/vinyl/${config.slug}/${slug}/${fileName}`;
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
          welding_rod: weldingRod || null
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
      version: 'FINAL-COMPLETE'
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
