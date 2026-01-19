const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Download image from URL
async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function scrapeComplete() {
  console.log('🚀 Starting COMPLETE vinyl scraping (with images & documents)...\n');

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
  
  console.log(`Existing: ${existingData.total} / 734`);
  console.log(`Will process all colors to download images & documents\n`);

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

  // Download image for a color
  const downloadColorImage = async (colorUrl, collectionSlug, colorSlug, code) => {
    try {
      await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // Try to find download button (multiple selectors)
      const downloadSelectors = [
        'button[aria-label*="download" i]',
        'button[title*="download" i]',
        '[class*="download"] button',
        'button:has(svg)',
        '.color-swatch button',
        '[class*="color"] button',
        '[class*="swatch"] button'
      ];

      let downloaded = false;
      let localImagePath = null;

      // Try clicking download button
      for (const selector of downloadSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0) {
          const isVisible = await btn.isVisible().catch(() => false);
          if (isVisible) {
            try {
              await btn.scrollIntoViewIfNeeded();
              await btn.click();
              await page.waitForTimeout(1000);

              // Look for .JPG button
              const jpgSelectors = [
                'button:has-text(".JPG")',
                'button:has-text("JPG")',
                'a:has-text(".JPG")',
                'a:has-text("JPG")',
                'button[aria-label*="jpg" i]'
              ];

              for (const jpgSelector of jpgSelectors) {
                const jpgBtn = page.locator(jpgSelector).first();
                if (await jpgBtn.count() > 0 && await jpgBtn.isVisible().catch(() => false)) {
                  const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
                  await jpgBtn.click();
                  await page.waitForTimeout(500);

                  const download = await downloadPromise;
                  if (download) {
                    const imageDir = path.join('public', 'images', 'products', 'vinyl', collectionSlug, colorSlug);
                    fs.mkdirSync(imageDir, { recursive: true });
                    
                    const fileName = `${code}-${colorSlug}.jpg`;
                    const filePath = path.join(imageDir, fileName);
                    
                    await download.saveAs(filePath);
                    localImagePath = `/images/products/vinyl/${collectionSlug}/${colorSlug}/${fileName}`;
                    downloaded = true;
                    break;
                  }
                }
              }
            } catch (error) {
              // Continue to next selector
            }
          }
        }
        if (downloaded) break;
      }

      // Fallback: download directly from CDN URL
      if (!downloaded) {
        const imgUrl = await page.locator('img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);
        if (imgUrl) {
          try {
            const imageDir = path.join('public', 'images', 'products', 'vinyl', collectionSlug, colorSlug);
            fs.mkdirSync(imageDir, { recursive: true });
            
            const fileName = `${code}-${colorSlug}.jpg`;
            const filePath = path.join(imageDir, fileName);
            
            await downloadFile(imgUrl, filePath);
            localImagePath = `/images/products/vinyl/${collectionSlug}/${colorSlug}/${fileName}`;
            downloaded = true;
          } catch (error) {
            console.log(`      ⚠️  Direct download failed: ${error.message}`);
          }
        }
      }

      return localImagePath;
    } catch (error) {
      return null;
    }
  };

  // Download documents for a collection
  const downloadCollectionDocuments = async (collectionUrl, collectionSlug) => {
    try {
      await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // Look for "Download all documents" button
      const docSelectors = [
        'button:has-text("Download all documents")',
        'button:has-text("download all documents")',
        'a:has-text("Download all documents")',
        'button[aria-label*="download all" i]',
        '[class*="download-all"]'
      ];

      for (const selector of docSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible().catch(() => false)) {
          try {
            await btn.scrollIntoViewIfNeeded();
            const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
            await btn.click();
            await page.waitForTimeout(1000);

            const download = await downloadPromise;
            if (download) {
              const docDir = path.join('public', 'documents', 'vinyl', collectionSlug);
              fs.mkdirSync(docDir, { recursive: true });
              
              const suggestedFilename = download.suggestedFilename() || 'documents.zip';
              const filePath = path.join(docDir, suggestedFilename);
              
              await download.saveAs(filePath);
              console.log(`      ✓ Downloaded documents: ${suggestedFilename}`);
              return true;
            }
          } catch (error) {
            // Continue to next selector
          }
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  const extractColorData = async (page, type, collectionSlug, colorUrl, code, name, slug) => {
    try {
      await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(1500);

      // Download image
      const localImagePath = await downloadColorImage(colorUrl, collectionSlug, slug, code);

      // Try to open/click Description tab/section
      let description = null;
      const descTabSelectors = [
        'button[role="tab"]:has-text("Description")',
        'button[role="tab"]:has-text("Opis")',
        'button[role="tab"]:has-text("Product")',
        '[role="tab"]:has-text("Description")',
        '[role="tab"]:has-text("Opis")',
        'button:has-text("Description")',
        'button:has-text("Opis")'
      ];

      for (const selector of descTabSelectors) {
        const tab = page.locator(selector).first();
        if (await tab.count() > 0 && await tab.isVisible().catch(() => false)) {
          try {
            await tab.click();
            await page.waitForTimeout(1000);
            break;
          } catch (error) {}
        }
      }

      // Extract full description text
      const descSelectors = [
        '[class*="description"]',
        '[class*="product-description"]',
        '[class*="content"]',
        'section:has-text("Product")',
        'section:has-text("Proizvod")'
      ];

      for (const selector of descSelectors) {
        const descEl = page.locator(selector).first();
        if (await descEl.count() > 0) {
          description = await descEl.textContent().catch(() => null);
          if (description && description.trim().length > 100) {
            break;
          }
        }
      }

      // Try to open/click Characteristics/Specifications tab/section
      const charTabSelectors = [
        'button[role="tab"]:has-text("Characteristics")',
        'button[role="tab"]:has-text("Specifications")',
        'button[role="tab"]:has-text("Karakteristike")',
        'button[role="tab"]:has-text("Specifikacije")',
        '[role="tab"]:has-text("Characteristics")',
        '[role="tab"]:has-text("Specifications")',
        'button:has-text("Characteristics")',
        'button:has-text("Specifications")'
      ];

      for (const selector of charTabSelectors) {
        const tab = page.locator(selector).first();
        if (await tab.count() > 0 && await tab.isVisible().catch(() => false)) {
          try {
            await tab.click();
            await page.waitForTimeout(1000);
            break;
          } catch (error) {}
        }
      }

      // Extract characteristics - try multiple methods
      let characteristics = {};

      // Method 1: From tables/DL
      characteristics = await page.$$eval('table, dl', (elements) => {
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

      // Method 2: If no characteristics found, try to find expandable sections
      if (Object.keys(characteristics).length === 0) {
        // Look for expandable/collapsible sections
        const expandButtons = page.locator('button[aria-expanded="false"], [class*="expand"], [class*="collapse"]');
        const expandCount = await expandButtons.count();
        
        for (let i = 0; i < expandCount; i++) {
          const btn = expandButtons.nth(i);
          const text = await btn.textContent().catch(() => '');
          if (text.toLowerCase().includes('characteristic') || 
              text.toLowerCase().includes('specification') ||
              text.toLowerCase().includes('karakteristike') ||
              text.toLowerCase().includes('specifikacije')) {
            try {
              await btn.click();
              await page.waitForTimeout(500);
            } catch (error) {}
          }
        }

        // Try again after expanding
        characteristics = await page.$$eval('table, dl', (elements) => {
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
      }

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
        full_name: `${code} ${name}`,
        slug: slug || null,
        image_url: localImagePath || null, // Use local path if downloaded
        texture_url: null,
        image_count: localImagePath ? 1 : 0,
        dimension: dimension || null,
        format: format || null,
        overall_thickness: overallThickness || null,
        description: description?.trim() || 'See full description',
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

  const updatedColors = [];
  const processedCollections = new Set();

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
          if (!href || /\d{8,}$/.test(href)) return null;
          const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
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
      
      console.log(`\n[${i + 1}/${collectionLinks.length}] ${collectionSlug}`);

      // Download documents for collection (once per collection)
      if (!processedCollections.has(collectionSlug)) {
        process.stdout.write(`  Downloading documents... `);
        const docsDownloaded = await downloadCollectionDocuments(collectionUrl, collectionSlug);
        if (docsDownloaded) {
          console.log(`✓`);
        } else {
          console.log(`✗ (not found)`);
        }
        processedCollections.add(collectionSlug);
      }

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

      console.log(`  Found ${colorLinks.length} colors`);

      // Process each color - download image
      for (let j = 0; j < colorLinks.length; j++) {
        const colorUrl = colorLinks[j];
        const slugMatch = colorUrl.match(/\/products\/([^?]+)/);
        const fullSlug = slugMatch ? slugMatch[1] : null;
        const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;
        
        // Extract code from URL or slug
        const codeMatch = slug?.match(/(\d{4})/);
        const code = codeMatch ? codeMatch[1] : null;
        const nameMatch = slug?.match(/\d{4}-(.+)$/);
        const name = nameMatch ? nameMatch[1].replace(/-/g, ' ').toUpperCase() : null;

        // Find existing color data
        const existingColor = existingData.colors.find(c => c.slug === slug);
        
        process.stdout.write(`  [${j + 1}/${colorLinks.length}] ${code || 'N/A'}... `);

        try {
          // Download image
          const localImagePath = await downloadColorImage(colorUrl, collectionSlug, slug, code);
          
          if (existingColor) {
            // Update existing color with local image path
            existingColor.image_url = localImagePath || existingColor.image_url;
            updatedColors.push(existingColor);
            process.stdout.write(localImagePath ? `✓ Image downloaded\n` : `⚠ No image\n`);
          } else {
            // Extract full data for new color
            const colorData = await extractColorData(page, config.type, collectionSlug, colorUrl, code, name, slug);
            if (colorData && colorData.code) {
              updatedColors.push(colorData);
              process.stdout.write(`✓ New color added\n`);
            } else {
              process.stdout.write(`✗ Failed\n`);
            }
          }
        } catch (error) {
          process.stdout.write(`✗ ${error.message}\n`);
        }
      }
    }
  }

  await browser.close();

  // Save updated data
  const homogeneous = updatedColors.filter(c => c.type === 'homogeneous').length;
  const heterogeneous = updatedColors.filter(c => c.type === 'heterogeneous').length;

  const outputData = {
    total: updatedColors.length,
    homogeneous: homogeneous,
    heterogeneous: heterogeneous,
    colors: updatedColors,
    metadata: {
      scrapedAt: new Date().toISOString(),
      version: '3.0',
      imagesDownloaded: true,
      documentsDownloaded: true
    }
  };

  fs.writeFileSync('public/data/vinyl_colors_complete.json', JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`\n✅ Complete!`);
  console.log(`   Total colors: ${outputData.total}`);
  console.log(`   Homogeneous: ${homogeneous}`);
  console.log(`   Heterogeneous: ${heterogeneous}`);
  console.log(`   Images: Downloaded to public/images/products/vinyl/`);
  console.log(`   Documents: Downloaded to public/documents/vinyl/`);

  return outputData;
}

scrapeComplete().catch(console.error);
