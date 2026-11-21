// Run only against a disposable database/server: creates a synthetic account and records.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const BASE = process.env.TEST_BASE_URL;
if (!BASE || process.env.ALLOW_SYNTHETIC_BROWSER_TEST !== '1') throw new Error('Set TEST_BASE_URL and ALLOW_SYNTHETIC_BROWSER_TEST=1 only for a disposable test server and database.');
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(); const errors = []; const missingAssets = []; page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() === 404 && /\/(images|fonts)\//.test(new URL(r.url()).pathname)) missingAssets.push(r.url()); });
  await page.goto(BASE);
  const status = await page.evaluate(async () => (await fetch('/api/auth', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sign-up',name:'Browser Test',email:`expanded-${Date.now()}@example.com`,password:'Testing-safe-2026!',confirmPassword:'Testing-safe-2026!'})})).status);
  assert.equal(status,200); await page.reload();
  assert.equal((await context.request.get(`${BASE}/fonts/dm-sans.ttf`)).status(),200);
  await page.getByRole('link',{name:'Activity journal',exact:true}).click();
  await page.locator('[name=steps]').fill('1234'); await page.getByRole('button',{name:'Save activity'}).click();
  await expect(page.getByText('1,234 steps')).toBeVisible();
  await page.getByRole('link',{name:'Sleep journal',exact:true}).click();
  await page.locator('[name=startedAt]').fill('2025-01-01T22:00'); await page.locator('[name=endedAt]').fill('2025-01-02T06:00');
  await page.getByRole('button',{name:'Save sleep entry'}).click(); await expect(page.getByText('8 h 0 min')).toBeVisible();
  for (const [view,title,field,value] of [['Food diary','Synthetic meal','calories','300'],['Exercise journal','Synthetic exercise','durationMinutes','30'],['Measurements','Synthetic waist','centimetres','80']]) {
    await page.getByRole('link',{name:view,exact:true}).click(); await page.locator('[name=title]').fill(title); await page.locator(`[name=${field}]`).fill(value);
    await page.getByRole('button',{name:'Save entry'}).click(); await expect(page.locator('tbody tr').filter({hasText:title})).toBeVisible();
    await page.getByRole('button',{name:`Edit ${title}`}).click(); await page.locator('[name=title]').fill(title+' edited'); await page.getByRole('button',{name:'Save changes'}).click(); await expect(page.locator('tbody tr').filter({hasText:title+' edited'})).toBeVisible();
  }
  await page.reload(); await page.getByRole('link',{name:'Measurements',exact:true}).click(); await expect(page.locator('tbody tr').filter({hasText:'Synthetic waist edited'})).toBeVisible();
  page.on('dialog',dialog=>dialog.accept()); await page.getByRole('button',{name:'Delete Synthetic waist edited'}).click(); await expect(page.locator('tbody tr').filter({hasText:'Synthetic waist edited'})).toHaveCount(0);
  console.log('✓ Activity, sleep, three journals, edit, persistence and deletion');
  await page.getByRole('link',{name:'Meal planner',exact:true}).click(); await page.getByRole('tab',{name:'Recipe library',exact:true}).click();
  await expect(page.locator('.recipe-library-card').first()).toBeVisible(); const name = await page.locator('.recipe-library-card strong').first().textContent();
  await page.getByPlaceholder('Search by name').fill(name); await expect(page.locator('.recipe-library-card')).toHaveCount(1); await page.locator('.recipe-library-card').first().click();
  await expect(page.getByText('Cooking instructions',{exact:true})).toBeVisible(); await page.locator('.recipe-guide select').selectOption('2'); await expect(page.getByText('Scaling here is a preview',{exact:false})).toBeVisible();
  console.log('✓ Recipe library search, details and serving preview');
  await page.keyboard.press('Escape'); await page.getByRole('tab',{name:'Grocery list',exact:true}).click();
  const box=page.locator('.grocery-panel input[type=checkbox]').first(); await expect(box).toBeVisible(); const before=await box.isChecked(); const saved = page.waitForResponse(r => r.url().includes('/api/groceries') && r.request().method() === 'PUT'); await box.click(); assert.equal((await saved).ok(), true); await expect(box).toBeChecked({checked:!before}); await page.reload(); await page.getByRole('link',{name:'Meal planner',exact:true}).click(); await page.getByRole('tab',{name:'Grocery list',exact:true}).click(); await expect(page.locator('.grocery-panel input[type=checkbox]').first()).toBeChecked({checked:!before});
  console.log('✓ Grocery purchase state persists after reload');
  await page.getByRole('link',{name:'Water tracker',exact:true}).click(); await expect(page.getByText('Closed-app notifications',{exact:false}).first()).toBeVisible();
  assert.deepEqual(errors,[]); assert.deepEqual(missingAssets,[]); console.log('✓ Water notification settings render; no uncaught browser errors or missing displayed image/font assets');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
