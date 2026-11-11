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
    const track = season.locator('.season-calendar-grid');
    const previewDay = () => track.locator('[aria-pressed=true]').getAttribute('data-day');
    await season.waitFor();
    assert.equal(await season.locator('a[href="/farmer#settings"]').count(), 0);
    assert.equal(await season.locator('progress').getAttribute('value'), '8');
    assert.equal(await previewDay(), '8');
    assert.equal(await track.locator('button').count(), 7);
    await milestones.last().click();
    assert.equal(await previewDay(), '71');
    await season.locator('.season-calendar-controls button').last().press('Enter');
    assert.equal(await previewDay(), '90');
    await season.locator('.season-calendar-controls button').first().click();
    assert.ok(Number(await previewDay()) < 90);
    await season.locator('.season-calendar-controls button').nth(1).click();
    assert.equal(await previewDay(), '8');
    assert.equal(await season.locator('.season-week-map').count(), 0);
    await page.goto('http://127.0.0.1:4176/farmer#settings');
    await page.locator('.farmer-settings input[type=date]').fill('2026-11-06');
    await page.locator('.farmer-tabs a[href="/farmer"]').click();
    await page.locator('.today-task input').first().check();
    assert.equal(await page.locator('.today-farming-plan').count(), 0);
    await page.locator('.farmer-tabs a[href="/farmer#season"]').click();
    await season.waitFor();
    assert.equal(await page.locator('.farmer-tabs a[aria-current=page]').getAttribute('href'), '/farmer#season');
    assert.equal(await season.locator('progress').getAttribute('value'), '8');
    const journey = season.locator('.season-journey');
    const upcoming = season.locator('.season-upcoming');
    const week = season.locator('.season-week');
    const strip = season.locator('.season-reference-strip');
    const [left, right, planner, references] = await Promise.all([journey, upcoming, week, strip].map(panel => panel.boundingBox()));
    assert.ok(left.x + left.width < right.x && Math.abs(left.y - right.y) <= 1);
    assert.ok(right.y + right.height < planner.y && Math.abs(left.x - planner.x) <= 1);
    assert.ok(Math.max(left.y + left.height, planner.y + planner.height) < references.y);
    assert.equal(await upcoming.getByRole('heading').innerText(), 'সামনে গুরুত্বপূর্ণ কাজ');
    assert.equal(await upcoming.locator('li').count(), 4);
    const upcomingText = await upcoming.innerText();
    const details = week.locator('.season-day-details');
    const weekDates = () => week.locator('time').evaluateAll(times => times.map(time => time.dateTime));
    const dates = await weekDates();
    assert.deepEqual(dates, Array.from({ length: 7 }, (_, index) => `2026-11-${String(9 + index).padStart(2, '0')}`));
    assert.equal(await week.locator('[aria-current=date]').getAttribute('aria-pressed'), 'true');
    assert.equal(await week.getByRole('img', { name: 'কাজ শেষ' }).count(), 1);
    assert.match(await details.innerText(), /খাতায় রাখা হয়েছে/);
    for (const tile of await track.locator('button:not(:disabled)').all()) {
      const priorHeading = await details.locator('h3').innerText();
      await tile.click();
      assert.equal(await tile.getAttribute('aria-pressed'), 'true');
      assert.equal(await details.count(), 1);
      assert.notEqual(await details.locator('h3').innerText(), priorHeading);
    }
    assert.doesNotMatch(await details.innerText(), /খাতায় রাখা হয়েছে/);
    await season.locator('.season-calendar-controls button').nth(1).click();
    const stageActivity = season.locator('.season-stage .season-activity').first();
    const stageIcon = season.locator('.season-stage-heading svg');
    const originalActivity = await stageActivity.innerText();
    const originalIcon = await stageIcon.getAttribute('class');
    assert.ok(await season.locator('.season-stage').evaluate(stage => stage.getBoundingClientRect().bottom <= innerHeight));

    // Regression: exploring a future milestone never changes actual age or persisted farmer data.
    const snapshot = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => !key.startsWith('alusathi-weather-'))));
    const before = await snapshot();
    const actualText = await season.locator('.season-current').innerText();
    await milestones.nth(3).focus();
    await page.keyboard.press('Enter');
    assert.equal(await previewDay(), '46');
    await season.locator('.season-calendar-controls button').nth(2).click();
    await season.locator('.season-calendar-controls button').nth(2).click();
    await track.locator('[data-day="60"]').click();
    assert.equal(await milestones.nth(3).getAttribute('aria-pressed'), 'true');
    assert.notEqual(await stageActivity.innerText(), originalActivity);
    assert.equal(await stageIcon.getAttribute('class'), await milestones.nth(3).locator('svg').getAttribute('class'));
    assert.equal(originalIcon, await milestones.first().locator('svg').getAttribute('class'));
    assert.equal(await season.locator('.season-activity').count(), 1);
    assert.equal(await season.locator('.season-current').innerText(), actualText);
    assert.equal(await season.locator('progress').getAttribute('value'), '8');
    assert.deepEqual(await snapshot(), before);
    assert.notDeepEqual(await weekDates(), dates);
    assert.equal(await upcoming.innerText(), upcomingText);
    assert.equal(await previewDay(), '60');

    for (const [index, stage] of ['রোপণ', 'প্রাথমিক বৃদ্ধি', 'কন্দ গঠন', 'কন্দ বৃদ্ধি', 'ফসল সংগ্রহ'].entries()) {
      await milestones.nth(index).click();
      assert.equal(await season.locator('.season-stage h2').innerText(), stage);
    }
    for (const [index, start] of [1, 15, 31, 46, 71].entries()) {
      await milestones.nth(index).click();
      assert.equal(await previewDay(), String(start));
      assert.equal(await milestones.nth(index).getAttribute('aria-pressed'), 'true');
    }
    assert.equal(await milestones.locator('svg').count(), 5);
    assert.equal(await season.locator('.season-journey img, .season-week img').count(), 0);
    assert.equal(await strip.locator('.season-card').count(), 3);
    await page.waitForFunction(() => {
      const images = [...document.querySelectorAll('.season-reference-strip img')];
      return images.length === 3 && images.every(img => img.complete && img.naturalWidth > 0);
    });
    assert.equal(new Set(await strip.locator('.season-card').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().top))).size, 1);
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
    assert.equal(await upcoming.getByRole('heading').innerText(), 'Important work ahead');
    assert.match(await season.locator('.season-current').innerText(), /Day 8/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await week.locator('ul').evaluate(list => list.scrollWidth > list.clientWidth));
    console.log('Desktop columns, upcoming work, season stages, keyboard, preview isolation, weekly dates, Khata, fertilizer, languages and narrow layout passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
