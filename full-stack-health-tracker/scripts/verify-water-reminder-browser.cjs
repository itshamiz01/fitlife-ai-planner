// Only run against a disposable server and synthetic database.
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const base = process.env.TEST_BASE_URL;
if (!base || process.env.ALLOW_SYNTHETIC_BROWSER_TEST !== '1') throw new Error('Set TEST_BASE_URL and ALLOW_SYNTHETIC_BROWSER_TEST=1 for an isolated test database.');
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [], writes = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => { if (r.url().includes('/api/records') && r.method() === 'POST') writes.push(JSON.parse(r.postData())); });
      await page.goto(`${base}/?view=water&reminder=confirm`, { waitUntil: 'networkidle' });
      const dialog = page.getByRole('dialog', { name: 'A little sip, a little better.' });
      await expect(dialog).toBeVisible(); assert.equal(writes.length, 0);
      assert.equal(new URL(page.url()).searchParams.has('reminder'), false);
      await dialog.getByRole('button', { name: 'Remind me in 10 minutes' }).click();
      await expect(dialog).toHaveCount(0); assert.equal(writes.length, 0);
      await page.getByRole('button', { name: 'Try a reminder' }).click();
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Yes, log my water' }).click();
      assert.equal(writes.length, 0);
      await dialog.getByLabel('Amount you drank (ml)').fill('175');
      const saved = page.waitForResponse(r => r.url().includes('/api/records') && r.request().method() === 'POST');
      await dialog.getByRole('button', { name: 'Yes, log my water' }).click();
      assert.equal((await saved).status(), 200);
      await expect(dialog).toHaveCount(0);
      assert.equal(writes.length, 1); assert.equal(writes[0].amount, 175); assert.equal(writes[0].resource, 'water');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      console.log(`Passed ${width}px: notification open, snooze, required amount and single confirmed write`);
      await page.close();
    }
    // One reminder ID retried from separate tabs for the same account, then another account.
    const context = await browser.newContext();
    const first = await context.newPage(); await first.goto(base, { waitUntil: 'networkidle' });
    const second = await context.newPage(); await second.goto(base, { waitUntil: 'networkidle' });
    const before = await (await context.request.get(`${base}/api/dashboard`)).json();
    const key = require('node:crypto').randomUUID();
    const body = { resource: 'water', amount: 185, date: new Date().toISOString().slice(0, 10), time: '12:00', idempotencyKey: key };
    const post = (client, values) => client.post(`${base}/api/records`, { data: values });
    assert.equal((await post(context.request, body)).status(), 200);
    assert.equal((await post(context.request, body)).status(), 200);
    assert.equal((await post(context.request, { ...body, amount: 200 })).status(), 409);
    const after = await (await context.request.get(`${base}/api/dashboard`)).json();
    assert.equal(after.waterLogs.length, before.waterLogs.length + 1);
    const other = await browser.newContext(); const otherPage = await other.newPage(); await otherPage.goto(base, { waitUntil: 'networkidle' });
    const otherBefore = await (await other.request.get(`${base}/api/dashboard`)).json();
    assert.notEqual(otherBefore.user.id, before.user.id);
    assert.equal((await post(other.request, body)).status(), 200);
    const otherAfter = await (await other.request.get(`${base}/api/dashboard`)).json();
    assert.equal(otherAfter.waterLogs.length, otherBefore.waterLogs.length + 1);
    assert.equal((await (await context.request.get(`${base}/api/dashboard`)).json()).waterLogs.length, after.waterLogs.length);
    await other.close(); await context.close();
    console.log('Passed: same-account retries deduplicated; changed amount rejected; independent account isolated');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
