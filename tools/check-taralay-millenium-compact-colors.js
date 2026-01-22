const fs = require('fs');
const path = require('path');

// Navigate to Taralay Millenium Compact page and scrape all colors
async function scrapeTaralayMilleniumCompactColors() {
  const url = 'https://www.gerflor-cee.com/products/taralay-millenium-compact';
  
  console.log('Opening browser...');
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to Taralay Millenium Compact page...');
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
        'a[href*="/products/taralay-millenium-compact-"]',
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
            if (href && href.includes('taralay-millenium-compact-')) {
              const text = el.textContent?.trim() || '';
              const codeMatch = text.match(/(\d{4})/) || href.match(/taralay-millenium-compact-(\d{4})/);
              const code = codeMatch ? codeMatch[1] : '';
              
              if (code) {
                // Try to extract name
                const nameMatch = text.match(/\d{4}\s+(.+)/i) || 
                                 text.match(/-([a-z-]+)/i) ||
                                 href.match(/taralay-millenium-compact-\d{4}-(.+?)(?:-hd|\?|$)/i);
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
      
      // Alternative: look for all links with taralay-millenium-compact
      if (extracted.length < 20) {
        const allLinks = Array.from(document.querySelectorAll('a[href*="taralay-millenium-compact"]'));
        allLinks.forEach(link => {
          const href = link.href || link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          const codeMatch = href.match(/taralay-millenium-compact-(\d{4})/) || text.match(/(\d{4})/);
          const code = codeMatch ? codeMatch[1] : '';
          
          if (code && !extracted.find(c => c.code === code)) {
            const nameMatch = text.match(/\d{4}\s+(.+)/i) || 
                             href.match(/taralay-millenium-compact-\d{4}-(.+?)(?:-hd|\?|$)/i);
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
    const colors = await scrapeTaralayMilleniumCompactColors();
    
    // Save to JSON file
    const outputPath = path.join(__dirname, 'taralay-millenium-compact-colors.json');
    fs.writeFileSync(outputPath, JSON.stringify(colors, null, 2));
    console.log(`\nSaved ${colors.length} colors to ${outputPath}`);
    
    // Compare with Millenium Acoustic colors
    if (fs.existsSync('tools/taralay-millenium-acoustic-colors.json')) {
      const acousticColors = JSON.parse(fs.readFileSync('tools/taralay-millenium-acoustic-colors.json', 'utf8'));
      console.log(`\n=== Comparison with Taralay Millenium Acoustic ===`);
      console.log(`Taralay Millenium Acoustic: ${acousticColors.length} colors`);
      console.log(`Taralay Millenium Compact: ${colors.length} colors`);
      
      // Find which colors are in Compact
      const compactCodes = new Set(colors.map(c => c.code));
      const acousticCodes = new Set(acousticColors.map(c => c.code));
      const inCompact = colors.filter(c => acousticCodes.has(c.code));
      const onlyInCompact = colors.filter(c => !acousticCodes.has(c.code));
      const onlyInAcoustic = acousticColors.filter(c => !compactCodes.has(c.code));
      
      console.log(`\nColors in Compact that match Acoustic: ${inCompact.length}/${colors.length}`);
      console.log(`Colors ONLY in Compact (new): ${onlyInCompact.length}`);
      console.log(`Colors ONLY in Acoustic (not in Compact): ${onlyInAcoustic.length}`);
      
      if (onlyInCompact.length > 0) {
        console.log(`\n⚠ NEW colors in Compact (${onlyInCompact.length}):`);
        onlyInCompact.forEach(c => console.log(`  ${c.code} ${c.name}`));
      }
      
      if (onlyInAcoustic.length > 0) {
        console.log(`\n⚠ Colors in Acoustic but NOT in Compact (${onlyInAcoustic.length}):`);
        onlyInAcoustic.slice(0, 10).forEach(c => console.log(`  ${c.code} ${c.name}`));
        if (onlyInAcoustic.length > 10) {
          console.log(`  ... and ${onlyInAcoustic.length - 10} more`);
        }
      }
      
      if (inCompact.length === colors.length && onlyInCompact.length === 0 && onlyInAcoustic.length === 0) {
        console.log(`\n=== CONCLUSION ===`);
        console.log(`✓ All ${colors.length} colors in Taralay Millenium Compact are the SAME as Taralay Millenium Acoustic`);
        console.log(`✓ These collections use identical colors`);
      } else if (inCompact.length === colors.length && onlyInAcoustic.length > 0) {
        console.log(`\n=== CONCLUSION ===`);
        console.log(`✓ All colors in Compact exist in Acoustic`);
        console.log(`⚠ But Acoustic has ${onlyInAcoustic.length} additional colors`);
        console.log(`⚠ Compact is a SUBSET of Acoustic`);
      } else {
        console.log(`\n=== CONCLUSION ===`);
        console.log(`⚠ Taralay Millenium Compact has ${onlyInCompact.length} NEW colors that don't exist in Acoustic`);
        console.log(`⚠ These are DIFFERENT colors, not the same`);
      }
    } else {
      console.log('\n⚠ Taralay Millenium Acoustic colors file not found for comparison');
    }
    
  } catch (error) {
    console.error('Failed to scrape colors:', error);
    process.exit(1);
  }
})();
