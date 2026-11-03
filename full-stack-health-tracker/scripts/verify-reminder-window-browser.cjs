// Run only on a disposable server backed by an isolated synthetic database.
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const base = process.env.TEST_BASE_URL;
if (!base || process.env.ALLOW_SYNTHETIC_BROWSER_TEST !== '1') throw Error('Use an isolated test server and ALLOW_SYNTHETIC_BROWSER_TEST=1.');
(async () => {
 const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox'] });
 try {
  for (const width of [320,390,768,1440]) {
   const page=await browser.newPage({viewport:{width,height:844}}), errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/?view=water`,{waitUntil:'networkidle'});
   const form=page.locator('.reminder-window-form'); await expect(form).toBeVisible();
   await form.getByLabel('Start',{exact:true}).fill('22:00'); await form.getByLabel('End',{exact:true}).fill('06:00');
   const saved=page.waitForResponse(r=>r.url().includes('/api/profile')&&r.request().method()==='PATCH');
   await form.getByRole('button',{name:'Save reminder hours'}).click(); assert.equal((await saved).status(),200);
   await page.reload({waitUntil:'networkidle'}); await expect(page.locator('.reminder-window-form').getByLabel('Start',{exact:true})).toHaveValue('22:00'); await expect(page.locator('.reminder-window-form').getByLabel('End',{exact:true})).toHaveValue('06:00');
   const next=page.locator('.reminder-window-form'); await next.getByLabel('End',{exact:true}).fill('22:00'); await next.getByRole('button',{name:'Save reminder hours'}).click(); await expect(next.getByRole('alert')).toContainText('different');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); assert.deepEqual(errors,[]); console.log(`Passed ${width}px: overnight schedule, persistence, validation, no overflow`); await page.close();
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
