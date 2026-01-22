const fs = require('fs');
const path = require('path');

// Navigate to Taralay Impression Acoustic page and scrape all 96 colors
async function scrapeTaralayImpressionAcousticColors() {
  const url = 'https://www.gerflor-cee.com/products/taralay-impression-acoustic';
  
  console.log('Opening browser...');
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to Taralay Impression Acoustic page...');
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
    const maxScrollAttempts = 15;
    
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
        'a[href*="/products/taralay-impression-acoustic-"]',
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
            if (href && href.includes('taralay-impression-acoustic-')) {
              const text = el.textContent?.trim() || '';
              const codeMatch = text.match(/(\d{4})/) || href.match(/taralay-impression-acoustic-(\d{4})/);
              const code = codeMatch ? codeMatch[1] : '';
              
              if (code) {
                // Try to extract name
                const nameMatch = text.match(/\d{4}\s+(.+)/i) || 
                                 text.match(/-([a-z-]+)/i) ||
                                 href.match(/taralay-impression-acoustic-\d{4}-(.+?)(?:-hd|\?|$)/i);
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
      
      // Alternative: look for all links with taralay-impression-acoustic
      if (extracted.length < 50) {
        const allLinks = Array.from(document.querySelectorAll('a[href*="taralay-impression-acoustic"]'));
        allLinks.forEach(link => {
          const href = link.href || link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          const codeMatch = href.match(/taralay-impression-acoustic-(\d{4})/) || text.match(/(\d{4})/);
          const code = codeMatch ? codeMatch[1] : '';
          
          if (code && !extracted.find(c => c.code === code)) {
            const nameMatch = text.match(/\d{4}\s+(.+)/i) || 
                             href.match(/taralay-impression-acoustic-\d{4}-(.+?)(?:-hd|\?|$)/i);
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
    
    // Generate slugs and SKUs
    const colorsWithSlugs = colors.map(color => {
      const slugName = color.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return {
        ...color,
        slug: `taralay-impression-acoustic-${color.code}-${slugName}`,
        sku: null, // Will be extracted from individual color pages if needed
        collection_slug: 'taralay-impression-acoustic',
        collection_name: 'Taralay Impression Acoustic',
      };
    });
    
    console.log(`\nExtracted ${colorsWithSlugs.length} colors:`);
    colorsWithSlugs.slice(0, 10).forEach(c => console.log(`  ${c.code} ${c.name}`));
    if (colorsWithSlugs.length > 10) {
      console.log(`  ... and ${colorsWithSlugs.length - 10} more`);
    }
    
    return colorsWithSlugs;
    
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
    const colors = await scrapeTaralayImpressionAcousticColors();
    
    // Save to JSON file
    const outputPath = path.join(__dirname, 'taralay-impression-acoustic-colors.json');
    fs.writeFileSync(outputPath, JSON.stringify(colors, null, 2));
    console.log(`\nSaved ${colors.length} colors to ${outputPath}`);
    
  } catch (error) {
    console.error('Failed to scrape colors:', error);
    process.exit(1);
  }
})();
