const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CHECKPOINT_FILE = path.join(__dirname, '../tmp/vinyl-scraping-checkpoint.json');
const OUTPUT_FILE = path.join(__dirname, '../public/data/vinyl_colors_complete.json');
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function scrapeAllVinyl() {
  console.log('🚀 Starting complete vinyl scraping (v2 - improved)...\n');

  // Load checkpoint if exists
  let checkpoint = loadCheckpoint();
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  const results = {
    homogeneous: checkpoint?.homogeneous || [],
    heterogeneous: checkpoint?.heterogeneous || []
  };

  const processedUrls = new Set(checkpoint?.processedUrls || []);

  const acceptCookies = async () => {
    const selectors = [
      '#onetrust-accept-btn-handler',
      'button:has-text("Accept all")',
      'button:has-text("Accept")',
      'button:has-text("Prihvati")',
    ];

    for (const selector of selectors) {
      const btn = page.locator(selector).first();
      if (await btn.count()) {
        try {
          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(1000);
          return true;
        } catch (error) {}
      }
    }
    return false;
  };

  const configs = [
    {
      type: 'homogeneous',
      categoryUrl: 'https://www.gerflor-cee.com/category/homogeneous-rolls-and-tiles'
    },
    {
      type: 'heterogeneous',
      categoryUrl: 'https://www.gerflor-cee.com/category/heterogeneous-rolls'
    }
  ];

  try {
    for (const config of configs) {
      // Skip if already completed
      if (checkpoint?.completedTypes?.includes(config.type)) {
        console.log(`\n⏭️  ${config.type} already completed, skipping...`);
        continue;
      }

      console.log(`\n=== ${config.type.toUpperCase()} ===`);

      // Get all collection links
      console.log('1. Getting collection links...');
      await page.goto(config.categoryUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await acceptCookies();
      await page.waitForTimeout(2000);

      // Click "Show more" until done
      let clicks = 0;
      while (clicks < 50) {
        const btn = page.locator('button:has-text("Show more")').first();
        if (await btn.count() === 0) break;
        
        const isVisible = await btn.isVisible().catch(() => false);
        const isDisabled = await btn.getAttribute('disabled').catch(() => null);
        
        if (isVisible && !isDisabled) {
          await btn.scrollIntoViewIfNeeded();
          await btn.click();
          await page.waitForTimeout(1500);
          clicks++;
          if (clicks % 5 === 0) console.log(`   Clicked "Show more" ${clicks} times...`);
        } else {
          break;
        }
      }

      // Extract collection links
      const collectionLinks = await page.$$eval('a[href*="/products/"]', (links) => {
        const seen = new Set();
        return links
          .map(link => {
            const href = link.getAttribute('href');
            if (!href) return null;
            const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
            // Filter out color links (have 8+ digit numbers at end)
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

      console.log(`   Found ${collectionLinks.length} collections`);

      // Process each collection
      for (let i = 0; i < collectionLinks.length; i++) {
        const collectionUrl = collectionLinks[i];
        const collectionSlug = collectionUrl.split('/products/')[1]?.split('?')[0] || '';
        
        console.log(`\n2. [${i + 1}/${collectionLinks.length}] Collection: ${collectionSlug}`);

        try {
          await page.goto(collectionUrl, { waitUntil: 'networkidle', timeout: 60000 });
          await acceptCookies();
          await page.waitForTimeout(2000);

          // Get all color links from collection page
          const colorLinks = await page.$$eval('a[href*="/products/"]', (links) => {
            const seen = new Set();
            return links
              .map(link => {
                const href = link.getAttribute('href');
                const text = link.textContent?.trim() || '';
                if (!href || !href.includes('/products/')) return null;
                const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
                // Color links have 8+ digit numbers at end and "View product" text
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

          console.log(`   Found ${colorLinks.length} colors`);

          // Process each color
          for (let j = 0; j < colorLinks.length; j++) {
            const colorUrl = colorLinks[j];
            
            // Skip if already processed
            if (processedUrls.has(colorUrl)) {
              process.stdout.write(`   [${j + 1}/${colorLinks.length}] ⏭️  already processed\n`);
              continue;
            }

            process.stdout.write(`   [${j + 1}/${colorLinks.length}] `);

            let colorData = null;
            let retries = 0;
            
            while (retries < MAX_RETRIES) {
              try {
                await page.goto(colorUrl, { waitUntil: 'networkidle', timeout: 60000 });
                await acceptCookies();
                await page.waitForTimeout(1500);

                colorData = await extractColorData(page, config.type, collectionSlug);
                
                // Validate extracted data
                if (!colorData.code || !colorData.name || !colorData.slug) {
                  throw new Error(`Missing required fields: code=${colorData.code}, name=${colorData.name}, slug=${colorData.slug}`);
                }

                // Check for duplicates
                const isDuplicate = results[config.type].some(
                  c => c.slug === colorData.slug || (c.code === colorData.code && c.collection === colorData.collection)
                );

                if (isDuplicate) {
                  console.log(`⚠️  Duplicate skipped: ${colorData.slug}`);
                  processedUrls.add(colorUrl);
                  saveCheckpoint(results, processedUrls, config.type);
                  break;
                }

                results[config.type].push(colorData);
                processedUrls.add(colorUrl);
                
                // Save checkpoint every 10 colors
                if (results[config.type].length % 10 === 0) {
                  saveCheckpoint(results, processedUrls, null);
                }

                process.stdout.write(`✓ ${colorData.code} ${colorData.name}\n`);
                break; // Success, exit retry loop

              } catch (error) {
                retries++;
                if (retries < MAX_RETRIES) {
                  console.error(`   ✗ Error (retry ${retries}/${MAX_RETRIES}): ${error.message}`);
                  await page.waitForTimeout(RETRY_DELAY);
                } else {
                  console.error(`   ✗ Failed after ${MAX_RETRIES} retries: ${error.message}`);
                  processedUrls.add(colorUrl); // Mark as processed even if failed
                  saveCheckpoint(results, processedUrls, null);
                }
              }
            }
          }

          console.log(`   ✅ Collection complete: ${collectionSlug}`);

        } catch (error) {
          console.error(`   ✗ Collection error: ${error.message}`);
          // Continue with next collection
        }
      }

      // Mark type as completed
      if (!checkpoint?.completedTypes) checkpoint = { completedTypes: [] };
      if (!checkpoint.completedTypes.includes(config.type)) {
        checkpoint.completedTypes.push(config.type);
      }

      console.log(`\n✅ ${config.type} complete: ${results[config.type].length} colors`);
    }

  } finally {
    await browser.close();
  }

  // Save final results
  const outputData = {
    total: results.homogeneous.length + results.heterogeneous.length,
    homogeneous: results.homogeneous.length,
    heterogeneous: results.heterogeneous.length,
    colors: [...results.homogeneous, ...results.heterogeneous],
    metadata: {
      scrapedAt: new Date().toISOString(),
      version: '2.0'
    }
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');

  // Clean up checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  console.log(`\n✅ Complete! Saved ${outputData.total} colors to: ${OUTPUT_FILE}`);
  console.log(`   Homogeneous: ${outputData.homogeneous}`);
  console.log(`   Heterogeneous: ${outputData.heterogeneous}`);
  
  return outputData;
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
      console.log(`\n📂 Loaded checkpoint: ${data.homogeneous?.length || 0} homogeneous, ${data.heterogeneous?.length || 0} heterogeneous`);
      return data;
    } catch (error) {
      console.log(`⚠️  Could not load checkpoint: ${error.message}`);
      return null;
    }
  }
  return null;
}

function saveCheckpoint(results, processedUrls, completedType) {
  try {
    const checkpoint = {
      homogeneous: results.homogeneous || [],
      heterogeneous: results.heterogeneous || [],
      processedUrls: Array.from(processedUrls),
      completedTypes: completedType ? [completedType] : []
    };
    
    fs.mkdirSync(path.dirname(CHECKPOINT_FILE), { recursive: true });
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), 'utf-8');
  } catch (error) {
    console.error(`⚠️  Could not save checkpoint: ${error.message}`);
  }
}

async function extractColorData(page, type, collectionSlug) {
  // Extract product name
  const productName = await page.locator('h1').first().textContent().catch(() => null);
  if (!productName) throw new Error('Product name not found');
  
  const nameParts = productName.trim().split(/\s+/);
  const code = nameParts[0] || null;
  const name = nameParts.slice(1).join(' ') || null;

  // Extract slug (remove numbers at end)
  const url = page.url();
  const slugMatch = url.match(/\/products\/([^?]+)/);
  const fullSlug = slugMatch ? slugMatch[1] : null;
  // Remove 8+ digit numbers at the end
  const slug = fullSlug?.replace(/-\d{8,}$/, '') || null;
  
  // Use provided collectionSlug or extract from slug
  const collection = collectionSlug || (slug?.match(/^([^-]+-[^-]+(?:-[^-]+)?)/)?.[1] || null);

  // Extract main image
  const mainImage = await page.locator('[class*="product-image"] img, .hero img, [class*="main-image"] img, img[src*="cdn.gerflor.com"]').first().getAttribute('src').catch(() => null);

  // Extract description
  let description = null;
  
  // Try tabs first
  const tabs = page.locator('[role="tab"], button[role="tab"]');
  const tabsCount = await tabs.count();
  
  for (let i = 0; i < tabsCount; i++) {
    const tab = tabs.nth(i);
    const tabText = await tab.textContent().catch(() => '');
    if (tabText.toLowerCase().includes('description') || tabText.toLowerCase().includes('product')) {
      await tab.click().catch(() => {});
      await page.waitForTimeout(1000);
      
      const descSection = page.locator('[class*="description"], [class*="product-description"]').first();
      if (await descSection.count() > 0) {
        description = await descSection.textContent().catch(() => null);
        if (description && description.trim().length > 100) break;
      }
    }
  }

  // Fallback to default location
  if (!description || description.trim().length < 100) {
    const descEl = page.locator('[class*="description"], [class*="product-description"]').first();
    if (await descEl.count() > 0) {
      description = await descEl.textContent().catch(() => null);
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

  // Normalize characteristics
  const dimension = characteristics['Dimension'] || 
    (characteristics['Width of sheet'] && characteristics['Length of sheet'] 
      ? `${characteristics['Width of sheet']} X ${characteristics['Length of sheet']}`
      : null);
  const format = characteristics['Format details'] || characteristics['Format'] || null;
  const overallThickness = characteristics['Overall thickness'] || null;
  const weldingRod = characteristics['WELDING ROD REF.'] || characteristics['Welding rod ref.'] || null;

  // Build normalized characteristics - Dimenzije FIRST, Ukupna debljina SECOND
  const normalizedCharacteristics = {};
  
  // 1. Dimenzije first
  if (dimension) {
    normalizedCharacteristics['Dimenzije'] = dimension;
  }
  
  // 2. Ukupna debljina second
  if (overallThickness) {
    normalizedCharacteristics['Ukupna debljina'] = overallThickness;
  }

  // 3. Add other characteristics (skip duplicates)
  Object.entries(characteristics).forEach(([key, value]) => {
    // Skip already added and dimension-related duplicates
    if (key === 'Dimenzije' || key === 'Ukupna debljina' || 
        key === 'Dimension' || key === 'Overall thickness' ||
        key === 'Width of sheet' || key === 'Length of sheet' ||
        (key === 'Format details' && format)) {
      return;
    }
    normalizedCharacteristics[key] = value;
  });

  // Format collection name
  const collectionName = collection 
    ? collection.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : null;

  return {
    collection: collection || null,
    collection_name: collectionName,
    collection_slug: collection || null,
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
}

// Run scraping
scrapeAllVinyl()
  .then((result) => {
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`   Total colors: ${result.total}`);
    console.log(`   Homogeneous: ${result.homogeneous}`);
    console.log(`   Heterogeneous: ${result.heterogeneous}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
