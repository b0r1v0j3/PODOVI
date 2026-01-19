const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

async function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        return downloadImage(response.headers.location, filePath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(err);
    });
  });
}

async function scrapeWithImages() {
  console.log('🚀 Starting vinyl scraping WITH image downloads...\n');

  const browser = await chromium.launch({ 
    headless: false, 
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  const existingData = JSON.parse(fs.readFileSync('public/data/vinyl_colors_complete.json', 'utf-8'));
  const existingSlugs = new Set(existingData.colors.map(c => c.slug));
  
  console.log(`Existing: ${existingData.total} / 908`);
  console.log(`Missing: ${908 - existingData.total}\n`);

  const acceptCookies = async () => {
    const selectors = ['#onetrust-accept-btn-handler', 'button:has-text("Accept")', 'button:has-text("Prihvati")'];
    for (const selector of selectors) {
      const btn = page.locator(selector).first();
      if (await btn.count()) {
        try {
          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(500);
          return;
        } catch (error) {}
      }
    }
  };

  const downloadColorImage = async (colorUrl, collectionSlug, colorSlug, code) => {
    try {
      await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // Look for download icon/button (usually in top-right corner of color swatch)
      // Try multiple selectors
      const downloadSelectors = [
        'button[aria-label*="download" i]',
        'button[aria-label*="preuzmi" i]',
        'button[title*="download" i]',
        'button[title*="preuzmi" i]',
        '[class*="download"]',
        '[class*="Download"]',
        'svg[class*="download"]',
        'button:has(svg[class*="download"])',
        'a[href*="download"]',
        // Try to find button near color swatch/image
        '.color-swatch button',
        '[class*="color"] button',
        '[class*="swatch"] button'
      ];

      let downloadBtn = null;
      for (const selector of downloadSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0) {
          const isVisible = await btn.isVisible().catch(() => false);
          if (isVisible) {
            downloadBtn = btn;
            break;
          }
        }
      }

      if (!downloadBtn) {
        console.log(`      ⚠️  Download button not found, trying direct CDN URL`);
        // Fallback: try to get image URL directly from page
        const imgUrl = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
        if (imgUrl) {
          return await downloadImageDirect(imgUrl, collectionSlug, colorSlug, code);
        }
        return null;
      }

      // Click download button
      await downloadBtn.scrollIntoViewIfNeeded();
      await downloadBtn.click();
      await page.waitForTimeout(1000);

      // Look for .JPG button
      const jpgSelectors = [
        'button:has-text(".JPG")',
        'button:has-text("JPG")',
        'a:has-text(".JPG")',
        'a:has-text("JPG")',
        '[class*="jpg"]',
        'button[aria-label*="jpg" i]',
        'button[aria-label*="JPG" i]'
      ];

      let jpgBtn = null;
      for (const selector of jpgSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0) {
          const isVisible = await btn.isVisible().catch(() => false);
          if (isVisible) {
            jpgBtn = btn;
            break;
          }
        }
      }

      if (!jpgBtn) {
        console.log(`      ⚠️  JPG button not found`);
        return null;
      }

      // Wait for download to start
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      await jpgBtn.click();
      await page.waitForTimeout(500);

      const download = await downloadPromise;
      if (download) {
        // Save to correct location
        const imageDir = path.join('public', 'images', 'products', 'vinyl', collectionSlug, colorSlug);
        fs.mkdirSync(imageDir, { recursive: true });
        
        const fileName = `${code}-${colorSlug}.jpg`;
        const filePath = path.join(imageDir, fileName);
        
        await download.saveAs(filePath);
        console.log(`      ✓ Downloaded: ${fileName}`);
        
        return `/images/products/vinyl/${collectionSlug}/${colorSlug}/${fileName}`;
      } else {
        // Fallback: try direct CDN URL
        const imgUrl = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
        if (imgUrl) {
          return await downloadImageDirect(imgUrl, collectionSlug, colorSlug, code);
        }
        return null;
      }
    } catch (error) {
      console.log(`      ✗ Error: ${error.message}`);
      return null;
    }
  };

  const downloadImageDirect = async (imgUrl, collectionSlug, colorSlug, code) => {
    try {
      const imageDir = path.join('public', 'images', 'products', 'vinyl', collectionSlug, colorSlug);
      fs.mkdirSync(imageDir, { recursive: true });
      
      const fileName = `${code}-${colorSlug}.jpg`;
      const filePath = path.join(imageDir, fileName);
      
      await downloadImage(imgUrl, filePath);
      console.log(`      ✓ Downloaded (direct): ${fileName}`);
      
      return `/images/products/vinyl/${collectionSlug}/${colorSlug}/${fileName}`;
    } catch (error) {
      console.log(`      ✗ Direct download failed: ${error.message}`);
      return null;
    }
  };

  const extractColorData = async (page, type, collectionSlug, colorUrl) => {
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

      // Try to download image
      const localImagePath = await downloadColorImage(colorUrl, collectionSlug, slug, code);
      const imageUrl = localImagePath || await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);

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
        image_url: localImagePath || imageUrl || null,
        texture_url: null,
        image_count: (localImagePath || imageUrl) ? 1 : 0,
        dimension: dimension || null,
        format: format || null,
        overall_thickness: overallThickness || null,
        description: 'See full description',
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
    for (let i = 0; i < 20; i++) {
      const btn = page.locator('button:has-text("Show more")').first();
      if (await btn.count() === 0) break;
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        await btn.click();
        await page.waitForTimeout(1000);
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

      process.stdout.write(`${colorLinks.length} colors\n`);

      // Check which are missing
      const missingUrls = [];
      for (const colorUrl of colorLinks) {
        const slugMatch = colorUrl.match(/\/products\/([^?]+)/);
        const fullSlug = slugMatch ? slugMatch[1] : null;
        const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;
        if (slug && !existingSlugs.has(slug)) {
          missingUrls.push({ url: colorUrl, slug });
        }
      }

      if (missingUrls.length > 0) {
        console.log(`  Found ${missingUrls.length} missing colors`);
        
        // Scrape missing ones
        for (let j = 0; j < missingUrls.length; j++) {
          const { url: colorUrl, slug } = missingUrls[j];
          process.stdout.write(`  [${j + 1}/${missingUrls.length}] `);
          
          try {
            const colorData = await extractColorData(page, config.type, collectionSlug, colorUrl);
            if (colorData && colorData.code && colorData.slug) {
              newColors.push(colorData);
              existingSlugs.add(colorData.slug);
              process.stdout.write(`✓ ${colorData.code}\n`);
            } else {
              process.stdout.write(`✗\n`);
            }
          } catch (error) {
            process.stdout.write(`✗ ${error.message}\n`);
          }
        }
      }
    }
  }

  await browser.close();

  // Merge
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
      version: '3.0',
      added: newColors.length
    }
  };

  fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`\n✅ Complete!`);
  console.log(`   Total: ${outputData.total} / 908`);
  console.log(`   Homogeneous: ${homogeneous}`);
  console.log(`   Heterogeneous: ${heterogeneous}`);
  console.log(`   Added: ${newColors.length}`);
  console.log(`   Still missing: ${908 - outputData.total}`);

  return outputData;
}

scrapeWithImages().catch(console.error);
