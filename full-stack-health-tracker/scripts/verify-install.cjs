const { chromium, expect, request, devices } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const checks = [];
const mark = value => { checks.push(value); console.log(`✓ ${value}`); };
let browser;
let api;
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  api = await request.newContext({ baseURL: BASE });
  const response = await api.get('/manifest.webmanifest');
  assert.equal(response.status(), 200); assert.ok(response.headers()['content-type'].includes('manifest+json'));
  const manifest = await response.json();
  assert.equal(manifest.short_name, 'Fit Life Bro'); assert.equal(manifest.display, 'standalone'); assert.equal(manifest.scope, '/'); assert.equal(manifest.id, '/');
  assert.ok(manifest.start_url.startsWith('/')); assert.ok(manifest.icons.some(icon => icon.sizes === '192x192')); assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'maskable'));
  for (const icon of [...manifest.icons, { src: '/icons/apple-touch-icon.png', sizes: '180x180' }]) {
    const image = await api.get(icon.src); assert.equal(image.status(), 200); const buffer = await image.body();
    assert.equal(buffer.subarray(1, 4).toString(), 'PNG'); const [width, height] = icon.sizes.split('x').map(Number); assert.equal(buffer.readUInt32BE(16), width); assert.equal(buffer.readUInt32BE(20), height);
  }
  const worker = await api.get('/sw.js'); assert.equal(worker.status(), 200); assert.ok(worker.headers()['content-type'].includes('javascript')); assert.ok(worker.headers()['cache-control'].includes('no-store')); assert.equal(worker.headers()['service-worker-allowed'], '/');
  mark('Valid standalone manifest, correctly sized Android/Apple/maskable icons, and service-worker headers');

  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--bypass-app-banner-engagement-checks'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${BASE}/install`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'A little wellness. Right in your pocket.', exact: true })).toBeVisible();
  assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'), '/manifest.webmanifest');
  assert.equal(await page.locator('meta[name="mobile-web-app-capable"]').getAttribute('content'), 'yes');
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content'), 'Fit Life Bro');
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), '#3d7046');
  assert.equal(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'), '/icons/apple-touch-icon.png');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 20000 });
  const sw = await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; return { scope: registration.scope, state: registration.active?.state }; });
  assert.equal(sw.state, 'activated'); assert.equal(new URL(sw.scope).pathname, '/');
  const cdp = await context.newCDPSession(page); const chromeManifest = await cdp.send('Page.getAppManifest'); assert.equal(chromeManifest.errors.length, 0);
  await page.screenshot({ path: 'artifacts/install-desktop.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  mark('Home-screen metadata, browser-parsed manifest, active service worker, and responsive desktop guide');

  await page.getByRole('tab', { name: 'iPhone · Safari', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Open as Web App → Add', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'iPhone · Safari', exact: true }).press('ArrowLeft'); await expect(page.getByRole('tab', { name: 'Android · Chrome', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Choose Install app or Add to Home screen', exact: true })).toBeVisible();
  const installUrl = await page.getByRole('textbox', { name: 'Your Fit Life Bro installation link', exact: true }).inputValue(); assert.equal(installUrl, `${BASE}/install`);
  await page.getByRole('button', { name: 'Copy link', exact: true }).click(); await expect(page.locator('.installation-copy-status')).toContainText('copied'); assert.equal(await page.evaluate(() => navigator.clipboard.readText()), installUrl);
  await expect(page.getByText('Current reminders need Fit Life Bro to stay open.', { exact: false })).toBeVisible();
  mark('Android/iPhone steps, keyboard-accessible tabs, copyable public link, and honest reminder limitations');

  async function offer(outcome) { await page.evaluate(value => { const event = new Event('beforeinstallprompt', { cancelable: true }); event.prompt = async () => { window.__wellnestPromptCalls = (window.__wellnestPromptCalls || 0) + 1; }; event.userChoice = Promise.resolve({ outcome: value }); window.dispatchEvent(event); }, outcome); }
  await offer('dismissed'); await page.getByRole('button', { name: 'Install Fit Life Bro', exact: true }).click(); await expect(page.locator('.installation-action-status')).toContainText('No problem'); assert.equal(await page.evaluate(() => window.__wellnestPromptCalls), 1);
  await offer('accepted'); await page.getByRole('button', { name: 'Install Fit Life Bro', exact: true }).click(); await expect(page.locator('.installation-action-status')).toContainText('Installation requested');
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await expect(page.getByText('Fit Life Bro is installed and ready to go.', { exact: true })).toBeVisible();
  assert.equal(await page.evaluate(() => window.__wellnestPromptCalls), 2);
  mark('One-shot install prompt, dismissal fallback, acceptance message, and app-installed state');

  const account = await page.evaluate(async () => {
    const password = 'Install-safe-2026!';
    const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sign-up', name: 'Installation Test', email: `install-test-${Date.now()}@example.com`, password, confirmPassword: password }) });
    const result = await response.json(); return { status: response.status, id: result.user?.id };
  }); assert.equal(account.status, 200);
  assert.equal(await page.evaluate(async () => (await (await fetch('/api/dashboard')).json()).user.isDemo), false);
  const cachedPaths = await page.evaluate(async () => { const result = []; for (const name of await caches.keys()) { const cache = await caches.open(name); for (const request of await cache.keys()) result.push(new URL(request.url).pathname); } return result; });
  assert.ok(cachedPaths.includes('/offline.html'));
  assert.equal(cachedPaths.some(path => path.startsWith('/api/') || ['/', '/login', '/signup', '/forgot-password', '/install'].includes(path)), false);
  mark('Authenticated requests bypass caching; no account, health, or online-page responses enter the offline cache');

  await context.setOffline(true); await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /You’re offline/ })).toBeVisible();
  const offlineApi = await page.evaluate(() => fetch('/api/dashboard').then(() => 'unexpected-response').catch(() => 'network-required')); assert.equal(offlineApi, 'network-required');
  assert.equal((await page.locator('body').innerText()).includes('Installation Test'), false);
  await page.screenshot({ path: 'artifacts/install-offline.png', fullPage: true });
  await context.setOffline(false); await page.goto(BASE, { waitUntil: 'networkidle' }); await expect(page.getByRole('heading', { name: 'A little better, every day.' })).toBeVisible();
  assert.equal((await (await context.request.get(`${BASE}/api/auth`)).json()).user.id, account.id);
  await page.getByRole('button', { name: 'Settings & preferences', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Wellness, right in your pocket', exact: true })).toBeVisible(); await expect(page.getByRole('link', { name: 'Install on my phone', exact: false })).toHaveAttribute('href', '/install');
  mark('Safe offline fallback, network-required private API, account persistence after reconnect, and Settings installation link');

  const { defaultBrowserType: _iphoneBrowser, ...iphoneOptions } = devices['iPhone 13']; const iphoneContext = await browser.newContext(iphoneOptions); const iphone = await iphoneContext.newPage();
  await iphone.goto(`${BASE}/install`, { waitUntil: 'networkidle' }); await expect(iphone.getByRole('tab', { name: 'iPhone · Safari', exact: true })).toHaveAttribute('aria-selected', 'true'); await expect(iphone.getByRole('heading', { name: 'Share → Add to Home Screen', exact: true })).toBeVisible();
  assert.equal(await iphone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); await iphone.screenshot({ path: 'artifacts/install-iphone.png', fullPage: true });
  const { defaultBrowserType: _androidBrowser, ...androidOptions } = devices['Pixel 7']; const androidContext = await browser.newContext(androidOptions); const android = await androidContext.newPage(); await android.goto(`${BASE}/install`, { waitUntil: 'networkidle' }); await expect(android.getByRole('tab', { name: 'Android · Chrome', exact: true })).toHaveAttribute('aria-selected', 'true'); assert.equal(await android.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  mark('Automatic iPhone/Android instructions and overflow-free mobile layouts');

  const installedContext = await browser.newContext(); await installedContext.addInitScript(() => Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })); const installed = await installedContext.newPage(); await installed.goto(`${BASE}/install`, { waitUntil: 'networkidle' }); await expect(installed.getByText('Fit Life Bro is installed and ready to go.', { exact: true })).toBeVisible();
  const embeddedContext = await browser.newContext(); const embeddedPage = await embeddedContext.newPage(); await embeddedPage.setContent(`<iframe name="installation" src="${BASE}/install" style="width:100%;height:900px;border:0"></iframe>`); const frame = embeddedPage.frameLocator('iframe[name="installation"]'); await expect(frame.getByRole('link', { name: 'Open installation in a new tab', exact: false })).toHaveAttribute('target', '_blank');
  assert.deepEqual(errors, []);
  mark('Installed-app detection and explicit new-tab guidance inside embedded previews');
  console.log(`\nAll ${checks.length} installation verification groups passed. No browser errors.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (api) await api.dispose(); });
