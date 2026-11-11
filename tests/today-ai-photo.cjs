const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await context.addInitScript(() => { sessionStorage.setItem('alusathi-demo', 'true'); sessionStorage.setItem('alusathi-role', 'farmer'); });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4176/farmer#photos');
    for (const name of ['potato-diamant.jpg', 'potato-diamant-side.jpg', 'potato-diamant.jpg']) {
      await page.locator('.potato-scan input[type=file]').setInputFiles(path.join(__dirname, 'fixtures', name));
      await page.getByRole('button', { name: 'ছবি পরীক্ষা করুন' }).click();
      await page.waitForFunction(() => !document.querySelector('.potato-scan button .animate-spin'), null, { timeout: 120000 });
      const result = await page.evaluate(() => JSON.parse(localStorage.getItem('alusathi-field-actions-v1') || '[]').find(x => x.tuberModelResult));
      if (result) break;
    }
    const result = await page.evaluate(() => JSON.parse(localStorage.getItem('alusathi-field-actions-v1') || '[]').find(x => x.tuberModelResult));
    assert.ok(result, 'A real model result was not saved for the fixture');
    await page.goto('http://127.0.0.1:4176/farmer');
    const insight = page.locator('.today-ai-insight');
    await insight.getByText('ছবির মডেলের ফল').waitFor();
    assert.ok((await insight.innerText()).includes(result.body));
    assert.match(await insight.locator('img').getAttribute('src'), /^data:image\/jpeg;base64,/);
    assert.ok(await page.locator('.today-task').getByText(result.tuberModelResult === 'healthy' ? 'আলুটি ঘুরিয়ে নরম বা ভেজা অংশ আছে কি না দেখুন।' : 'আলুটি আলাদা করে দাগ আছে কি না দেখুন।', { exact: true }).count());
    console.log(`Actual tuber model output displayed: ${result.tuberModelResult}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
