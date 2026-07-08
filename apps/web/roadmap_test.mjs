import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto('http://localhost:5173/roadmap', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/roadmap_mobile.png', fullPage: true });
console.log('Screenshot saved');

const result = await page.evaluate(() => {
  const el = document.querySelector('main');
  if (!el) return { error: 'no main' };
  return {
    scrollW: el.scrollWidth,
    clientW: el.clientWidth,
    hasOverflow: el.scrollWidth > el.clientWidth,
  };
});
console.log('Main:', JSON.stringify(result));

await browser.close();
