const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4176';

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Dhaka', serviceWorkers: 'block' });
    page.setDefaultTimeout(8000);
    await page.addInitScript(() => localStorage.setItem('alusathi-lang', 'en'));
    await page.route('**/api.open-meteo.com/**', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(base + '/farmer#diary', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Enter as farmer' }).click();
    const notebook = page.locator('.farm-notebook');
    await notebook.getByRole('button', { name: 'Calculate profit' }).click();
    const dialog = page.getByRole('dialog');
    assert.equal(await dialog.getByRole('button', { name: 'Calculate', exact: true }).isDisabled(), true);
    await page.keyboard.press('Escape');

    await notebook.getByRole('button', { name: 'Add expense', exact: true }).click();
    const form = notebook.locator('.notebook-entry-form');
    await form.getByLabel('Amount').fill('0');
    await form.getByRole('button', { name: 'Save expense' }).click();
    assert.match(await form.getByRole('alert').innerText(), /greater than zero/);
    await form.getByLabel('Amount').fill('1000');
    await form.getByLabel('Note').fill('Seed potatoes');
    await form.getByRole('button', { name: 'Save expense' }).click();
    await form.waitFor({ state: 'hidden' });

    await notebook.getByRole('button', { name: 'Calculate profit' }).click();
    await dialog.getByLabel('How many kg?').fill('100');
    await dialog.getByLabel('Price per kg (৳)').fill('10');
    await dialog.getByRole('button', { name: 'Calculate', exact: true }).click();
    await dialog.getByText('No profit or loss', { exact: true }).waitFor();
    await dialog.getByRole('button', { name: 'Yes, save' }).click();
    await dialog.getByText('Calculation saved to Khata.').waitFor();
    await page.keyboard.press('Escape');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await notebook.getByText('Sale profit/loss estimate', { exact: true }).waitFor();
    assert.match(await notebook.locator('.notebook-totals').innerText(), /৳1,000/);
    assert.deepEqual(errors, []);
    console.log('Khata expense validation, break-even estimate and reload passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
