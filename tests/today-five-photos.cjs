const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await context.addInitScript(() => { sessionStorage.setItem('alusathi-demo', 'true'); sessionStorage.setItem('alusathi-role', 'farmer'); });
  const page = await context.newPage(); const observed = [];
  try {
    for (let i = 0; i < 5; i++) {
      await page.goto('http://127.0.0.1:4176/farmer#photos');
      await page.locator('.photo-demo-card').nth(i).click();
      await page.locator('.photo-next-action a').waitFor({ timeout: 15000 });
      const photo = await page.evaluate(() => JSON.parse(localStorage.getItem('alusathi-field-actions-v1'))[0]);
      await page.locator('.photo-next-action a').click();
      await page.locator('.today-ai-insight').waitFor();
      assert.ok((await page.locator('.today-ai-insight').innerText()).includes(photo.title));
      assert.equal(await page.locator('.today-ai-insight img').getAttribute('src'), photo.image);
      assert.ok(await page.locator('.today-task').getByText('ছবিভিত্তিক কাজ', { exact: true }).count());
      assert.ok(await page.locator('.today-task').getByText('নিয়মিত কাজ', { exact: true }).count());
      observed.push(await page.locator('.today-task h3').first().innerText());
      assert.equal(await page.locator('.care-auto-spray').getAttribute('data-example'), i >= 3 ? 'true' : 'false');
      if (await page.locator('.care-auto-spray').getAttribute('open') === null) await page.locator('.care-auto-spray > summary').click();
      const spray = await page.locator('.care-auto-spray').innerText();
      if (i >= 3) {
        const rate = page.locator('.care-auto-spray').getByText('প্রতি লিটার পানিতে ২ গ্রাম', { exact: false });
        await rate.waitFor();
        assert.match(await rate.innerText(), i === 3 ? /72 WP/ : /80 WP/);
      }
      else assert.ok(!spray.includes('প্রতি লিটার'));
    }
    assert.equal(new Set(observed).size, 5);
    console.log('Five selected photos: distinct task and observation; spray references only for 4 and 5.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
