const url = process.argv[2] || 'http://localhost:3000';
const outDir = process.argv[3] || '.';
const timestamp = Date.now();
const filename = `${outDir}/screenshot-${timestamp}.png`;

try {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to bottom to trigger all reveal animations
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const step = window.innerHeight;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await delay(300);
    }
    window.scrollTo(0, 0);
    await delay(500);
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
  await browser.close();
} catch (e) {
  console.log('Playwright not installed. Install with: npm i -D playwright');
  console.log('Then run: npx playwright install chromium');
  console.log(`\nAlternatively, open ${url} in your browser to preview.`);
}
