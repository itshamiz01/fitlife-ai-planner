// Use only a disposable server and synthetic database.
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const base = process.env.TEST_BASE_URL;
if (!base || process.env.ALLOW_SYNTHETIC_BROWSER_TEST !== '1') throw Error('Provide an isolated TEST_BASE_URL and ALLOW_SYNTHETIC_BROWSER_TEST=1.');
(async () => {
 const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox'] });
 try {
  for (const width of [320, 390, 768, 1440]) {
   const page=await browser.newPage({viewport:{width,height:844}}), errors=[], writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if (r.url().includes('/api/') && ['PUT','PATCH','DELETE'].includes(r.method())) writes.push(r.url());});
   await page.goto(base,{waitUntil:'networkidle'});
   if (width <= 900) await page.getByRole('button',{name:'Open navigation'}).click();
   const link=page.getByRole('link',{name:'How to use',exact:true}); await expect(link).toBeVisible();
   assert.equal(await page.locator('.secondary-nav > :last-child').innerText(),'How to use');
   await link.click(); await expect(page.getByRole('heading',{name:'How to use Fit Life Bro'})).toBeVisible();
   assert.equal(await page.locator('.how-to-item').count(),16);
   const water=page.locator('details').filter({has:page.getByText('8. Water tracker aur reminders',{exact:true})});
   await water.locator('summary').click(); await expect(water.getByText(/Personalized numerical hydration estimator abhi available nahi/)).toBeVisible();
   await water.getByRole('button',{name:'Water tracker kholein'}).click(); await expect(page.getByRole('heading',{name:'A little more hydrated. A little more you.'})).toBeVisible();
   await page.goto(`${base}/?view=how-to`,{waitUntil:'networkidle'}); await expect(page.getByRole('heading',{name:'How to use Fit Life Bro'})).toBeVisible();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); assert.deepEqual(errors,[]); assert.deepEqual(writes,[]);
   console.log(`Passed ${width}px: final menu item, guide, navigation, direct link, no overflow or writes`); await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
