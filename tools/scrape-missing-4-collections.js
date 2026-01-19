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

async function scrapeMissing4() {
  console.log('🚀 Scraping 4 missing collections...\n');

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

  const collections = [
    { url: 'https://www.gerflor-cee.com/products/premium-acoustic', slug: 'premium-acoustic', type: 'heterogeneous' },
    { url: 'https://www.gerflor-cee.com/products/premium-compact', slug: 'premium-compact', type: 'heterogeneous' },
    { url: 'https://www.gerflor-cee.com/products/taralay-millenium-acoustic-order', slug: 'taralay-millenium-acoustic-order', type: 'heterogeneous' },
    { url: 'https://www.gerflor-cee.com/products/taralay-millenium-compact', slug: 'taralay-millenium-compact', type: 'heterogeneous' }
  ];

  const newColors = [];

  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    console.log(`\n[${i + 1}/4] ${collection.slug}`);

      await page.goto(collection.url, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // Click "View all" button if it exists
      const viewAllBtn = page.locator('a:has-text("View all"), button:has-text("View all")').first();
      if (await viewAllBtn.count() > 0 && await viewAllBtn.isVisible().catch(() => false)) {
        await viewAllBtn.click();
        await page.waitForTimeout(2000);
      }

      // Get all color links (without filtering by "view product" text)
      const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links.map(link => {
          const href = link.getAttribute('href');
          if (!href || !href.includes('/products/') || !/\d{8,}$/.test(href)) return null;
          return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
      });

    console.log(`  Found ${colorLinks.length} colors`);

    for (let j = 0; j < colorLinks.length; j++) {
      const colorUrl = colorLinks[j];
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
        const urlSlug = colorUrl.split('/products/')[1]?.replace(/-\d{8,}$/, '') || null;

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
        process.stdout.write(`✓ ${code}\n`);
      } catch (error) {
        process.stdout.write(`✗\n`);
      }
    }
  }

  await browser.close();

  // Load existing and merge
  const existingData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
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
  console.log(`   Total: ${outputData.total}`);
  console.log(`   Homogeneous: ${outputData.homogeneous}`);
  console.log(`   Heterogeneous: ${outputData.heterogeneous}`);

  return outputData;
}

scrapeMissing4().catch(console.error);
