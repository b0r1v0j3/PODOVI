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

async function scrapeAll594() {
  console.log('🚀 Scraping ALL 594 heterogeneous colors from Colors tab...\n');

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
  
  console.log(`Existing heterogeneous: ${existingData.colors.filter(c => c.type === 'heterogeneous').length}`);
  console.log(`Target: 594`);
  console.log(`Missing: ${594 - existingData.colors.filter(c => c.type === 'heterogeneous').length}\n`);

  // Go to heterogeneous Colors tab
  console.log('Loading heterogeneous Colors tab...');
  await page.goto('https://www.gerflor-cee.com/category/heterogeneous-rolls', { waitUntil: 'networkidle', timeout: 60000 });
  await acceptCookies();
  await page.waitForTimeout(2000);

  // Click Colors tab
  const colorsTab = page.locator('button:has-text("Colors"), a:has-text("Colors")').first();
  if (await colorsTab.count() > 0) {
    await colorsTab.click();
    await page.waitForTimeout(2000);
  }

  // Click "Show more" UNTIL WE GET 594 links or button disappears
  console.log('Clicking Show more until all 594 colors loaded...');
  let previousCount = 0;
  let sameCountIterations = 0;
  
  for (let i = 0; i < 200; i++) {
    const btn = page.locator('button:has-text("Show more")').first();
    
    // Check if button exists and is clickable
    const btnCount = await btn.count();
    if (btnCount === 0) {
      console.log(`\nButton not found after ${i} clicks`);
      break;
    }

    const isDisabled = await btn.getAttribute('disabled').catch(() => null);
    if (isDisabled !== null) {
      console.log(`\nButton disabled after ${i} clicks`);
      break;
    }

    const isVisible = await btn.isVisible().catch(() => false);
    if (!isVisible) {
      console.log(`\nButton not visible after ${i} clicks`);
      break;
    }

    // Count current links
    const currentCount = await page.$$eval('a[href*="/products/"]', (links) => {
      return links.filter(link => {
        const href = link.getAttribute('href');
        return href && href.includes('/products/') && /\d{8,}$/.test(href);
      }).length;
    });

    if (currentCount === previousCount) {
      sameCountIterations++;
      if (sameCountIterations >= 3) {
        console.log(`\nNo more colors loading (stable at ${currentCount})`);
        break;
      }
    } else {
      sameCountIterations = 0;
      previousCount = currentCount;
    }

    try {
      await btn.scrollIntoViewIfNeeded({ timeout: 5000 });
      await btn.click({ timeout: 5000 });
      await page.waitForTimeout(1200);
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Clicked ${i + 1} times, ${currentCount} links visible`);
      }
    } catch (error) {
      console.log(`\nClick failed at ${i} clicks: ${error.message.substring(0, 100)}`);
      break;
    }
  }

  // Get ALL unique color links
  const allColorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
    const seen = new Set();
    return links.map(link => {
      const href = link.getAttribute('href');
      if (!href || !href.includes('/products/') || !/\d{8,}$/.test(href)) return null;
      return href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
    }).filter(Boolean).filter(url => !seen.has(url) && (seen.add(url), true));
  });

  console.log(`\nTotal unique color links found: ${allColorLinks.length}`);

  // Filter missing ones
  const missingLinks = [];
  for (const colorUrl of allColorLinks) {
    const slugMatch = colorUrl.match(/\/products\/([^?]+)/);
    const fullSlug = slugMatch ? slugMatch[1] : null;
    const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;
    if (slug && !existingSlugs.has(slug)) {
      missingLinks.push({ url: colorUrl, slug });
    }
  }

  console.log(`Missing colors: ${missingLinks.length}\n`);

  if (missingLinks.length === 0) {
    console.log('✅ Sve boje već ekstraktovane!');
    await browser.close();
    return;
  }

  // Scrape missing
  const newColors = [];
  
  for (let i = 0; i < missingLinks.length; i++) {
    const { url: colorUrl, slug } = missingLinks[i];
    process.stdout.write(`[${i + 1}/${missingLinks.length}] `);

    try {
      await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      const h1 = await page.locator('h1').first().textContent().catch(() => null);
      if (!h1) throw new Error('No h1');
      
      const parts = h1.trim().split(/\s+/);
      const code = parts[0];
      const name = parts.slice(1).join(' ');

      const collectionMatch = slug.match(/^([^-]+-[^-]+(?:-[^-]+)?)/);
      const collectionSlug = collectionMatch ? collectionMatch[1] : null;

      // Download image
      const cdnImgUrl = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
      let localImagePath = null;

      if (cdnImgUrl) {
        const imgPath = path.join('public/images/products/vinyl', collectionSlug, slug, `${code}-${slug}.jpg`);
        await downloadImage(cdnImgUrl, imgPath).catch(() => {});
        if (fs.existsSync(imgPath)) {
          localImagePath = `/images/products/vinyl/${collectionSlug}/${slug}/${code}-${slug}.jpg`;
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
        slug: slug,
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

scrapeAll594().catch(console.error);
