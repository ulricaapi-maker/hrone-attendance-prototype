const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=process.env.OVERTIME_PROTOTYPE_ROOT||require('node:path').join(__dirname,'../06-HR加班申请');
function load(t,query='',saved){
 const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://prototype.invalid/index.html'+query,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.structuredClone=structuredClone;
 if(saved)w.sessionStorage.setItem('hr-overtime-list-v1',JSON.stringify(saved));
 for(const file of ['list.js','list-adjustments.js'])if(fs.existsSync(root+'/'+file))vm.runInContext(fs.readFileSync(root+'/'+file,'utf8'),dom.getInternalVMContext());
 t.after(()=>w.close());return {w,doc:w.document,run:code=>vm.runInContext(code,dom.getInternalVMContext()),read:()=>JSON.parse(w.sessionStorage.getItem('hr-overtime-list-v1'))};
}
function more(doc,id='OT001'){const b=doc.querySelector(`[data-row="${id}"] [data-more]`);assert.ok(b,'more menu must exist');b.click();}
test('only change punch and more occupy row slots; overflow stays visible but disabled when sealed',t=>{
 const {doc}=load(t);assert.deepEqual([...doc.querySelectorAll('[data-row="OT001"] .row-actions button')].map(b=>b.textContent.trim()),['变更','补卡','更多']);
 more(doc);assert.deepEqual([...doc.querySelectorAll('#rowMoreMenu button')].map(b=>b.textContent),['撤销','撤回','重新提交','调整归属日期']);
 more(doc,'OT006');assert.ok([...doc.querySelectorAll('#rowMoreMenu button')].every(b=>b.disabled));
});
test('manual update saves only attribution, keeps historical snapshots and survives reload',t=>{
 const app=load(t),before=app.read().find(r=>r.id==='OT002');more(app.doc,'OT002');app.doc.querySelector('#rowMoreMenu [data-action="调整归属日期"]').click();
 const field=app.doc.querySelector('[data-vesting-input]');assert.ok(field);field.value='2026-09-10';app.doc.querySelector('#saveVesting').click();
 const after=app.read().find(r=>r.id==='OT002');assert.equal(after.vestingDate,'2026-09-10');assert.equal(after.start,before.start);assert.equal(after.end,before.end);assert.equal(after.hours,before.hours);assert.deepEqual(after.history,before.history);
 const next=load(t,'',app.read());assert.match(next.doc.querySelector('[data-row="OT002"]').textContent,/2026-09-10/);
});
test('empty date cannot save, cancel leaves record untouched, HR-only entry absent for self/team',t=>{
 const app=load(t);more(app.doc);app.doc.querySelector('#rowMoreMenu [data-action="调整归属日期"]').click();app.doc.querySelector('[data-vesting-input]').value='';app.doc.querySelector('#saveVesting').click();assert.match(app.doc.querySelector('#dialogBody').textContent,/必填项不能为空/);assert.equal(app.read()[0].vestingDate,'2026-09-11');app.doc.querySelector('#cancelVesting').click();assert.equal(app.doc.querySelector('#listOverlay').hidden,true);
 for(const mode of ['self','team']){const other=load(t,'?mode='+mode);more(other.doc);assert.equal(other.doc.querySelector('[data-action="调整归属日期"]'),null);assert.equal(other.doc.querySelector('#importVesting'),null);}
});
test('both histories expose original core values instead of latest record values',t=>{
 const {doc}=load(t);doc.querySelector('[data-row="OT002"] [data-history="application"]').click();assert.match(doc.querySelector('#dialogBody').textContent,/申请时长/);assert.match(doc.querySelector('#dialogBody').textContent,/21:30/);assert.match(doc.querySelector('#dialogBody').textContent,/3.50/);assert.doesNotMatch(doc.querySelector('#dialogBody tbody').textContent,/22:00/);
 doc.querySelector('#dialogClose').click();doc.querySelector('[data-row="OT002"] [data-history="punch"]').click();assert.match(doc.querySelector('#dialogBody').textContent,/补卡开始时间/);assert.match(doc.querySelector('#dialogBody').textContent,/22:00/);assert.match(doc.querySelector('#dialogBody').textContent,/补充加班出勤记录/);
});
const csv=(id,date,old='2026-09-11')=>'加班明细编号,原归属日期,新归属日期\r\n'+id+','+old+','+date;
test('CSV import previews before committing and refuses malformed, duplicate, stale or ineligible rows',t=>{
 const app=load(t);assert.equal(app.run('typeof previewVestingImport'),'function');
 for(const [text,message] of [[csv('OT001-1','2026-02-30'),'日期'],[csv('MISSING-1','2026-09-10'),'不存在'],[csv('OT006-1','2026-09-10','2026-08-20'),'封存'],[csv('OT001-1','2026-09-10','2026-09-09'),'原归属日期'],[csv('OT001-1','2026-09-10')+'\nOT001-1,2026-09-11,2026-09-09','重复']]){
  app.doc.querySelector('#importVesting').click();app.run('previewVestingImport('+JSON.stringify(text)+')');assert.equal(app.doc.querySelector('#confirmVestingImport').disabled,true);assert.match(app.doc.querySelector('#importPreview').textContent,new RegExp(message));assert.equal(app.read()[0].vestingDate,'2026-09-11');
 }
 app.doc.querySelector('#importVesting').click();app.run('previewVestingImport('+JSON.stringify(csv('OT001-1','2026-09-10'))+')');assert.equal(app.read()[0].vestingDate,'2026-09-11');assert.equal(app.doc.querySelector('#confirmVestingImport').disabled,false);app.doc.querySelector('#confirmVestingImport').click();assert.equal(app.read()[0].vestingDate,'2026-09-10');assert.match(app.doc.querySelector('#dialogBody').textContent,/已更新 1 条/);
});
test('multiple overtime groups update independently; range filter and normal export include every group',async t=>{
 const seed=load(t).read();seed[0].groups=[{detailId:'OT001-1',date:'2026-09-11',start:'18:00',end:'21:00',endDay:'same',vesting:'2026-09-11',comp:'加班费'},{detailId:'OT001-2',date:'2026-09-12',start:'09:00',end:'12:00',endDay:'same',vesting:'2026-09-12',comp:'加班费'}];
 const app=load(t,'',seed);app.doc.querySelector('#importVesting').click();app.run('previewVestingImport('+JSON.stringify(csv('OT001-2','2026-09-13','2026-09-12'))+')');app.doc.querySelector('#confirmVestingImport').click();const record=app.read()[0];assert.equal(record.groups[0].vesting,'2026-09-11');assert.equal(record.groups[1].vesting,'2026-09-13');
 app.doc.querySelector('#filterVestingStart').value='2026-09-13';app.doc.querySelector('#filterVestingEnd').value='2026-09-13';app.doc.querySelector('#query').click();assert.ok(app.doc.querySelector('[data-row="OT001"]'));
 let downloaded;app.w.Blob=Blob;app.w.URL.createObjectURL=blob=>{downloaded=blob;return 'blob:test';};app.w.URL.revokeObjectURL=()=>{};app.w.HTMLAnchorElement.prototype.click=()=>{};
 app.doc.querySelector('#export').click();assert.match(await downloaded.text(),/2026-09-11、2026-09-13/);
});
test('change form retains saved attribution when overtime time changes',async t=>{
 const {chromium}=require('playwright');const browser=await chromium.launch({headless:true,channel:'chrome'});t.after(()=>browser.close());const page=await browser.newPage();
 const base=process.env.OVERTIME_BASE_URL||(process.env.PROTOTYPE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'')+'/06-HR%E5%8A%A0%E7%8F%AD%E7%94%B3%E8%AF%B7';await page.goto(base+'/index.html');await page.evaluate(()=>{const r=JSON.parse(sessionStorage.getItem('hr-overtime-list-v1'));r[0].vestingDate='2026-09-10';sessionStorage.setItem('hr-overtime-list-v1',JSON.stringify(r));});
 await page.goto(base+'/application.html?mode=hr&action=change&id=OT001');await page.locator('[data-key="end"]').fill('22:00');await page.locator('[data-key="end"]').dispatchEvent('change');assert.equal(await page.evaluate(()=>groups[0].vesting),'2026-09-10');await page.locator('#operationReason').fill('调整结束时间');await page.locator('#submit').click();await page.waitForURL('**/index.html');assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('hr-overtime-list-v1'))[0].vestingDate),'2026-09-10');
});
test('template handles quoted CSV; changed records cannot be overwritten by an old preview',t=>{
 const app=load(t);assert.equal(app.run('typeof vestingTemplate'),'function');const template=app.run('vestingTemplate()');assert.match(template,/OT001-1/);assert.doesNotMatch(template,/OT006-1/);
 app.doc.querySelector('#importVesting').click();const quoted='\ufeff"加班明细编号","原归属日期","新归属日期","备注"\r\n"OT001-1","2026-09-11","2026-09-10","多行\n带逗号,和""引号"""';app.run('previewVestingImport('+JSON.stringify(quoted)+')');assert.equal(app.doc.querySelector('#confirmVestingImport').disabled,false);
 const current=app.read();current[0].vestingDate='2026-09-09';app.w.sessionStorage.setItem('hr-overtime-list-v1',JSON.stringify(current));app.doc.querySelector('#confirmVestingImport').click();assert.match(app.doc.querySelector('#importFileError').textContent,/记录已变化/);assert.equal(app.read()[0].vestingDate,'2026-09-09');
});
test('browser downloads real template, uploads file, previews and persists selected dates; mobile history fits viewport',async t=>{
 const {chromium}=require('playwright');const browser=await chromium.launch({headless:true,channel:'chrome'});t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.OVERTIME_BASE_URL||(process.env.PROTOTYPE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'')+'/06-HR%E5%8A%A0%E7%8F%AD%E7%94%B3%E8%AF%B7';await page.goto(base+'/index.html');
 await page.locator('[data-row="OT001"] [data-more]').click();assert.equal(await page.locator('#rowMoreMenu').isVisible(),true);await page.locator('#rowMoreMenu [data-action="调整归属日期"]').click();await page.locator('[data-vesting-input]').fill('2026-09-10');await page.locator('#saveVesting').click();
 await page.locator('#importVesting').click();const downloadPromise=page.waitForEvent('download');await page.locator('#downloadVestingTemplate').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'加班归属日期更新模板.csv');const contents=fs.readFileSync(await download.path(),'utf8');assert.match(contents,/OT001-1/);assert.match(contents,/2026-09-10/);
 await page.locator('#vestingImportFile').setInputFiles({name:'更新.csv',mimeType:'text/csv',buffer:Buffer.from(csv('OT001-1','2026-09-09','2026-09-10'))});await page.waitForFunction(()=>!document.querySelector('#confirmVestingImport').disabled);assert.match(await page.locator('#importPreview').innerText(),/校验通过 1 条/);await page.locator('#confirmVestingImport').click();assert.match(await page.locator('#dialogBody').innerText(),/已更新 1 条/);await page.locator('#finishVestingImport').click();await page.reload();assert.match(await page.locator('[data-row="OT001"]').innerText(),/2026-09-09/);
 await page.locator('[data-row="OT002"] [data-history="application"]').click();await page.locator('#dialogClose').click();await page.locator('[data-row="OT002"] [data-history="punch"]').click();
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/index.html?mode=self&surface=mobile');await page.locator('[data-row="OT002"] [data-history="application"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('.history-scroll').evaluate(el=>el.scrollWidth>el.clientWidth));await page.locator('#dialogClose').click();
 await page.locator('[data-row="OT003"] [data-more]').click();await page.locator('#rowMoreMenu [data-action="撤回"]').click();await page.locator('#confirmWithdraw').click();await page.reload();assert.match(await page.locator('[data-row="OT003"] .status').first().innerText(),/已撤回/);
 await page.locator('[data-row="OT003"] [data-more]').click();await page.locator('#rowMoreMenu [data-action="重新提交"]').click();await page.locator('#confirmResubmit').click();await page.reload();assert.match(await page.locator('[data-row="OT003"] .status').first().innerText(),/审批中/);await page.locator('[data-row="OT003"] [data-history="application"]').click();assert.match(await page.locator('#dialogBody').innerText(),/已撤回/);assert.deepEqual(errors,[]);
});
test('withdraw remains in more, pending only; confirmation and cancel preserve document values and old history',t=>{
 const app=load(t);more(app.doc);const approved=app.doc.querySelector('#rowMoreMenu [data-action="撤回"]');assert.ok(approved);assert.equal(approved.disabled,true);
 const before=app.read().find(r=>r.id==='OT003');more(app.doc,'OT003');app.doc.querySelector('#rowMoreMenu [data-action="撤回"]').click();assert.equal(app.read().find(r=>r.id==='OT003').status,'审批中');app.doc.querySelector('#cancelWithdraw').click();assert.deepEqual(app.read().find(r=>r.id==='OT003'),before);
 more(app.doc,'OT003');app.doc.querySelector('#rowMoreMenu [data-action="撤回"]').click();app.doc.querySelector('#confirmWithdraw').click();const after=app.read().find(r=>r.id==='OT003');assert.equal(after.status,'已撤回');assert.equal(after.type,'变更');assert.equal(after.start,before.start);assert.equal(after.end,before.end);assert.equal(after.vestingDate,before.vestingDate);assert.deepEqual(after.history.slice(1),before.history.slice(1));assert.equal(after.history[0].status,'已撤回');
 const refreshed=load(t,'',app.read());more(refreshed.doc,'OT003');assert.equal(refreshed.doc.querySelector('#rowMoreMenu [data-action="撤回"]').disabled,true);
});
test('withdraw rechecks state on confirm; self and team have the same entry without HR adjustment',t=>{
 const app=load(t);more(app.doc,'OT003');app.doc.querySelector('#rowMoreMenu [data-action="撤回"]').click();const latest=app.read();latest.find(r=>r.id==='OT003').status='通过';app.w.sessionStorage.setItem('hr-overtime-list-v1',JSON.stringify(latest));app.doc.querySelector('#confirmWithdraw').click();assert.equal(app.read().find(r=>r.id==='OT003').status,'通过');assert.match(app.doc.querySelector('#withdrawError').textContent,/变化|不可撤回/);
 for(const mode of ['self','team']){const other=load(t,'?mode='+mode);more(other.doc,'OT003');assert.equal(other.doc.querySelector('#rowMoreMenu [data-action="撤回"]').disabled,false);assert.equal(other.doc.querySelector('[data-action="调整归属日期"]'),null);}
});
test('adjustment displays saved overtime hours read-only, unchanged by date edits for single and multi groups',t=>{
 const app=load(t);more(app.doc);app.doc.querySelector('#rowMoreMenu [data-action="调整归属日期"]').click();const hours=app.doc.querySelector('[data-overtime-hours]');assert.ok(hours);assert.equal(hours.value,'3.00');assert.equal(hours.tagName,'OUTPUT');app.doc.querySelector('[data-vesting-input]').value='2026-09-10';assert.equal(hours.value,'3.00');app.doc.querySelector('#saveVesting').click();assert.equal(app.read()[0].hours,'3.00');
 const seed=app.read();seed[0].hours='5.50';seed[0].requestHours='5.50';seed[0].groups=[{date:'2026-09-11',start:'18:00',end:'21:00',endDay:'same',vesting:'2026-09-10'},{date:'2026-09-12',start:'18:00',end:'21:00',endDay:'same',vesting:'2026-09-12'}];const multi=load(t,'',seed);more(multi.doc);multi.doc.querySelector('#rowMoreMenu [data-action="调整归属日期"]').click();assert.equal(multi.doc.querySelector('[data-overtime-hours]').value,'5.50');
});
test('resubmit after withdrawal returns to approval without recomputing dates, retaining withdrawn history',t=>{
 const app=load(t);more(app.doc);assert.ok(app.doc.querySelector('#rowMoreMenu [data-action="重新提交"]'));assert.equal(app.doc.querySelector('#rowMoreMenu [data-action="重新提交"]').disabled,true);
 more(app.doc,'OT003');app.doc.querySelector('#rowMoreMenu [data-action="撤回"]').click();app.doc.querySelector('#confirmWithdraw').click();const before=app.read().find(r=>r.id==='OT003');
 more(app.doc,'OT003');app.doc.querySelector('#rowMoreMenu [data-action="重新提交"]').click();app.doc.querySelector('#cancelResubmit').click();assert.deepEqual(app.read().find(r=>r.id==='OT003'),before);
 more(app.doc,'OT003');app.doc.querySelector('#rowMoreMenu [data-action="重新提交"]').click();app.doc.querySelector('#confirmResubmit').click();const after=app.read().find(r=>r.id==='OT003');assert.equal(after.status,'审批中');assert.equal(after.type,'变更');assert.equal(after.vestingDate,before.vestingDate);assert.equal(after.hours,before.hours);assert.equal(after.start,before.start);assert.equal(after.end,before.end);assert.deepEqual(after.history.slice(1),before.history);assert.equal(after.history[0].status,'审批中');more(app.doc,'OT003');assert.equal(app.doc.querySelector('#rowMoreMenu [data-action="重新提交"]').disabled,true);
});
test('resubmit follows leave eligibility for rejected records and rejects stale confirmation',t=>{
 const app=load(t),seed=app.read();const record=seed.find(r=>r.id==='OT003');record.status='已驳回';record.history[0].status='已驳回';const other=load(t,'',seed);more(other.doc,'OT003');assert.equal(other.doc.querySelector('#rowMoreMenu [data-action="重新提交"]').disabled,false);other.doc.querySelector('#rowMoreMenu [data-action="重新提交"]').click();const latest=other.read();latest.find(r=>r.id==='OT003').status='审批中';other.w.sessionStorage.setItem('hr-overtime-list-v1',JSON.stringify(latest));other.doc.querySelector('#confirmResubmit').click();assert.match(other.doc.querySelector('#resubmitError').textContent,/变化/);assert.deepEqual(other.read(),latest);
});
test('single-date adjustment is compact with summary values, two date controls and no placeholder cell',async t=>{
 const {chromium}=require('playwright');const browser=await chromium.launch({headless:true,channel:'chrome'});t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(5000);const base=process.env.OVERTIME_BASE_URL||(process.env.PROTOTYPE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'')+'/06-HR%E5%8A%A0%E7%8F%AD%E7%94%B3%E8%AF%B7';await page.goto(base+'/index.html');await page.locator('[data-row="OT001"] [data-more]').click();await page.locator('#rowMoreMenu [data-action="调整归属日期"]').click();const box=await page.locator('#listOverlay .modal').boundingBox();assert.ok(box.width<=700,'single adjustment dialog must not be a wide application form');assert.equal(await page.locator('.attribution-spacer').count(),0);assert.equal(await page.locator('#dialogBody input').count(),2);assert.match(await page.locator('.vesting-summary').innerText(),/2026-09-11 18:00/);assert.match(await page.locator('.vesting-summary').innerText(),/3.00/);
});

