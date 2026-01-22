const fs = require('fs');
const path = require('path');

// Navigate to Premium Compact page and scrape all 81 colors
async function scrapePremiumCompactColors() {
  const url = 'https://www.gerflor-cee.com/products/premium-compact';
  
  console.log('Opening browser...');
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to Premium Compact page...');
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
      const colorElements = Array.from(document.querySelectorAll('[class*="color"], [class*="swatch"], [class*="product-card"]'));
      const extracted = [];
      
      // Try different selectors
      const selectors = [
        'a[href*="/products/premium-compact-"]',
        '[data-color-code]',
        '.color-item',
        '.product-color',
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const link = el.closest('a') || el;
            const href = link.href || link.getAttribute('href');
            if (href && href.includes('premium-compact-')) {
              const text = el.textContent?.trim() || '';
              const codeMatch = text.match(/(\d{4})/);
              const code = codeMatch ? codeMatch[1] : '';
              const nameMatch = text.match(/\d{4}\s+(.+)/);
              const name = nameMatch ? nameMatch[1].trim() : '';
              
              if (code && name && !extracted.find(c => c.code === code)) {
                extracted.push({
                  code,
                  name,
                  href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
                });
              }
            }
          });
        }
      }
      
      return extracted;
    });
    
    console.log(`Found ${colors.length} colors`);
    
    // If we didn't find enough colors, try a different approach
    if (colors.length < 50) {
      console.log('Trying alternative extraction method...');
      const alternativeColors = await page.evaluate(() => {
        const extracted = [];
        const links = Array.from(document.querySelectorAll('a[href*="premium-compact"]'));
        
        links.forEach(link => {
          const href = link.href || link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          const codeMatch = text.match(/(\d{4})/) || href.match(/premium-compact-(\d{4})/);
          const code = codeMatch ? codeMatch[1] : '';
          
          if (code) {
            const nameMatch = text.match(/\d{4}\s+(.+)/) || text.match(/-([a-z-]+)/i);
            const name = nameMatch ? nameMatch[1].trim().replace(/-/g, ' ').toUpperCase() : '';
            
            if (!extracted.find(c => c.code === code)) {
              extracted.push({
                code,
                name: name || `COLOR ${code}`,
                href: href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`,
              });
            }
          }
        });
        
        return extracted;
      });
      
      if (alternativeColors.length > colors.length) {
        colors.length = 0;
        colors.push(...alternativeColors);
      }
    }
    
    // Sort by code
    colors.sort((a, b) => parseInt(a.code) - parseInt(b.code));
    
    // Generate slugs and SKUs
    const colorsWithSlugs = colors.map(color => {
      const slugName = color.name.toLowerCase().replace(/\s+/g, '-');
      return {
        ...color,
        slug: `premium-compact-${color.code}-${slugName}`,
        sku: null, // Will be extracted from individual color pages if needed
        collection_slug: 'premium-compact',
        collection_name: 'Premium Compact',
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
    const colors = await scrapePremiumCompactColors();
    
    // Save to JSON file
    const outputPath = path.join(__dirname, 'premium-compact-colors.json');
    fs.writeFileSync(outputPath, JSON.stringify(colors, null, 2));
    console.log(`\nSaved ${colors.length} colors to ${outputPath}`);
    
  } catch (error) {
    console.error('Failed to scrape colors:', error);
    process.exit(1);
  }
})();
