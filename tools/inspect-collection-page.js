const { chromium } = require('playwright');

async function inspectPage() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  const url = 'https://www.gerflor-cee.com/products/premium-acoustic';
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // Click Colors button
    try {
      const colorButton = await page.$('button:has-text("Colors"), a:has-text("Colors")');
      if (colorButton) {
        await colorButton.click();
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      // Continue
    }
    
    // Scroll and click Show more
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      const showMoreButton = await page.$('button:has-text("Show more"), a:has-text("Show more")');
      if (showMoreButton) {
        await showMoreButton.click();
        await page.waitForTimeout(3000);
      } else {
        break;
      }
    }
    
    // Inspect page structure
    const pageInfo = await page.evaluate(() => {
      const info = {
        allLinks: [],
        linksWithImages: [],
        images: [],
        buttons: [],
        colorSwatches: []
      };
      
      // All links
      const links = Array.from(document.querySelectorAll('a'));
      links.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim() || '';
        const hasImage = link.querySelector('img') !== null;
        
        info.allLinks.push({
          href: href,
          text: text.substring(0, 50),
          hasImage: hasImage
        });
        
        if (hasImage && href && href.includes('/products/')) {
          info.linksWithImages.push({
            href: href,
            text: text.substring(0, 50)
          });
        }
      });
      
      // All images
      const images = Array.from(document.querySelectorAll('img'));
      images.forEach(img => {
        const src = img.getAttribute('src') || '';
        const parent = img.closest('a');
        const parentHref = parent?.getAttribute('href') || '';
        
        info.images.push({
          src: src.substring(0, 100),
          parentHref: parentHref,
          alt: img.getAttribute('alt') || ''
        });
      });
      
      // Buttons
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      buttons.forEach(btn => {
        info.buttons.push({
          text: btn.textContent?.trim().substring(0, 50),
          className: btn.className || ''
        });
      });
      
      // Look for color swatches (common patterns)
      const swatches = Array.from(document.querySelectorAll('[class*="swatch"], [class*="color"], [class*="tile"], [data-color]'));
      swatches.forEach(swatch => {
        const parent = swatch.closest('a');
        info.colorSwatches.push({
          className: swatch.className || '',
          parentHref: parent?.getAttribute('href') || '',
          text: swatch.textContent?.trim().substring(0, 50)
        });
      });
      
      return info;
    });
    
    console.log('\n📊 Page Structure Analysis:\n');
    console.log(`Total links: ${pageInfo.allLinks.length}`);
    console.log(`Links with images: ${pageInfo.linksWithImages.length}`);
    console.log(`Total images: ${pageInfo.images.length}`);
    console.log(`Buttons: ${pageInfo.buttons.length}`);
    console.log(`Color swatches: ${pageInfo.colorSwatches.length}\n`);
    
    console.log('Sample links with images:');
    pageInfo.linksWithImages.slice(0, 10).forEach(link => {
      console.log(`  ${link.href} - ${link.text}`);
    });
    
    console.log('\nSample images:');
    pageInfo.images.slice(0, 10).forEach(img => {
      console.log(`  ${img.parentHref} - ${img.alt}`);
    });
    
    console.log('\nSample color swatches:');
    pageInfo.colorSwatches.slice(0, 10).forEach(swatch => {
      console.log(`  ${swatch.parentHref} - ${swatch.className}`);
    });
    
    console.log('\n\nPritisni ENTER da zatvorim browser...');
    await new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspectPage().catch(console.error);
