const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const { initialData } = await import('../public/marketplace/market.mjs');
  const data = initialData();
  const payload = '\"><img src=x onerror="window.__injected=1">';
  Object.assign(data.listings[0], { variety: payload, farmerName: payload, upazila: payload, notes: payload, photo: 'javascript:alert(1)', photos: [{src: 'javascript:alert(1)'}] });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
    await context.addInitScript(value => localStorage.setItem('alusathi-marketplace-pilot-v1', JSON.stringify(value)), data);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4176/marketplace/buyer.html');
    await page.locator('.buyer-catalogue').waitFor();
    assert.ok((await page.locator('.buyer-catalogue').innerText()).includes(payload));
    assert.equal(await page.locator('img[src="javascript:alert(1)"]').count(), 0);
    assert.equal(await page.locator('img[onerror]').count(), 0);
    assert.equal(await page.evaluate(() => window.__injected), undefined);
    console.log('Marketplace listing injection checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
