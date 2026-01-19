const { chromium } = require('playwright');

async function testFindButtons() {
  console.log('🔍 Testing download button locations...\n');

  const browser = await chromium.launch({ 
    headless: false, 
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  const acceptCookies = async () => {
    const btn = page.locator('#onetrust-accept-btn-handler').first();
    if (await btn.count()) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
  };

  // Test with one color page
  const testUrl = 'https://www.gerflor-cee.com/products/mipolam-accord-0301-louise-85860301';
  
  console.log(`Opening: ${testUrl}\n`);
  await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await acceptCookies();
  await page.waitForTimeout(3000);

  console.log('=== LOOKING FOR DOWNLOAD BUTTONS ===\n');

  // Search for all buttons on page
  const allButtons = await page.$$eval('button, a', (elements) => {
    return elements.map((el, index) => {
      const text = el.textContent?.trim() || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const title = el.getAttribute('title') || '';
      const className = el.className || '';
      const tagName = el.tagName;
      const isVisible = el.offsetParent !== null;
      
      return {
        index,
        tagName,
        text: text.substring(0, 50),
        ariaLabel,
        title,
        className: className.substring(0, 100),
        isVisible
      };
    }).filter(btn => 
      btn.isVisible && (
        btn.text.toLowerCase().includes('download') ||
        btn.text.toLowerCase().includes('jpg') ||
        btn.text.toLowerCase().includes('preuzmi') ||
        btn.ariaLabel.toLowerCase().includes('download') ||
        btn.title.toLowerCase().includes('download') ||
        btn.className.toLowerCase().includes('download')
      )
    );
  });

  console.log(`Found ${allButtons.length} potential download buttons:\n`);
  allButtons.forEach((btn, i) => {
    console.log(`${i + 1}. ${btn.tagName}`);
    console.log(`   Text: "${btn.text}"`);
    console.log(`   Aria-label: "${btn.ariaLabel}"`);
    console.log(`   Title: "${btn.title}"`);
    console.log(`   Class: "${btn.className}"`);
    console.log('');
  });

  // Also search for SVG icons
  const svgIcons = await page.$$eval('svg, button:has(svg)', (elements) => {
    return elements.map((el, index) => {
      const parent = el.closest('button, a');
      if (!parent) return null;
      
      const text = parent.textContent?.trim() || '';
      const ariaLabel = parent.getAttribute('aria-label') || '';
      const className = parent.className || '';
      const isVisible = parent.offsetParent !== null;
      
      if (!isVisible) return null;
      
      return {
        index,
        text: text.substring(0, 50),
        ariaLabel,
        className: className.substring(0, 100)
      };
    }).filter(Boolean);
  });

  console.log(`\nFound ${svgIcons.length} buttons with SVG icons:\n`);
  svgIcons.forEach((btn, i) => {
    console.log(`${i + 1}. Text: "${btn.text}"`);
    console.log(`   Aria-label: "${btn.ariaLabel}"`);
    console.log(`   Class: "${btn.className}"`);
    console.log('');
  });

  console.log('\n⏸️  Pauza - proveri Chrome prozor i kaži mi koje dugme da kliknem');
  console.log('Čekam 60 sekundi...\n');
  
  await page.waitForTimeout(60000);

  await browser.close();
}

testFindButtons().catch(console.error);
