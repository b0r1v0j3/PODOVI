const fs = require('fs');
const path = require('path');

// Navigate to Taralay Initial Acoustic page and scrape all colors
async function scrapeTaralayInitialAcousticColors() {
  const url = 'https://www.gerflor-cee.com/products/taralay-initial-acoustic';
  
  console.log('Opening browser...');
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to Taralay Initial Acoustic page...');
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Click "View all" button to see all colors
    console.log('Looking for "View all" button...');
    try {
      const viewAllButton = await page.locator('text=View all').first();
      if (await viewAllButton.isVisible({ timeout: 5000 })) {
        await viewAllButton.click();
        await page.waitForTimeout(2000);
        console.log('Clicked "View all" button');
      }
    } catch (e) {
      console.log('No "View all" button found, continuing...');
    }
    
    // Scroll to load all colors
    console.log('Scrolling to load all colors...');
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;
    
    while (scrollAttempts < maxScrollAttempts) {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(2000);
      const newHeight = await page.evaluate('document.body.scrollHeight');
      
      if (newHeight === previousHeight) {
        break;
      }
      scrollAttempts++;
    }
    
    // Extract all color data
    console.log('Extracting color data...');
    const colors = await page.evaluate(() => {
      const extracted = [];
      
      // Try different selectors for color items
      const selectors = [
        'a[href*="/products/taralay-initial-acoustic-"]',
        '[data-color-code]',
        '.color-item',
        '.product-color',
        '.product-card',
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const link = el.closest('a') || el;
            const href = link.href || link.getAttribute('href');
            if (href && href.includes('taralay-initial-acoustic-')) {
              const text = el.textContent?.trim() || '';
              const codeMatch = text.match(/(\d{4})/) || href.match(/taralay-initial-acoustic-(\d{4})/);
              const code = codeMatch ? codeMatch[1] : '';
              
              if (code) {
                // Try to extract name
                const nameMatch = text.match(/\d{4}\s+(.+)/i) || 
                                 text.match(/-([a-z-]+)/i) ||
                                 href.match(/taralay-initial-acoustic-\d{4}-(.+?)(?:-hd|\?|$)/i);
                const name = nameMatch ? nameMatch[1].trim().replace(/-/g, ' ').toUpperCase() : '';
                
                if (!extracted.find(c => c.code === code)) {
                  extracted.push({
                    code,
                    name: name || `COLOR ${code}`,
                    href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
                  });
                }
              }
            }
          });
        }
      }
      
      // Alternative: look for all links with taralay-initial-acoustic
      if (extracted.length < 20) {
        const allLinks = Array.from(document.querySelectorAll('a[href*="taralay-initial-acoustic"]'));
        allLinks.forEach(link => {
          const href = link.href || link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          const codeMatch = href.match(/taralay-initial-acoustic-(\d{4})/) || text.match(/(\d{4})/);
          const code = codeMatch ? codeMatch[1] : '';
          
          if (code && !extracted.find(c => c.code === code)) {
            const nameMatch = text.match(/\d{4}\s+(.+)/i) || 
                             href.match(/taralay-initial-acoustic-\d{4}-(.+?)(?:-hd|\?|$)/i);
            const name = nameMatch ? nameMatch[1].trim().replace(/-/g, ' ').toUpperCase() : '';
            
            extracted.push({
              code,
              name: name || `COLOR ${code}`,
              href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
            });
          }
        });
      }
      
      return extracted;
    });
    
    console.log(`Found ${colors.length} colors`);
    
    // Sort by code
    colors.sort((a, b) => parseInt(a.code) - parseInt(b.code));
    
    console.log(`\nExtracted ${colors.length} colors:`);
    colors.slice(0, 10).forEach(c => console.log(`  ${c.code} ${c.name}`));
    if (colors.length > 10) {
      console.log(`  ... and ${colors.length - 10} more`);
    }
    
    return colors;
    
  } catch (error) {
    console.error('Error scraping colors:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
(async () => {
  try {
    const colors = await scrapeTaralayInitialAcousticColors();
    
    // Save to JSON file
    const outputPath = path.join(__dirname, 'taralay-initial-acoustic-colors.json');
    fs.writeFileSync(outputPath, JSON.stringify(colors, null, 2));
    console.log(`\nSaved ${colors.length} colors to ${outputPath}`);
    
    // Compare with Acoustic colors
    if (fs.existsSync('tools/taralay-impression-acoustic-colors.json')) {
      const acousticColors = JSON.parse(fs.readFileSync('tools/taralay-impression-acoustic-colors.json', 'utf8'));
      console.log(`\n=== Comparison with Taralay Impression Acoustic ===`);
      console.log(`Taralay Impression Acoustic: ${acousticColors.length} colors`);
      console.log(`Taralay Initial Acoustic: ${colors.length} colors`);
      
      // Find which colors are in Initial Acoustic
      const initialCodes = new Set(colors.map(c => c.code));
      const acousticCodes = new Set(acousticColors.map(c => c.code));
      const inInitial = colors.filter(c => acousticCodes.has(c.code));
      const onlyInInitial = colors.filter(c => !acousticCodes.has(c.code));
      const onlyInAcoustic = acousticColors.filter(c => !initialCodes.has(c.code));
      
      console.log(`\nColors in Initial Acoustic that match Acoustic: ${inInitial.length}/${colors.length}`);
      console.log(`Colors ONLY in Initial Acoustic (new): ${onlyInInitial.length}`);
      console.log(`Colors ONLY in Acoustic (not in Initial): ${onlyInAcoustic.length}`);
      
      if (onlyInInitial.length > 0) {
        console.log(`\n✓ NEW colors in Initial Acoustic (${onlyInInitial.length}):`);
        onlyInInitial.forEach(c => console.log(`  ${c.code} ${c.name}`));
      } else {
        console.log(`\n✗ NO new colors - all colors exist in Acoustic collection`);
      }
      
      if (inInitial.length === colors.length && onlyInInitial.length === 0) {
        console.log(`\n=== CONCLUSION ===`);
        console.log(`✓ All ${colors.length} colors in Taralay Initial Acoustic already exist in Taralay Impression Acoustic`);
        console.log(`✓ These are the SAME colors, not new ones`);
      } else {
        console.log(`\n=== CONCLUSION ===`);
        console.log(`⚠ Taralay Initial Acoustic has ${onlyInInitial.length} NEW colors that don't exist in Acoustic`);
        console.log(`⚠ These are DIFFERENT colors, not the same`);
      }
    } else {
      console.log('\n⚠ Taralay Impression Acoustic colors file not found for comparison');
    }
    
  } catch (error) {
    console.error('Failed to scrape colors:', error);
    process.exit(1);
  }
})();
