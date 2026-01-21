const { chromium } = require('playwright');

async function checkPage19() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    const url = 'https://www.gerflor-cee.com/category/heterogeneous-rolls?page=19';
    console.log(`Checking: ${url}\n`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Click Colors button
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
      if (colorButton) {
        await colorButton.click();
        console.log('✓ Clicked colors button');
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log('Could not click colors button');
    }
    
    // Scroll and click show more
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more")');
      if (showMoreButton) {
        await showMoreButton.click();
        console.log(`  Clicked "Show more" ${i + 1} times`);
        await page.waitForTimeout(3000);
      } else {
        break;
      }
    }
    
    // Extract colors
    const colors = await page.evaluate(() => {
      const found = [];
      const seen = new Set();
      
      const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const fullUrl = href.startsWith('http') ? href : `https://www.gerflor-cee.com${href}`;
        const match = fullUrl.match(/\/([^/]+)-(\d{4})-([a-z-]+)-(\d+)$/);
        
        if (match && !seen.has(fullUrl)) {
          seen.add(fullUrl);
          const [, collectionSlug] = match;
          found.push({
            collection: collectionSlug,
            url: fullUrl
          });
        }
      });
      
      return found;
    });
    
    // Group by collection
    const collections = new Map();
    colors.forEach(c => {
      if (!collections.has(c.collection)) {
        collections.set(c.collection, []);
      }
      collections.get(c.collection).push(c);
    });
    
    console.log(`\nFound ${colors.length} colors from ${collections.size} collections:\n`);
    collections.forEach((colors, collection) => {
      console.log(`  ${collection}: ${colors.length} colors`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkPage19().catch(console.error);
