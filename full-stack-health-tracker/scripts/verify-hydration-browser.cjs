// Only run against an isolated disposable server and synthetic database.
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const base = process.env.TEST_BASE_URL;
if (!base || process.env.ALLOW_SYNTHETIC_BROWSER_TEST !== '1') throw new Error('Set TEST_BASE_URL and ALLOW_SYNTHETIC_BROWSER_TEST=1 for an isolated test database.');
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  try {
    for (const [width, age] of [[320, 30], [390, 30], [768, 30], [1440, 30], [390, 70]]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [], mutations = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method()) && !r.url().endsWith('/api/auth')) mutations.push(r.url()); });
      await page.route('**/api/dashboard', async route => { const response = await route.fetch(); const data = await response.json(); data.user.age = age; data.user.currentWeight = 70; await route.fulfill({ response, json: data }); });
      await page.goto(`${base}/?view=water`, { waitUntil: 'networkidle' });
      const panel = page.getByRole('region', { name: 'Personal hydration guidance' });
      await panel.getByRole('button', { name: 'Explore hydration guidance' }).click();
      for (const name of ['fluidRestriction', 'fluidBalanceCondition', 'pregnantOrBreastfeeding', 'fluidAffectingMedication']) await panel.locator(`[name=${name}]`).selectOption('no');
      for (const [name, value] of Object.entries({ workEnvironment: 'Indoor office / air conditioning', activity: 'sedentary', heat: 'cool', sweating: 'low' })) await panel.locator(`[name=${name}]`).selectOption(value);
      await panel.locator('[name=outdoorHours]').fill('0'); await panel.locator('[name=exerciseMinutes]').fill('0');
      const submit = panel.getByRole('button', { name: 'Review guidance' });
      await submit.click();
      if (age === 70) await panel.getByText(/Individual clinical guidance needed/).waitFor();
      else {
        await panel.getByText(/2,100–2,500 ml per day/).waitFor();
        await panel.locator('[name=fluidRestriction]').selectOption('unsure'); await submit.click();
        await panel.getByText(/More information needed/).waitFor();
        assert.equal(await panel.getByText(/2,100–2,500 ml per day/).count(), 0);
        await panel.locator('[name=fluidRestriction]').selectOption('yes');
        await panel.locator('[name=clinicianFluidMl]').fill('1500');
        await panel.locator('[name=heat]').selectOption('hot'); await submit.click();
        await panel.getByText(/Your clinician-provided amount: 1,500 ml per day/).waitFor();
        assert.equal(await panel.getByText(/2,100–2,500 ml per day/).count(), 0);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
      assert.deepEqual(errors, []); assert.deepEqual(mutations, []);
      console.log(`Passed ${width}px, age ${age}: safety gating, clinician priority and no writes`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
