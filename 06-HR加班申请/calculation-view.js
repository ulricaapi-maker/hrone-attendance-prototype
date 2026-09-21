/* Shared rendering only. Results are supplied by the application or review fixtures. */
(function(){
 'use strict';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const hours=m=>Number((m/60).toFixed(2))+'小时';
 const deductionDuration=m=>m%60===0?hours(m):m+'分钟';
 function detail(d){
  const deductions=d.deductions||[];
  const filling=d.fillingMinutes??Math.max(0,d.grossMinutes-deductions.reduce((n,r)=>n+r.minutes,0));
  return `<div class="popover-table-wrap"><table><thead><tr><th>加班日期</th><th>归属日期</th><th>加班时间</th><th>填写时长</th><th>实际时长</th></tr></thead><tbody><tr><td><span class="calculation-date">${escape(d.date)}<span class="day-type">${escape(d.type)}</span></span></td><td>${escape(d.vestingDate||'—')}</td><td>${escape(d.time)}</td><td>${hours(filling)}</td><td class="hours-cell${d.resultMinutes!==filling?' adjusted':''}">${hours(d.resultMinutes)}</td></tr></tbody></table></div>${deductions.length||d.note?`<div class="calculation-explanation">${deductions.map(r=>`<p class="calculation-deduction">填写时长已计算扣除时长，${escape(r.time)}不计入加班时长（${escape(r.label)}，共${deductionDuration(r.minutes)}）。</p>`).join('')}${d.note?`<p class="calculation-note">${escape(d.note)}</p>`:''}</div>`:''}`;
 }
 window.OvertimeCalculationView={detail,hours};
})();
