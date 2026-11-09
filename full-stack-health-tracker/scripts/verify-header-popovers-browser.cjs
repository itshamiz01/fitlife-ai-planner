// Run only against an isolated server with synthetic data.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
if (!process.env.TEST_BASE_URL || process.env.ALLOW_SYNTHETIC_BROWSER_TEST !== '1') throw Error('Requires isolated TEST_BASE_URL and ALLOW_SYNTHETIC_BROWSER_TEST=1');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:800}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.TEST_BASE_URL,{waitUntil:'networkidle'});
   const bell=page.getByRole('button',{name:'View notifications'});
   await bell.click();
   const notification=page.locator('.notification-popover');
   await expect(notification).toBeVisible();
   await expect(notification.getByText('Make hydration a happy habit')).toBeVisible();
   const water=notification.getByRole('button',{name:'Visit water tracker'});
   const rect=await notification.boundingBox();
   assert.ok(rect.x>=0 && rect.x+rect.width<=width,`notification outside ${width}px viewport`);
   const onTop=await water.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit && (hit===el || el.contains(hit));});
   assert.ok(onTop,`notification action covered at ${width}px`);
   await water.click(); await expect(page.getByRole('heading',{name:'A little more hydrated. A little more you.'})).toBeVisible();
   await page.locator('.topbar-account').click();
   const account=page.locator('.account-popover'); await expect(account).toBeVisible();
   const bounds=await account.boundingBox(); assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width,`account outside ${width}px viewport`);
   await account.getByRole('button',{name:'My health profile'}).click();
   await expect(page.locator('.account-popover')).toHaveCount(0);
   await bell.click(); await expect(notification).toBeVisible();
   await page.locator('.topbar-account').click(); await expect(notification).toHaveCount(0); await expect(account).toBeVisible();
   await page.mouse.click(5, 5); await expect(account).toHaveCount(0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.deepEqual(errors,[]); console.log(`${width}px: both popovers above content, actions clickable, switch and dismiss work`);
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
