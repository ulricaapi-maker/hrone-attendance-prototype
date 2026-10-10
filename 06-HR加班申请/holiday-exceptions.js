/* Local review fixtures; no production data or messages. */
'use strict';
const holidayExceptionText='加班归属日期未匹配到节假日配置';
const holidayDemo={configured:['2026-10-01','2026-10-02','2026-05-01'],holidayShifts:['2026-10-01','2026-10-02','2026-10-03','2026-05-01']};
function holidayState(row,r){
 const date=row.vestingDate||'';
 const shift=row.shiftAttr||(holidayDemo.holidayShifts.includes(date)?'节假日':date?[0,6].includes(new Date(date+'T12:00:00').getDay())?'公休日':'工作日':'');
 const missing=shift==='节假日'&&!holidayDemo.configured.includes(date);
 const special=['FBU澳洲区','FBU日本区'].includes(r.divideArea);
 return {kind:shift==='节假日'&&missing&&special?'公休日加班':shift?shift+'加班':'—',exception:missing&&!special};
}
function kindWithException(row,r,index){
 const state=holidayState(row,r);
 return `<span class="kind-with-exception">${esc(state.kind)}${mode==='hr'&&state.exception?`<button type="button" class="holiday-exception-tag" data-holiday-exception="${esc(r.id)}" data-segment-index="${index}" aria-label="查看加班类型异常详情">异常</button>`:''}</span>`;
}
function showHolidayException(r,index){
 const row=recordRows(r)[index]?.row;if(!row||!holidayState(row,r).exception)return;
 modal('提示',`<p class="exception-message" style="margin:0">${holidayExceptionText}</p>`,`<button class="btn btn-default" id="exceptionClose">关闭</button>`);
 $('#exceptionClose').onclick=closeModal;
}
const originalRecordRows=recordRows;
recordRows=function(r){return originalRecordRows(r).map(item=>{const state=holidayState(item.row,r);item.row.kind=state.kind;return item;});};
// Include one affected period and one normal period to demonstrate per-period labels.
if(!records.some(r=>r.id==='OT-HOLIDAY-EXCEPTION')){
 const r=make('OT-HOLIDAY-EXCEPTION','申请','通过',{start:'2026-10-03 18:30',end:'2026-10-03 21:00',vestingDate:'2026-10-03',kind:'节假日加班',actualStart:'—',actualEnd:'—',actualHours:'—',groups:[{detailId:'OT-HOLIDAY-EXCEPTION-1',date:'2026-10-03',start:'18:30',end:'21:00',endDay:'same',vesting:'2026-10-03',hours:'2.50',actualStart:'—',actualEnd:'—',actualHours:'—',comp:'调休假',reason:'项目上线支持'},{detailId:'OT-HOLIDAY-EXCEPTION-2',date:'2026-10-04',start:'18:30',end:'20:00',endDay:'same',vesting:'2026-10-04',hours:'1.50',actualStart:'2026-10-04 18:32',actualEnd:'2026-10-04 20:00',actualHours:'1.47',comp:'加班费',reason:'上线问题处理'}]});
 records.unshift(r);persist();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-holiday-exception]');if(b&&mode==='hr')showHolidayException(records.find(r=>r.id===b.dataset.holidayException),Number(b.dataset.segmentIndex));});
const originalDetail=detail;
detail=function(r,version=null){originalDetail(r,version);const x=version||r,affected=recordRows(x).filter(item=>holidayState(item.row,x).exception);if(affected.length&&x.type!=='补卡'){
 const card=document.createElement('section');card.className='detail-card';card.innerHTML=`<h3 class="detail-section-title">加班类型异常</h3>${affected.map(item=>`<div class="exception-detail-line"><b>加班 ${item.index+1} · ${esc(item.row.vestingDate)}</b><p class="exception-message">${holidayExceptionText}</p><span class="muted">${esc(item.row.start)} ～ ${esc(item.row.end)}</span></div>`).join('')}`;$('#detailPage .detail-layout > div').append(card);
}};
render();
