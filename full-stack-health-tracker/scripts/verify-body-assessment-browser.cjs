// Run against an isolated synthetic-data server only: TEST_BASE_URL=... [CHROMIUM_PATH=...] node scripts/verify-body-assessment-browser.cjs
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const base = process.env.TEST_BASE_URL;
if (!base) throw new Error('Set TEST_BASE_URL to an isolated synthetic-data server; never run this test against production.');
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  try {
    for (const [width, age] of [[320, 30], [390, 30], [768, 30], [1440, 30], [390, 19]]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [], mutations = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()) && !request.url().endsWith('/api/auth')) mutations.push(`${request.method()} ${request.url()}`); });
      await page.route('**/api/dashboard', async route => {
        const response = await route.fetch();
        const data = await response.json();
        data.user.age = age; data.user.height = 175; data.user.currentWeight = 82; data.user.targetWeight = 75;
        await route.fulfill({ response, json: data });
      });
      await page.goto(`${base}/?view=profile`, { waitUntil: 'networkidle' });
      const section = page.getByRole('region', { name: 'My Body Assessment' });
      await section.getByRole('button', { name: 'Explore my assessment' }).click();
      if (age < 20) {
        await section.getByText(/Adult BMI categories and reference weights are not shown/).waitFor();
        assert.equal(await section.getByText('BMI', { exact: true }).count(), 0);
      } else {
        const calculate = section.getByRole('button', { name: 'View screening reference' });
        assert.equal(await calculate.isDisabled(), true);
        await section.getByLabel(/Does a standard adult BMI reference apply/).selectOption('pregnant-or-postpartum');
        await calculate.click();
        await section.getByText(/standard BMI reference may not be appropriate/).waitFor();
        assert.equal(await section.getByText('BMI', { exact: true }).count(), 0);
        await section.getByLabel(/Population reference/).selectOption('south-asian');
        await section.getByLabel(/Does a standard adult BMI reference apply/).selectOption('standard');
        await calculate.click();
        await section.getByText('26.8', { exact: true }).waitFor();
        await section.getByText('56.7–76.3 kg').waitFor();
        await section.getByText(/Additional Asian population screening action point/).waitFor();
        await section.getByLabel(/Population reference/).selectOption('other');
        await calculate.click();
        assert.equal(await section.getByText(/Additional Asian population screening action point/).count(), 0);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
      assert.deepEqual(errors, []); assert.deepEqual(mutations, []);
      console.log(`Passed: ${width}px, age ${age}, safety, output and no writes`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
