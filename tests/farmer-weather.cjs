const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:4175';

(async () => {
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: "Asia/Dhaka", serviceWorkers: 'block' });
    await context.addInitScript(() => { sessionStorage.setItem('alusathi-demo', 'true'); sessionStorage.setItem('alusathi-role', 'farmer'); localStorage.setItem('alusathi-lang', 'en'); });
    await context.route('https://geocoding-api.open-meteo.com/**', route => route.fulfill({ json: { results: [{ latitude: 25.7, longitude: 89.3 }] } }));
    const forecastUrls = [];
    await context.route('https://api.open-meteo.com/**', route => { forecastUrls.push(route.request().url()); return route.fulfill({ json: {
      current: { temperature_2m: 20, relative_humidity_2m: 87, precipitation: 0, weather_code: 3 },
      daily: { time: ['2026-10-08', '2026-10-09', '2026-10-10'], temperature_2m_min: [17, 18, 18], temperature_2m_max: [25, 26, 27], precipitation_sum: [50, 12, 5], wind_gusts_10m_max: [8, 15, 12], weather_code: [3, 61, 3] },
      hourly: { time: ['2026-10-08', '2026-10-09'].flatMap(date => Array.from({ length: 24 }, (_, hour) => `${date}T${String(hour).padStart(2, '0')}:00`)), temperature_2m: Array(48).fill(18), relative_humidity_2m: Array(48).fill(95) },
    } }); });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-08T06:00:00+06:00'));
    await page.goto(`${base}/farmer#settings`);
    await page.locator('.farmer-settings input[type=date]').fill('2026-09-18');
    await page.locator('.farmer-settings select').selectOption('Kurigram');
    await page.locator('.farmer-tabs a[href="/farmer"]').filter({ visible: true }).first().click();
    const conditions = page.locator('.today-weather-card');
    await conditions.getByText('Cloudy now', { exact: true }).waitFor();
    await conditions.getByText('Heavy rain is forecast.', { exact: true }).waitFor();
    await page.locator('.today-task').first().getByText('Heavy rain is forecast.', { exact: true }).waitFor();
    assert.match(await page.locator('.today-crop-context').innerText(), /Day 20/);
    assert.ok(forecastUrls.some(url => url.includes('latitude=25.81') && url.includes('longitude=89.64')), 'Weather uses Kurigram coordinates');
    assert.deepEqual(errors, []);
    await context.close();
    console.log('Planting date, district weather and matching forecast task passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
