const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Dhaka', serviceWorkers: 'block' });
  await context.addInitScript(() => {
    sessionStorage.setItem('alusathi-demo', 'true');
    sessionStorage.setItem('alusathi-role', 'farmer');
  });
  const page = await context.newPage();
  try {
    await page.clock.setFixedTime(new Date('2026-11-11T08:00:00+06:00'));
    await page.goto('http://127.0.0.1:4176/farmer#season');
    const season = page.locator('.season-progress');
    const milestones = season.locator('.season-milestones button');
    const slider = season.getByRole('slider');
    await season.waitFor();
    assert.equal(await season.locator('a[href="/farmer#settings"]').count(), 0);
    assert.equal(await season.locator('progress').getAttribute('value'), '8');
    assert.equal(await slider.inputValue(), '8');
    assert.equal(await season.locator('.season-week button').count(), 7);
    await milestones.last().click();
    assert.equal(await slider.inputValue(), '71');
    await page.goto('http://127.0.0.1:4176/farmer#settings');
    await page.locator('.farmer-settings input[type=date]').fill('2026-11-06');
    await page.locator('.farmer-tabs a[href="/farmer"]').click();
    await page.locator('.today-task input').first().check();
    assert.equal(await page.locator('.today-farming-plan').count(), 0);
    await page.locator('.farmer-tabs a[href="/farmer#season"]').click();
    await season.waitFor();
    assert.equal(await page.locator('.farmer-tabs a[aria-current=page]').getAttribute('href'), '/farmer#season');
    assert.equal(await season.locator('progress').getAttribute('value'), '8');
    assert.ok(await season.evaluate(element => element.getBoundingClientRect().width <= 984));
    const week = season.locator('.season-week');
    const details = week.locator('.season-day-details');
    const weekDates = () => week.locator('time').evaluateAll(times => times.map(time => time.dateTime));
    const dates = await weekDates();
    assert.deepEqual(dates, Array.from({ length: 7 }, (_, index) => `2026-11-${String(9 + index).padStart(2, '0')}`));
    assert.equal(await week.locator('[aria-current=date]').getAttribute('aria-pressed'), 'true');
    assert.equal(await week.getByRole('img', { name: 'কাজ শেষ' }).count(), 1);
    assert.match(await details.innerText(), /খাতায় রাখা হয়েছে/);
    for (const tile of await week.getByRole('button').all()) {
      const priorHeading = await details.locator('h3').innerText();
      await tile.click();
      assert.equal(await tile.getAttribute('aria-pressed'), 'true');
      assert.equal(await details.count(), 1);
      assert.notEqual(await details.locator('h3').innerText(), priorHeading);
    }
    assert.doesNotMatch(await details.innerText(), /খাতায় রাখা হয়েছে/);
    const stageActivity = season.locator('.season-stage .season-activity').first();
    const stageIcon = season.locator('.season-stage-heading svg');
    const originalActivity = await stageActivity.innerText();
    const originalIcon = await stageIcon.getAttribute('class');
    assert.ok(await season.locator('.season-stage').evaluate(stage => stage.getBoundingClientRect().bottom <= innerHeight));

    // Regression: exploring a future milestone never changes actual age or persisted farmer data.
    const snapshot = () => page.evaluate(() => ({ ...localStorage }));
    const before = await snapshot();
    const actualText = await season.locator('.season-current').innerText();
    await milestones.nth(3).focus();
    await page.keyboard.press('Enter');
    assert.equal(await slider.inputValue(), '46');
    await slider.fill('60');
    assert.equal(await milestones.nth(3).getAttribute('aria-pressed'), 'true');
    assert.notEqual(await stageActivity.innerText(), originalActivity);
    assert.equal(await stageIcon.getAttribute('class'), await milestones.nth(3).locator('svg').getAttribute('class'));
    assert.equal(originalIcon, await milestones.first().locator('svg').getAttribute('class'));
    assert.equal(await season.locator('.season-activity').count(), 1);
    assert.equal(await season.locator('.season-current').innerText(), actualText);
    assert.equal(await season.locator('progress').getAttribute('value'), '8');
    assert.deepEqual(await snapshot(), before);
    assert.deepEqual(await weekDates(), dates);
    assert.equal(await week.getByRole('button').last().getAttribute('aria-pressed'), 'true');

    for (const [day, stage] of [[1, 'রোপণ'], [14, 'রোপণ'], [15, 'প্রাথমিক বৃদ্ধি'], [31, 'কন্দ গঠন'], [60, 'কন্দ বৃদ্ধি'], [90, 'ফসল সংগ্রহ']]) {
      await slider.fill(String(day));
      assert.equal(await season.locator('.season-stage h2').innerText(), stage);
    }
    for (const [index, start] of [1, 15, 31, 46, 71].entries()) {
      await milestones.nth(index).click();
      assert.equal(await slider.inputValue(), String(start));
      assert.equal(await milestones.nth(index).getAttribute('aria-pressed'), 'true');
    }
    assert.equal(await milestones.locator('svg').count(), 5);
    assert.equal(await season.locator('img, picture, canvas').count(), 0);
    const fertilizer = season.locator('.farming-fertilizer');
    assert.equal(await fertilizer.locator('table').isVisible(), false);
    await fertilizer.locator('summary').click();
    assert.match(await season.locator('.care-land-summary').innerText(), /১ একর/);
    const urea = fertilizer.locator('tbody tr').first();
    const perAcre = await urea.locator('td').nth(1).innerText();
    assert.equal(await urea.locator('td').nth(2).innerText(), perAcre);
    assert.equal(await urea.locator('td').nth(3).innerText(), await urea.locator('td').nth(4).innerText());
    assert.doesNotMatch(await fertilizer.innerText(), /তথ্য প্রয়োজন/);
    await season.locator('.care-land-summary button').click();
    await season.locator('#care-land-editor input').fill('2');
    await season.locator('#care-land-editor button[type=submit]').click();
    assert.equal(await urea.locator('td').nth(1).innerText(), perAcre);
    assert.equal(await urea.locator('td').nth(2).innerText(), '২৫৯–২৮৩.২৮');
    assert.equal(await urea.locator('td').nth(3).innerText(), perAcre);
    assert.equal(await urea.locator('td').nth(4).innerText(), perAcre);
    await page.goto('http://127.0.0.1:4176/farmer#settings');
    await page.locator('.farmer-settings input[type=date]').fill('2026-10-11');
    await page.locator('.farmer-tabs a[href="/farmer#season"]').click();
    assert.equal(await season.locator('progress').getAttribute('value'), '8');
    assert.match(await details.innerText(), /অঙ্কুর/);
    assert.match(await details.innerText(), /খাতায় রাখা হয়েছে/);
    await page.locator('.farmer-tabs a[href="/farmer"]').click();
    assert.match(await page.locator('.today-location').innerText(), /২ একর/);
    await page.locator('.farmer-tabs a[href="/farmer#season"]').click();
    await page.locator('.farmer-more summary').click();
    await page.getByRole('button', { name: 'English', exact: true }).click();
    assert.equal(await season.locator('h1').innerText(), 'The 90-day potato journey');
    assert.match(await season.locator('.season-current').innerText(), /Day 8/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await week.locator('ul').evaluate(list => list.scrollWidth > list.clientWidth));
    console.log('Season stages, keyboard, preview isolation, real weekly dates, Khata, fertilizer, languages and narrow layout passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
