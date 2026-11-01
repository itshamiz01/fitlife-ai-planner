const { chromium, expect, request } = require('@playwright/test');
const assert = require('node:assert/strict');
const { randomBytes, scryptSync, createHash } = require('node:crypto');
const fs = require('node:fs');
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { pgTable, uuid, text, timestamp } = require('drizzle-orm/pg-core');
const { eq } = require('drizzle-orm');
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const PREVIEW = process.env.TEST_PREVIEW_URL;
const prefix = `auth-${Date.now()}`;
const email = `${prefix}@example.com`;
const initialPassword = '  A-real-password-2026!  ';
const resetPassword = 'Restored-account-2026!';
const finalPassword = 'Fresh-password-2026!';
const accounts = pgTable('wellnest_users', { id: uuid('id'), passwordHash: text('password_hash'), recoveryKeyHash: text('recovery_key_hash') });
const sessionTable = pgTable('wellnest_sessions', { id: text('id'), expiresAt: timestamp('expires_at') });
const clients = [];
const checks = [];
let browser;
let pool;
const mark = label => { checks.push(label); console.log(`✓ ${label}`); };
async function client() { const value = await request.newContext({ baseURL: BASE }); clients.push(value); return value; }
async function post(context, body, expected = 200) {
  const response = await context.post('/api/auth', { data: body });
  const result = await response.json();
  assert.equal(response.status(), expected, `${body.action}: expected ${expected}, received ${response.status()}${response.status() >= 400 ? ` (${result.error})` : ''}`);
  return { response, result };
}
async function session(context) { const response = await context.get('/api/auth'); assert.equal(response.status(), 200); return (await response.json()).user; }
async function security(context, body, expected = 200) { const response = await context.patch('/api/account', { data: body }); const result = await response.json(); assert.equal(response.status(), expected, result.error || 'Unexpected security response'); return result; }
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const a = await client();
  assert.equal(await session(a), null);
  const registration = await post(a, { action: 'sign-up', name: 'Auth API Person', email, password: initialPassword, confirmPassword: initialPassword });
  const accountId = registration.result.user.id;
  const firstKey = registration.result.recoveryKey;
  assert.ok(firstKey && firstKey.startsWith('FLB-'));
  assert.equal(registration.result.user.hasRecoveryKey, true);
  assert.equal('passwordHash' in registration.result.user, false);
  assert.equal('recoveryKeyHash' in registration.result.user, false);
  assert.equal((await session(a)).id, accountId);
  const dashboard = await (await a.get('/api/dashboard')).json();
  assert.equal('recoveryKey' in dashboard, false);
  assert.equal(JSON.stringify(dashboard).includes(firstKey), false);
  mark('Registration, real session verification, and no secret hashes in public data');

  await post(a, { action: 'sign-out' });
  await post(a, { action: 'sign-in', email: email.toUpperCase(), password: initialPassword.trim() }, 401);
  await post(a, { action: 'sign-in', email: ` ${email.toUpperCase()} `, password: initialPassword });
  for (let i = 0; i < 30; i++) await post(a, { action: 'sign-in', email, password: initialPassword });
  const lockedEmail = `${prefix}-locked@example.com`;
  for (let i = 0; i < 10; i++) await post(a, { action: 'sign-in', email: lockedEmail, password: 'not-a-valid-password' }, 401);
  const limited = await post(a, { action: 'sign-in', email: lockedEmail, password: 'not-a-valid-password' }, 429);
  assert.ok(Number(limited.response.headers()['retry-after']) > 0);
  assert.equal(limited.result.code, 'AUTH_RATE_LIMITED');
  await post(a, { action: 'sign-in', email, password: initialPassword });
  await post(a, { action: 'sign-in', email: `${prefix}-unrelated@example.com`, password: 'Unrelated-password' }, 401);
  mark('Exact passwords, normalized emails, 30 successful logins, and isolated failed-attempt limits');

  const other = await client();
  const otherEmail = `${prefix}-other@example.com`;
  const otherSignup = await post(other, { action: 'sign-up', name: 'Another private account', email: otherEmail, password: 'Other-private-2026!', confirmPassword: 'Other-private-2026!' });
  let activePassword = initialPassword;
  let database;
  if (process.env.DATABASE_URL && ['localhost', '127.0.0.1'].includes(new URL(BASE).hostname)) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL }); database = drizzle(pool);
    const [stored] = await database.select().from(accounts).where(eq(accounts.id, accountId));
    assert.equal(stored.passwordHash.startsWith('scrypt-v1$'), true);
    assert.equal(stored.recoveryKeyHash.length, 64);
    assert.equal(stored.recoveryKeyHash.includes(firstKey), false);
    const legacyPassword = 'Legacy-compatibility-2026!';
    const salt = randomBytes(16).toString('hex');
    const legacyHash = `${salt}:${scryptSync(legacyPassword, salt, 64).toString('hex')}`;
    await database.update(accounts).set({ passwordHash: legacyHash }).where(eq(accounts.id, accountId));
    await post(a, { action: 'sign-in', email, password: `  ${legacyPassword}  ` });
    activePassword = legacyPassword;
    mark('Existing legacy password hashes and their original whitespace behavior remain compatible');
  }
  const b = await client();
  await post(b, { action: 'sign-in', email, password: activePassword });
  await post(a, { action: 'recover', email, recoveryKey: 'WN-NOT-A-VALID-KEY', newPassword: resetPassword, confirmPassword: resetPassword }, 401);
  const recovered = await post(a, { action: 'recover', email, recoveryKey: firstKey.toLowerCase(), newPassword: resetPassword, confirmPassword: resetPassword });
  const replacementKey = recovered.result.recoveryKey;
  assert.ok(replacementKey && replacementKey !== firstKey);
  assert.equal(await session(a), null); assert.equal(await session(b), null);
  assert.equal((await session(other)).id, otherSignup.result.user.id);
  await post(a, { action: 'recover', email, recoveryKey: firstKey, newPassword: resetPassword, confirmPassword: resetPassword }, 401);
  await post(a, { action: 'sign-in', email, password: activePassword }, 401);
  await post(a, { action: 'sign-in', email, password: resetPassword });
  mark('Recovery key reset, single-use rotation, and revocation of only the correct account’s sessions');

  await post(b, { action: 'sign-in', email, password: resetPassword });
  await security(a, { action: 'change-password', currentPassword: 'wrong-current-password', newPassword: finalPassword, confirmPassword: finalPassword }, 401);
  await security(a, { action: 'change-password', currentPassword: resetPassword, newPassword: finalPassword, confirmPassword: 'different-confirmation' }, 400);
  await security(a, { action: 'change-password', currentPassword: resetPassword, newPassword: finalPassword, confirmPassword: finalPassword });
  assert.equal((await session(a)).id, accountId); assert.equal(await session(b), null);
  const expired = await b.get('/api/dashboard'); assert.equal(expired.status(), 401); assert.equal((await expired.json()).code, 'SESSION_EXPIRED');
  const guestAfterExpiry = await (await b.get('/api/dashboard')).json(); assert.equal(guestAfterExpiry.user.isDemo, true);
  const rotated = await security(a, { action: 'recovery-key', currentPassword: finalPassword });
  await post(a, { action: 'recover', email, recoveryKey: replacementKey, newPassword: resetPassword, confirmPassword: resetPassword }, 401);
  await post(b, { action: 'sign-in', email, password: finalPassword });
  await security(a, { action: 'sign-out-others', currentPassword: finalPassword });
  assert.equal((await session(a)).id, accountId); assert.equal(await session(b), null);
  assert.ok(rotated.recoveryKey);
  mark('Password changes, key replacement, expired-session cleanup, and sign out other devices');

  const noRemember = await post(a, { action: 'sign-in', email, password: finalPassword, remember: false });
  const cookieHeader = noRemember.response.headersArray().find(header => header.name.toLowerCase() === 'set-cookie' && header.value.startsWith('wellnest_session_v3='));
  assert.ok(cookieHeader); assert.equal(/max-age=/i.test(cookieHeader.value), false);
  const cookie = (await a.storageState()).cookies.find(value => value.name === 'wellnest_session_v3');
  assert.equal(cookie.expires, -1); assert.equal(cookie.httpOnly, true);
  const csrf = await a.post('/api/auth', { headers: { Origin: 'https://unrelated.example' }, data: { action: 'sign-out' } });
  assert.equal(csrf.status(), 403); assert.equal((await session(a)).id, accountId);
  const malformed = await a.post('/api/auth', { headers: { 'Content-Type': 'application/json' }, data: '{' }); assert.equal(malformed.status(), 400);
  await post(a, { action: 'sign-up', name: 'Not an overwrite', email, password: 'Different-password-2026!', confirmPassword: 'Different-password-2026!' }, 409);
  if (database) {
    const otherCookie = (await other.storageState()).cookies.find(value => value.name === 'wellnest_session_v3');
    await database.update(sessionTable).set({ expiresAt: new Date(Date.now() - 60000) }).where(eq(sessionTable.id, createHash('sha256').update(otherCookie.value).digest('hex')));
    assert.equal((await other.get('/api/dashboard')).status(), 401);
  }
  mark('Remember-me semantics, CSRF rejection, malformed requests, duplicate email, and expiry');

  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--test-third-party-cookie-phaseout'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/login-desktop.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('input[name="email"]').fill(email); await page.locator('input[name="password"]').fill('short');
  const shortRequest = page.waitForResponse(r => r.url().endsWith('/api/auth') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Welcome back to my space', exact: true }).click(); assert.equal((await shortRequest).status(), 401);
  await expect(page.locator('.auth-inline-error')).toBeVisible(); await page.waitForTimeout(5100); await expect(page.locator('.auth-inline-error')).toBeVisible();
  await page.locator('input[name="password"]').fill(finalPassword);
  await page.getByRole('checkbox', { name: 'Remember me', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Welcome back to my space', exact: true }).click(); await page.waitForURL(url => url.pathname === '/');
  await expect(page.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal((await (await context.request.get(`${BASE}/api/auth`)).json()).user.id, accountId);
  await page.locator('.topbar-account').click(); await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await page.waitForURL(url => url.pathname === '/login');
  assert.equal((await (await context.request.get(`${BASE}/api/auth`)).json()).user, null);
  mark('Standalone sign-in, persistent inline errors, short legacy input, reload persistence, and clear logout');

  const uiEmail = `${prefix}-ui@example.com`; const uiPassword = 'A-healthier-chapter-2026!'; const uiNext = 'A-new-healthier-password-2026!';
  await page.getByRole('tab', { name: 'Create an account', exact: true }).click();
  await page.locator('input[name="name"]').fill('Alex River'); await page.locator('input[name="email"]').fill(uiEmail); await page.locator('input[name="password"]').fill(uiPassword); await page.locator('input[name="confirmPassword"]').fill('mismatch');
  await page.getByRole('button', { name: 'Start my healthier chapter', exact: true }).click();
  await expect(page.locator('.auth-field-error')).toContainText('match');
  await page.locator('input[name="confirmPassword"]').fill(uiPassword); await page.getByRole('button', { name: 'Start my healthier chapter', exact: true }).click();
  await expect(page.getByLabel('Your recovery key')).toBeVisible();
  const firstUiKey = await page.getByLabel('Your recovery key').inputValue(); assert.ok(firstUiKey.startsWith('FLB-'));
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download backup', exact: true }).click(); assert.equal((await download).suggestedFilename(), 'fit-life-bro-recovery-key.txt');
  await page.getByRole('checkbox', { name: 'I’ve saved my recovery key', exact: true }).check(); await page.getByRole('button', { name: 'Continue to my health profile', exact: true }).click();
  await page.waitForURL(url => url.searchParams.get('view') === 'profile'); await expect(page.getByRole('heading', { name: 'Your health story starts with you.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings & preferences', exact: true }).click();
  const securityCard = page.locator('.account-security');
  await securityCard.locator('input[name="currentPassword"]').fill('wrong-current-password'); await securityCard.locator('input[name="newPassword"]').fill(uiNext); await securityCard.locator('input[name="confirmPassword"]').fill(uiNext);
  await securityCard.getByRole('button', { name: 'Update my password', exact: true }).click(); await expect(securityCard.getByRole('alert')).toBeVisible();
  await securityCard.locator('input[name="currentPassword"]').fill(uiPassword); await securityCard.getByRole('button', { name: 'Update my password', exact: true }).click(); await expect(securityCard.locator('.auth-inline-success')).toBeVisible();
  await securityCard.getByRole('tab', { name: 'Recovery key', exact: true }).click(); await securityCard.locator('input[name="currentPassword"]').fill(uiNext);
  await securityCard.getByRole('button', { name: 'Replace my recovery key', exact: true }).click(); await expect(securityCard.getByLabel('Your recovery key')).toBeVisible();
  const uiKey = await securityCard.getByLabel('Your recovery key').inputValue(); assert.notEqual(uiKey, firstUiKey);
  await securityCard.getByRole('checkbox', { name: 'I’ve saved my recovery key', exact: true }).check(); await securityCard.getByRole('button', { name: 'I’m all set', exact: true }).click();
  mark('Complete registration, password confirmation, key download, password change, and recovery setup in UI');

  await page.goto(`${BASE}/forgot-password`, { waitUntil: 'networkidle' });
  await expect(page.getByText('No email is sent.', { exact: false })).toBeVisible();
  await page.locator('input[name="email"]').fill(uiEmail); await page.locator('textarea[name="recoveryKey"]').fill(uiKey); await page.locator('input[name="newPassword"]').fill(uiPassword); await page.locator('input[name="confirmPassword"]').fill(uiPassword);
  await page.getByRole('button', { name: 'Reset my password', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Password reset. A fresh start.', exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'I’ve saved my recovery key', exact: true }).check(); await page.getByRole('button', { name: 'Back to sign in', exact: true }).click();
  await expect(page.locator('.auth-inline-success')).toBeVisible();
  await page.locator('input[name="password"]').fill(uiPassword); await page.getByRole('button', { name: 'Welcome back to my space', exact: true }).click(); await page.waitForURL(url => url.pathname === '/');
  await expect(page.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  mark('End-to-end recovery resets password, replaces key, and returns to a verified sign-in');

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const mobile = await mobileContext.newPage();
  await mobile.goto(`${BASE}/login`, { waitUntil: 'networkidle' }); await mobile.screenshot({ path: 'artifacts/login-mobile.png', fullPage: true });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.getByRole('link', { name: 'Explore the demo — no password needed', exact: false }).click(); await expect(mobile.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  await mobile.getByRole('button', { name: 'Sign in', exact: true }).click(); await expect(mobile.getByRole('dialog')).toBeVisible();
  await mobile.getByRole('dialog').locator('input[name="email"]').fill(email); await mobile.getByRole('dialog').locator('input[name="password"]').fill(finalPassword); await mobile.getByRole('button', { name: 'Welcome back to my space', exact: true }).click();
  await expect(mobile.getByRole('dialog')).toHaveCount(0);
  assert.equal((await (await mobileContext.request.get(`${BASE}/api/auth`)).json()).user.id, accountId);
  mark('Mobile login layout, explicit password-free demo, and modal sign-in');

  const blockedContext = await browser.newContext({ viewport: { width: 1200, height: 950 } }); const blocked = await blockedContext.newPage(); const isolated = await client();
  await blocked.route('**/api/auth', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const upstream = await isolated.post('/api/auth', { data: route.request().postDataJSON(), headers: { Origin: new URL(BASE).origin } });
    await route.fulfill({ status: upstream.status(), headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: await upstream.text() });
  });
  await blocked.goto(`${BASE}/login`, { waitUntil: 'networkidle' }); await blocked.locator('input[name="email"]').fill(email); await blocked.locator('input[name="password"]').fill(finalPassword); await blocked.getByRole('button', { name: 'Welcome back to my space', exact: true }).click();
  await expect(blocked.getByText('Your browser is blocking the session', { exact: true })).toBeVisible(); await expect(blocked.getByRole('link', { name: 'Open in a new tab', exact: false })).toBeVisible();
  assert.equal(new URL(blocked.url()).pathname, '/login');
  mark('Blocked-cookie diagnostics never falsely report a successful login');

  if (PREVIEW) {
    const embeddedContext = await browser.newContext({ viewport: { width: 1440, height: 1050 }, ignoreHTTPSErrors: true }); const parent = await embeddedContext.newPage();
    await parent.route('https://wellnest-workspace.test/**', route => route.fulfill({ contentType: 'text/html', body: `<html><body style="margin:0"><iframe name="wellnest" src="${PREVIEW}" style="width:100vw;height:100vh;border:0"></iframe></body></html>` }));
    await parent.goto('https://wellnest-workspace.test/', { waitUntil: 'domcontentloaded' }); const embedded = parent.frameLocator('iframe[name="wellnest"]');
    await expect(embedded.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible({ timeout: 45000 });
    await embedded.getByRole('button', { name: 'Sign in', exact: true }).click(); await embedded.getByRole('dialog').locator('input[name="email"]').fill(email); await embedded.getByRole('dialog').locator('input[name="password"]').fill(finalPassword); await embedded.getByRole('button', { name: 'Welcome back to my space', exact: true }).click();
    await expect(embedded.getByRole('dialog')).toHaveCount(0); const frame = parent.frames().find(value => value.name() === 'wellnest');
    assert.equal((await frame.evaluate(() => fetch('/api/auth', { cache: 'no-store' }).then(r => r.json()))).user.id, accountId);
    const partitioned = (await embeddedContext.cookies()).find(value => value.name === 'wellnest_session_v3' && value.partitionKey);
    assert.ok(partitioned); assert.equal(partitioned.secure, true); assert.equal(partitioned.sameSite, 'None'); assert.equal(partitioned.httpOnly, true);
    await frame.goto(PREVIEW, { waitUntil: 'networkidle' }); await expect(embedded.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
    assert.equal((await frame.evaluate(() => fetch('/api/auth').then(r => r.json()))).user.id, accountId);
    await embedded.locator('.topbar-account').click(); await embedded.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(embedded.getByRole('heading', { name: 'Welcome back. Feel right at home.', exact: true })).toBeVisible();
    assert.equal((await frame.evaluate(() => fetch('/api/auth').then(r => r.json()))).user, null);
    mark('Real HTTPS cross-site iframe: partitioned cookie, login, reload, and logout with third-party-cookie restrictions');
  }
  assert.deepEqual(errors, []);
  console.log(`\nAll ${checks.length} authentication verification groups passed. No browser errors.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); for (const value of clients) await value.dispose(); if (pool) await pool.end(); });
