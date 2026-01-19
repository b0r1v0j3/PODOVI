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

async function simpleScript() {
  console.log('🚀 Simple scraper - samo preuzmi slike!\n');

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

  // Use direct approach - go to each collection and extract ALL color URLs from page HTML
  const collections = [
    'premium-acoustic',
    'premium-compact',
    'taralay-millenium-acoustic-order',
    'taralay-millenium-compact'
  ];

  const allColorUrls = [];
  const newColors = [];

  for (const collectionSlug of collections) {
    console.log(`\n=== ${collectionSlug} ===`);
    await page.goto(`https://www.gerflor-cee.com/products/${collectionSlug}`, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptCookies();
    await page.waitForTimeout(2000);

    // Extract ALL URLs from page source that match color pattern
    const urls = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      return allLinks
        .map(link => link.href)
        .filter(href => href && href.includes('/products/') && /\d{8,}$/.test(href));
    });

    const uniqueUrls = [...new Set(urls)];
    console.log(`  Found ${uniqueUrls.length} color URLs in page HTML`);
    
    allColorUrls.push(...uniqueUrls);
  }

  const uniqueAllUrls = [...new Set(allColorUrls)];
  console.log(`\n📊 Total unique URLs: ${uniqueAllUrls.length}`);

  // Filter missing ones
  const missingUrls = uniqueAllUrls.filter(url => {
    const slugMatch = url.match(/\/products\/([^?]+)/);
    const fullSlug = slugMatch ? slugMatch[1] : null;
    const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;
    return slug && !existingSlugs.has(slug);
  });

  console.log(`Missing: ${missingUrls.length}\n`);

  // Scrape missing
  for (let i = 0; i < missingUrls.length; i++) {
    const colorUrl = missingUrls[i];
    const urlSlug = colorUrl.split('/products/')[1]?.replace(/-\d{8,}$/, '') || null;
    
    process.stdout.write(`[${i + 1}/${missingUrls.length}] `);

    try {
      await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1000);

      const h1 = await page.locator('h1').first().textContent().catch(() => null);
      if (!h1) throw new Error('No h1');
      
      const parts = h1.trim().split(/\s+/);
      const code = parts[0];
      const name = parts.slice(1).join(' ');

      const collectionMatch = urlSlug.match(/^([^-]+-[^-]+(?:-[^-]+)?(?:-[^-]+)?(?:-[^-]+)?)/);
      const collectionSlug = collectionMatch ? collectionMatch[1] : null;

      // Download image
      const cdnImgUrl = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
      let localImagePath = null;

      if (cdnImgUrl) {
        const imgPath = path.join('public/images/products/vinyl', collectionSlug, urlSlug, `${code}-${urlSlug}.jpg`);
        await downloadImage(cdnImgUrl, imgPath).catch(() => {});
        if (fs.existsSync(imgPath)) {
          localImagePath = `/images/products/vinyl/${collectionSlug}/${urlSlug}/${code}-${urlSlug}.jpg`;
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
        collection: collectionSlug,
        collection_name: collectionSlug ? collectionSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null,
        collection_slug: collectionSlug,
        type: 'heterogeneous',
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
      version: 'FINAL'
    }
  };

  fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`\n✅ ZAVRŠENO!`);
  console.log(`   Dodato: ${newColors.length} boja`);
  console.log(`   Total: ${outputData.total} / 908`);
  console.log(`   Homogeneous: ${outputData.homogeneous}`);
  console.log(`   Heterogeneous: ${outputData.heterogeneous}`);

  return outputData;
}

simpleScript().catch(console.error);
