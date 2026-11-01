const { chromium, expect, request } = require('@playwright/test');
const assert = require('node:assert/strict');
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const email = `wellnest-test-${Date.now()}@example.com`;
const password = 'Fit Life Bro-Safe-2026!';
const checks = [];
const mark = name => { checks.push(name); console.log(`✓ ${name}`); };
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = async () => { const response = await page.request.get(`${BASE}/api/dashboard`); assert.equal(response.status(), 200); return response.json(); };
  async function navigate(name) { await page.getByRole('link', { name, exact: true }).click(); }
  async function saved(button, endpoint = '/api/records') {
    const pending = page.waitForResponse(response => response.url().endsWith(endpoint) && response.request().method() !== 'GET');
    await button.click(); const response = await pending; assert.equal(response.ok(), true, await response.text());
    if (endpoint === '/api/auth') {
      const result = await response.json();
      if (result.recoveryKey) {
        await page.getByRole('checkbox', { name: 'I’ve saved my recovery key', exact: true }).check();
        await page.getByRole('button', { name: 'Continue to my health profile', exact: true }).click();
      }
    }
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  async function field(name, value) { const dialog = page.getByRole('dialog'); const scope = await dialog.count() ? dialog : page; await scope.locator(`[name="${name}"]`).fill(String(value)); }
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  let data = await state();
  assert.equal(data.meals.length, 28); assert.equal(data.workouts.length, 14); assert.equal(data.weightLogs.length, 8);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  mark('Realistic private demo and desktop layout');

  const beforeWater = data.waterLogs.length;
  const waterResponse = page.waitForResponse(r => r.url().endsWith('/api/records') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Log water', exact: true }).click();
  assert.equal((await waterResponse).ok(), true);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal((await state()).waterLogs.length, beforeWater + 1);
  mark('Optimistic quick water logging persists after reload');

  await navigate('Meal planner');
  await page.getByRole('button', { name: 'Add a meal', exact: true }).click();
  await field('name', 'A fresh rainbow bowl'); await field('portion', '1 bowl · 350 g');
  await field('description', '100 g chickpeas, 100 g quinoa, and 150 g vegetables.');
  await saved(page.getByRole('button', { name: 'Add to my plan', exact: true }));
  let card = page.locator('.meal-card').filter({ hasText: 'A fresh rainbow bowl' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Edit meal', exact: true }).click();
  await field('name', 'My colorful quinoa bowl');
  await saved(page.getByRole('button', { name: 'Save my meal', exact: true }));
  card = page.locator('.meal-card').filter({ hasText: 'My colorful quinoa bowl' });
  const completion = page.waitForResponse(r => r.url().endsWith('/api/records') && r.request().method() === 'PATCH');
  await card.getByRole('button', { name: 'Complete My colorful quinoa bowl', exact: true }).click();
  assert.equal((await completion).ok(), true);
  assert.equal((await state()).meals.find(m => m.name === 'My colorful quinoa bowl').completed, true);
  await card.getByRole('button', { name: 'Delete My colorful quinoa bowl', exact: true }).click();
  await saved(page.getByRole('button', { name: 'Delete entry', exact: true }));
  assert.equal((await state()).meals.length, 28);
  mark('Meal creation, edit, completion, and deletion');

  await navigate('My workouts');
  await page.getByRole('button', { name: 'Add an activity', exact: true }).click();
  await field('name', 'An evening garden walk'); await field('duration', 20);
  await saved(page.getByRole('button', { name: 'Add to my week', exact: true }));
  let workout = page.locator('.workout-card').filter({ hasText: 'An evening garden walk' });
  await workout.getByRole('button', { name: 'Edit An evening garden walk', exact: true }).click();
  await field('name', 'A mindful evening walk'); await field('duration', 25);
  await saved(page.getByRole('button', { name: 'Save my activity', exact: true }));
  workout = page.locator('.workout-card').filter({ hasText: 'A mindful evening walk' });
  const done = page.waitForResponse(r => r.url().endsWith('/api/records') && r.request().method() === 'PATCH');
  await workout.getByRole('button', { name: 'Mark as complete', exact: true }).click();
  assert.equal((await done).ok(), true);
  await workout.getByRole('button', { name: 'Delete A mindful evening walk', exact: true }).click();
  await saved(page.getByRole('button', { name: 'Delete entry', exact: true }));
  assert.equal((await state()).workouts.length, 14);
  mark('Workout creation, edit, completion, and deletion');

  await navigate('Water tracker');
  await page.getByRole('button', { name: 'Log water', exact: true }).click();
  await field('amount', 350);
  await saved(page.getByRole('button', { name: 'Log my water break', exact: true }));
  let waterRow = page.locator('tbody tr').filter({ has: page.locator('td strong', { hasText: /^350$/ }) });
  await waterRow.getByRole('button', { name: /Edit 350 ml/ }).click(); await field('amount', 450);
  await saved(page.getByRole('button', { name: 'Save water break', exact: true }));
  waterRow = page.locator('tbody tr').filter({ has: page.locator('td strong', { hasText: /^450$/ }) });
  await waterRow.getByRole('button', { name: 'Delete water log', exact: true }).click();
  await saved(page.getByRole('button', { name: 'Delete entry', exact: true }));
  assert.equal((await state()).waterLogs.length, beforeWater + 1);
  const reminderSave = page.waitForResponse(r => r.url().endsWith('/api/profile') && r.request().method() === 'PATCH');
  await page.getByRole('switch', { name: 'Enable water intake alarm', exact: true }).click();
  assert.equal((await reminderSave).ok(), true);
  await page.getByRole('button', { name: 'Try a reminder', exact: true }).click();
  await expect(page.locator('.water-alarm')).toBeVisible();
  await page.getByRole('button', { name: 'Remind me in 10 minutes', exact: true }).click();
  await expect(page.locator('.water-alarm')).toHaveCount(0);
  await page.locator('.date-filter input').fill('2000-01-01');
  await expect(page.getByRole('heading', { name: 'Your first sip is a fresh start', exact: true })).toBeVisible();
  mark('Water CRUD, configurable alarm, snooze, and empty state');

  await navigate('My progress');
  await page.getByRole('button', { name: 'Log a check-in', exact: true }).click();
  await field('weight', 76.2); await field('note', 'A browser-verified little milestone');
  await saved(page.getByRole('button', { name: 'Log my check-in', exact: true }));
  assert.equal((await state()).user.currentWeight, 76.2);
  let weightRow = page.locator('tbody tr').filter({ hasText: 'A browser-verified little milestone' });
  await weightRow.getByRole('button', { name: /Edit check-in/ }).click(); await field('weight', 76.1);
  await saved(page.getByRole('button', { name: 'Save my check-in', exact: true }));
  assert.ok(Math.abs((await state()).user.currentWeight - 76.1) < .001);
  weightRow = page.locator('tbody tr').filter({ hasText: 'A browser-verified little milestone' });
  await weightRow.getByRole('button', { name: 'Delete weight check-in', exact: true }).click();
  await saved(page.getByRole('button', { name: 'Delete entry', exact: true }));
  assert.equal((await state()).user.currentWeight, 76.5);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress', exact: true }).click();
  assert.equal((await download).suggestedFilename(), 'fit-life-bro-my-progress.csv');
  mark('Weight CRUD, synchronized profile, chart, and CSV export');

  await page.getByRole('button', { name: /Demo workspace/ }).click();
  await field('name', 'Jamie Rivers'); await field('email', email); await field('password', password); await field('confirmPassword', password);
  await saved(page.getByRole('button', { name: 'Start my healthier chapter', exact: true }), '/api/auth');
  await expect(page.getByRole('heading', { name: 'Your health story starts with you.', exact: true })).toBeVisible();
  data = await state(); assert.equal(data.user.isDemo, false); assert.equal(data.user.email, email); assert.equal(data.waterLogs.length, beforeWater + 1);
  const accountId = data.user.id;
  await page.locator('input[name="name"]').fill('Jamie Rivers');
  await page.locator('input[name="currentWeight"]').fill('72');
  await page.locator('label.goal-option').filter({ hasText: 'Build healthy weight' }).click();
  await page.locator('input[name="targetWeight"]').fill('78');
  await page.locator('select[name="diet"]').selectOption('vegan');
  const profileResponse = page.waitForResponse(r => r.url().endsWith('/api/profile') && r.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Save & personalize my plan', exact: true }).click();
  const profileResult = await profileResponse; assert.equal(profileResult.ok(), true, await profileResult.text());
  data = await state(); assert.equal(data.user.goal, 'gain'); assert.equal(data.user.diet, 'vegan'); assert.equal(data.user.currentWeight, 72); assert.equal(data.user.startWeight, 72);
  assert.equal(data.meals.length, 28); assert.equal(data.workouts.length, 14); assert.equal(data.meals.every(m => !/chicken|salmon|yogurt|egg|feta/i.test(m.description)), true);
  assert.equal(data.weightLogs.length, 9);
  mark('Registration preserves demo data; profile regenerates vegan weight-gain plan');

  const child = await page.request.patch(`${BASE}/api/profile`, { data: { ...data.user, age: 12, currentWeight: 35, height: 145, goal: 'lose', targetWeight: 30 } });
  assert.equal(child.ok(), true); const childData = await child.json();
  assert.equal(childData.user.goal, 'maintain'); assert.equal(childData.user.calorieTarget, 0); assert.ok(childData.workouts.some(w => w.name.includes('play')));
  const senior = await page.request.patch(`${BASE}/api/profile`, { data: { ...data.user, age: 72, goal: 'maintain', currentWeight: 72, targetWeight: 72 } });
  assert.equal(senior.ok(), true); const seniorData = await senior.json();
  assert.equal(seniorData.workouts.every(w => w.intensity === 'Gentle'), true);
  const restore = await page.request.patch(`${BASE}/api/profile`, { data: { ...data.user, age: 29, goal: 'gain', currentWeight: 72, targetWeight: 78 } }); assert.equal(restore.ok(), true);
  mark('Children get no weight-loss calorie target; older adults get gentle movement');

  await page.reload({ waitUntil: 'networkidle' });
  assert.equal((await state()).user.id, accountId);
  await navigate('Meal planner');
  await page.getByRole('button', { name: 'Refresh weekly plan', exact: true }).click();
  await saved(page.getByRole('button', { name: 'Create my fresh plan', exact: true }), '/api/plan');
  assert.equal((await state()).meals.length, 28);
  await page.locator('.topbar-account').click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.waitForURL(url => url.pathname === '/login');
  await field('email', email); await field('password', password);
  await saved(page.getByRole('button', { name: 'Welcome back to my space', exact: true }), '/api/auth');
  await page.waitForURL(url => url.pathname === '/');
  await expect(page.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  assert.equal((await state()).user.id, accountId);
  mark('Plan refresh, persistent sessions, sign-out, and password sign-in');

  const anonymous = await request.newContext({ baseURL: BASE });
  const denied = await anonymous.post('/api/records', { data: { resource: 'water', amount: 250, date: new Date().toISOString().slice(0, 10), time: '10:00' } });
  assert.equal(denied.status(), 401);
  await anonymous.get('/api/dashboard');
  const protectedRecord = (await state()).meals[0];
  const crossAccount = await anonymous.patch('/api/records', { data: { resource: 'meals', id: protectedRecord.id, completed: true } });
  assert.equal(crossAccount.status(), 404);
  await anonymous.dispose();
  mark('Unauthenticated mutation rejection and cross-account data isolation');

  await navigate('Water tracker');
  await page.screenshot({ path: 'artifacts/water-tracker-desktop.png', fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(BASE, { waitUntil: 'networkidle' });
  await expect(mobile.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await mobile.getByRole('link', { name: 'Meal planner', exact: true }).click();
  await expect(mobile.getByRole('heading', { name: 'Good food. Better days.', exact: true })).toBeVisible();
  await mobile.screenshot({ path: 'artifacts/meal-planner-mobile.png', fullPage: true });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  mark('Responsive mobile navigation and seven-day planner');
  assert.deepEqual(errors, []);
  console.log(`\nAll ${checks.length} verification groups passed. No browser errors.`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
