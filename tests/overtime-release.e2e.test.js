const test=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=(process.env.PROTOTYPE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
test('published overtime history, change form and mobile home routes work together',async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:950}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'/06-HR加班申请/index.html');assert.equal(response.status(),200);
  await page.locator('[data-row="OT002"] [data-history="application"]').click();assert.doesNotMatch(await page.locator('#dialogBody').innerText(),/已废弃/);assert.match(await page.locator('#dialogBody').innerText(),/通过/);
  await page.locator('#dialogBody [data-version]').first().click();assert.doesNotMatch(await page.locator('#detailPage').innerText(),/已废弃/);await page.locator('#backList').click();
  await page.locator('[data-row="OT001"] [data-action="变更"]').click();await page.waitForURL('**/application.html?**');assert.equal(await page.locator('[data-key="reason"]').isVisible(),false);assert.equal(await page.locator('#operationReason').isVisible(),true);
  const [mobile]=await Promise.all([context.waitForEvent('page'),page.getByRole('link',{name:'移动端首页',exact:true}).click()]);mobile.setDefaultTimeout(15000);mobile.on('pageerror',e=>errors.push(e.message));await mobile.waitForLoadState();await mobile.setViewportSize({width:390,height:844});
  await mobile.locator('.quick-app.leave').click();assert.equal(await mobile.locator('#page-leave').isVisible(),true);await mobile.locator('#page-leave .back').click();await mobile.locator('.quick-app.overtime').click();await mobile.waitForURL('**/mobile/application.html?mode=self');
  await mobile.locator('[data-key="date"]').fill('2026-09-21');await mobile.locator('[data-key="date"]').dispatchEvent('change');
  for(const[key,value]of [['start','18:00'],['end','21:00']])await mobile.locator(`[data-key="${key}"]`).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));},value);
  await mobile.locator('#openCalculation').click();assert.match(await mobile.locator('#fieldPopover').innerText(),/30分钟/);assert.deepEqual(await mobile.locator('.mobile-calc-summary strong').allInnerTexts(),['2.5小时','2.5小时']);await mobile.locator('[data-close-popover]').click();
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.getByRole('link',{name:'加班记录',exact:true}).click();await mobile.waitForURL('**surface=mobile**');assert.equal(await mobile.locator('#listPage h1').innerText(),'加班记录');assert.ok(await mobile.locator('.mobile-record').count()>0);await mobile.locator('.mobile-home').click();assert.equal(await mobile.locator('[data-key="date"]').inputValue(),'2026-09-21');
  for(const route of ['01-基础配置/00-节假日配置/index.html','01-基础配置/03-加班方案配置/index.html']){const r=await page.goto(base+'/'+route);assert.equal(r.status(),200);}
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
