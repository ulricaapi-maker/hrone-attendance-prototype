'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode=new URLSearchParams(location.search).get('mode')||'hr';
const isSelf=mode==='self',isTeam=mode==='team';
const isMobile=isSelf&&new URLSearchParams(location.search).get('surface')==='mobile';
const selfEmployee=new URLSearchParams(location.search).get('region')==='overseas'?'B':'A';
const states=['草稿','审批中','通过','不通过','已作废','已驳回','已撤回'];
const fields=['姓名','工号','组织','审批状态','申请开始时间','申请结束时间','申请时长','实际开始时间','实际结束时间','实际时长','归属日期','补卡状态','加班类型','补偿方式','值班方式','工作城市','值班补偿方式'];
const keys=['name','no','dept','status','start','end','requestHours','actualStart','actualEnd','actualHours','vestingDate','punchStatus','kind','comp','dutyMode','city','dutyComp'];
const widths=[120,100,180,120,160,160,100,160,160,100,120,120,130,100,110,200,130,178];
const organizationFields=['一级组织','二级组织','三级组织','四级组织','五级组织','六级组织','七级组织','八级组织'];
const organizationKeys=['org1','org2','org3','org4','org5','org6','org7','org8'];
const exportableFields=[...fields.slice(0,3),...organizationFields,...fields.slice(3)];
const exportableKeys=[...keys.slice(0,3),...organizationKeys,...keys.slice(3)];
const eye='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const employees={
 A:{name:'示例员工A',no:'E10086',dept:'产品研发部',org1:'纵腾集团',org2:'中国区',org3:'产品研发中心',org4:'产品研发部',org5:'—',org6:'—',org7:'—',org8:'—'},
 B:{name:'示例员工B',no:'E10092',dept:'客户成功部',org1:'纵腾集团',org2:'海外区',org3:'国际业务中心',org4:'客户成功部',org5:'—',org6:'—',org7:'—',org8:'—'}
};
const snapshot=r=>{const {history,punchHistory,...rest}=r;return structuredClone(rest);};
function make(id,type,status,extra={}){const r={id,...employees.A,region:'国内',start:'2026-09-11 18:00',end:'2026-09-11 21:00',actualStart:status==='通过'&&type!=='撤销'?'2026-09-11 18:03':'—',actualEnd:status==='通过'&&type!=='撤销'?'2026-09-11 21:04':'—',hours:'3.00',actualHours:status==='通过'&&type!=='撤销'?'3.00':'—',vestingDate:'2026-09-11',kind:'工作日加班',comp:'加班费',dutyFlag:'普通加班',dutyMode:'—',city:'—',dutyComp:'—',type,status,punchStatus:'—',submitted:'2026-09-10 10:00',reason:'项目上线支持',sealed:false,...extra};r.history=[snapshot(r)];r.punchHistory=[];if(type!=='申请'){r.history.push({...snapshot(r),type:'申请',status:'通过',start:'2026-09-11 18:00',end:'2026-09-11 20:00',hours:'2.00',actualHours:'2.00',actualEnd:'2026-09-11 20:04',submitted:'2026-09-09 09:30',archived:true});}return r;}
let records=[
 make('OT001','申请','通过'),
 make('OT002','变更','通过',{end:'2026-09-11 22:00',hours:'4.00',punchStatus:'通过'}),
 make('OT003','变更','审批中'),make('OT004','撤销','审批中'),make('OT005','撤销','通过'),
 make('OT006','申请','通过',{sealed:true,start:'2026-08-20 18:00',end:'2026-08-20 21:00',actualStart:'2026-08-20 18:03',actualEnd:'2026-08-20 21:04',vestingDate:'2026-08-20'}),
 make('OT007','申请','通过',{punchStatus:'审批中'}),make('OT008','申请','通过',{...employees.B,region:'海外'}),
 make('OT009','申请','通过',{start:'2026-10-01 09:00',end:'2026-10-01 17:00',actualStart:'2026-10-01 09:02',actualEnd:'2026-10-01 17:03',hours:'8.00',actualHours:'8.00',vestingDate:'2026-10-01',kind:'节假日加班',comp:'加班费',dutyFlag:'值班',dutyMode:'现场值班',city:'中国 / 广东省 / 深圳市',dutyComp:'津贴',reason:'节假日现场值班'}),
 ...['草稿','不通过','已作废','已驳回','已撤回'].map((s,i)=>make('OT'+String(10+i).padStart(3,'0'),'申请',s))
];
records.forEach(r=>{if(r.punchStatus!=='—')r.punchHistory=[{...snapshot(r),type:'补卡',status:r.punchStatus,start:r.start,end:r.end,files:['加班证明1.jpg','加班证明2.jpg'],reason:'补充加班出勤记录',submitted:'2026-09-12 09:00'}];});
records[1].history.splice(1,0,{...snapshot(records[1]),type:'变更',status:'通过',end:'2026-09-11 21:30',hours:'3.50',submitted:'2026-09-09 16:00',archived:true});
const storageKey='hr-overtime-list-v1';try{const saved=JSON.parse(sessionStorage.getItem(storageKey));if(Array.isArray(saved))records=saved;}catch{}
const cancelledChain=records.find(r=>r.id==='OT005');
if(cancelledChain&&cancelledChain.history?.length===2){cancelledChain.history.splice(1,0,{...snapshot(cancelledChain),type:'变更',status:'通过',end:'2026-09-11 21:30',hours:'3.50',requestHours:'3.50',submitted:'2026-09-10 14:00',archived:true});}
// Import new applications from the existing form without changing its submission flow.
try{const imported=JSON.parse(sessionStorage.getItem('hr-overtime-demo-records')||'[]');for(const item of imported){if(!item.listId)continue;const signature=JSON.stringify(item);if(records.some(r=>r.source===signature))continue;const g=item.groups?.[0];if(!g)continue;const isDuty=Boolean(g.dutyMode);const r=make('NEW'+records.length,'申请',item.status==='已通过'?'通过':item.status,{...employees[item.employee],region:item.employee==='B'?'海外':'国内',start:g.date+' '+g.start,end:(g.endDay==='next'?nextDay(g.date):g.date)+' '+g.end,actualStart:'—',actualEnd:'—',hours:item.applicationHours==null?'—':Number(item.applicationHours).toFixed(2),vestingDate:g.vesting||'',comp:item.comp||g.comp,dutyFlag:isDuty?'值班':'普通加班',dutyMode:g.dutyMode||'—',city:g.city||'—',dutyComp:g.dutyComp||'—',source:signature,groups:item.groups,reason:g.reason});records.unshift(r);}}catch{}
// Preserve existing application duration; actual results are not inferred from it.
function normalizeTimes(r){r.requestHours=r.hours??'—';r.actualHours=r.actualHours??'—';r.vestingDate=r.vestingDate||String(r.start||'').slice(0,10)||'—';r.dutyFlag=r.dutyFlag||'普通加班';r.dutyMode=r.dutyMode||'—';r.city=r.city||'—';r.dutyComp=r.dutyComp||'—';if(r.status!=='通过'||r.type==='撤销'){r.actualStart='—';r.actualEnd='—';r.actualHours='—';}return r;}
records.forEach(r=>{normalizeTimes(r);r.history?.forEach(normalizeTimes);r.punchHistory?.forEach(normalizeTimes);});
// Include cities from locally submitted applications in the advanced query options.
const listedCities=new Set([...$('#filterCity').options].map(option=>option.value));
for(const r of records){if(r.city&&r.city!=='—'&&!listedCities.has(r.city)){const option=document.createElement('option');option.value=option.textContent=r.city;$('#filterCity').append(option);listedCities.add(r.city);}}
function nextDay(d){const date=new Date(d+'T12:00:00');date.setDate(date.getDate()+1);return date.toISOString().slice(0,10);}
let page=1,filtered=[],exportFields=[...fields],focusReturn=null,detailRecord=null,toastTimer;
function persist(){sessionStorage.setItem(storageKey,JSON.stringify(records));}
function badge(s){return `<span class="status ${s==='通过'?'pass':s==='审批中'?'pending':['不通过','已驳回'].includes(s)?'reject':''}">${esc(s)}</span>`;}
function policy(r){if(r.sealed)return {变更:'考勤已封存，不可操作',撤销:'考勤已封存，不可操作',补卡:'考勤已封存，不可操作'};if(r.punchStatus==='审批中')return {变更:'已有补卡申请正在审批',撤销:'已有补卡申请正在审批',补卡:'已有补卡申请正在审批'};if(r.status!=='通过'||r.type==='撤销')return {变更:'当前状态不可操作',撤销:'当前状态不可操作',补卡:'当前状态不可操作'};return {变更:'',撤销:'',补卡:r.region==='海外'?'海外补卡提交能力待确认':''};}
function actions(r){const p=policy(r);return `<div class="row-actions">${['变更','补卡'].map(a=>`<span title="${esc(p[a])}"><button class="btn-text" data-action="${a}" data-id="${esc(r.id)}" ${p[a]?'disabled':''}>${a}</button></span>`).join('')}<button class="btn-text" data-more data-id="${esc(r.id)}" aria-haspopup="menu" aria-expanded="false">更多</button></div>`;}
function vestingDates(r){return r.groups?.length?r.groups.map(g=>g.vesting||'—'):[r.vestingDate];}
function historyButton(r,punch=false){return `<button class="eye" data-history="${punch?'punch':'application'}" data-id="${r.id}" title="${punch?'查看补卡历史':'查看历史记录'}" aria-label="${punch?'查看补卡历史':'查看历史记录'}">${eye}</button>`;}
function mobileRecord(r){return `<tr data-row="${r.id}"><td colspan="18"><article class="mobile-record"><header><button class="btn-text mobile-record-title" data-detail="${r.id}">${esc(r.kind)}</button><span>${badge(r.status)}${r.history?.length>1?historyButton(r):''}</span></header><button class="mobile-record-body" data-detail="${r.id}" aria-label="查看${esc(r.start)}的加班详情"><span><i>开始时间</i><b>${esc(r.start)}</b></span><span><i>结束时间</i><b>${esc(r.end)}</b></span><span><i>加班时长（小时）</i><b>${esc(r.requestHours)}</b></span></button><div class="mobile-record-meta"><span>${esc(r.comp)}${r.dutyMode!=='—'?' · '+esc(r.dutyMode):''}</span><span>归属日期 ${esc([...new Set(vestingDates(r))].join('、'))}</span></div>${r.punchStatus!=='—'?`<div class="mobile-punch">补卡状态 ${badge(r.punchStatus)}${historyButton(r,true)}</div>`:''}<footer>${actions(r)}</footer></article></td></tr>`;}
function inDateRange(value,start,end){const day=String(value||'').slice(0,10);return (!start||day>=start)&&(!end||day<=end);}
function inNumberRange(value,min,max){const number=Number(value);if(!Number.isFinite(number))return !min&&!max;return (!min||number>=Number(min))&&(!max||number<=Number(max));}
let activeRangePicker=null;
const pad2=value=>String(value).padStart(2,'0');
function dateIso(date){return `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`;}
function monthShift(date,offset){return new Date(date.getFullYear(),date.getMonth()+offset,1);}
function monthTitle(date){return `${date.getFullYear()}年 ${date.getMonth()+1}月`;}
function monthDays(month,state){const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7;return Array.from({length:42},(_,index)=>{const date=new Date(month.getFullYear(),month.getMonth(),index-offset+1),iso=dateIso(date),outside=date.getMonth()!==month.getMonth(),edge=iso===state.draftStart||iso===state.draftEnd,inRange=state.draftStart&&state.draftEnd&&iso>state.draftStart&&iso<state.draftEnd;return `<button type="button" class="calendar-day${outside?' outside':''}${inRange?' in-range':''}${edge?' range-edge':''}" data-date="${iso}" aria-label="${iso}">${date.getDate()}</button>`;}).join('');}
function calendarMonth(month,state){return `<section class="calendar-month"><div class="calendar-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="calendar-days">${monthDays(month,state)}</div></section>`;}
function renderRangePicker(){const state=activeRangePicker;if(!state)return;const next=monthShift(state.baseMonth,1);state.popover.innerHTML=`<div class="calendar-toolbar"><span class="calendar-nav-group"><button class="calendar-nav" type="button" data-range-prev-year aria-label="上一年">«</button><button class="calendar-nav" type="button" data-range-prev aria-label="上一个月">‹</button></span><strong>${monthTitle(state.baseMonth)}</strong><strong>${monthTitle(next)}</strong><span class="calendar-nav-group"><button class="calendar-nav" type="button" data-range-next aria-label="下一个月">›</button><button class="calendar-nav" type="button" data-range-next-year aria-label="下一年">»</button></span></div><div class="calendar-months">${calendarMonth(state.baseMonth,state)}${calendarMonth(next,state)}</div><div class="calendar-actions"><button type="button" data-range-clear>清空</button><button type="button" data-range-confirm>确定</button></div>`;
 state.popover.querySelector('[data-range-prev-year]').onclick=()=>{state.baseMonth=monthShift(state.baseMonth,-12);renderRangePicker();};
 state.popover.querySelector('[data-range-prev]').onclick=()=>{state.baseMonth=monthShift(state.baseMonth,-1);renderRangePicker();};
 state.popover.querySelector('[data-range-next]').onclick=()=>{state.baseMonth=monthShift(state.baseMonth,1);renderRangePicker();};
 state.popover.querySelector('[data-range-next-year]').onclick=()=>{state.baseMonth=monthShift(state.baseMonth,12);renderRangePicker();};
 state.popover.querySelectorAll('[data-date]').forEach(button=>button.onclick=()=>{const value=button.dataset.date;if(!state.draftStart||state.draftEnd){state.draftStart=value;state.draftEnd='';}else if(value<state.draftStart){state.draftStart=value;}else{state.draftEnd=value;}renderRangePicker();});
 state.popover.querySelector('[data-range-clear]').onclick=()=>{state.startInput.value='';state.endInput.value='';syncRangeTrigger(state.trigger);closeRangePicker();};
 state.popover.querySelector('[data-range-confirm]').onclick=()=>{if(state.draftStart&&!state.draftEnd)state.draftEnd=state.draftStart;state.startInput.value=state.draftStart;state.endInput.value=state.draftEnd;syncRangeTrigger(state.trigger);closeRangePicker();};
}
function syncRangeTrigger(trigger){const start=$('#'+trigger.dataset.rangeStart).value,end=$('#'+trigger.dataset.rangeEnd).value,startLabel=trigger.querySelector('[data-range-start-label]'),endLabel=trigger.querySelector('[data-range-end-label]');startLabel.textContent=start||'开始日期';endLabel.textContent=end||'结束日期';startLabel.classList.toggle('has-value',Boolean(start));endLabel.classList.toggle('has-value',Boolean(end));}
function closeRangePicker(){if(!activeRangePicker)return;activeRangePicker.trigger.setAttribute('aria-expanded','false');activeRangePicker.popover.remove();activeRangePicker=null;}
function openRangePicker(trigger){if(activeRangePicker?.trigger===trigger){closeRangePicker();return;}closeRangePicker();const startInput=$('#'+trigger.dataset.rangeStart),endInput=$('#'+trigger.dataset.rangeEnd),source=startInput.value?new Date(startInput.value+'T12:00:00'):new Date(),popover=document.createElement('div');popover.className='date-range-popover';popover.setAttribute('role','dialog');popover.setAttribute('aria-label','选择日期范围');popover.onclick=event=>event.stopPropagation();trigger.closest('.range-query').append(popover);trigger.setAttribute('aria-expanded','true');activeRangePicker={trigger,startInput,endInput,popover,baseMonth:new Date(source.getFullYear(),source.getMonth(),1),draftStart:startInput.value,draftEnd:endInput.value};renderRangePicker();}
function render(){
 filtered=records.filter(r=>
  (!isSelf||r.no===employees[selfEmployee].no)&&
  (r.name+r.no).includes($('#filterEmployee').value)&&
  r.dept.includes($('#filterOrg').value)&&
  inDateRange(r.start,$('#filterDateStart').value,$('#filterDateEnd').value)&&
  (!$('#filterStatus').value||r.status===$('#filterStatus').value)&&
  (!$('#filterKind').value||r.kind===$('#filterKind').value)&&
  (!$('#filterComp').value||r.comp===$('#filterComp').value)&&
  vestingDates(r).some(date=>inDateRange(date,$('#filterVestingStart').value,$('#filterVestingEnd').value))&&
  (!$('#filterDuty').value||r.dutyFlag===$('#filterDuty').value)&&
  (!$('#filterDutyMode').value||r.dutyMode===$('#filterDutyMode').value)&&
  (!$('#filterCity').value||r.city===$('#filterCity').value)&&
  (!$('#filterDutyComp').value||r.dutyComp===$('#filterDutyComp').value)&&
  (!$('#filterPunch').value||(r.punchStatus==='—'?'未补卡':r.punchStatus)===$('#filterPunch').value)&&
  inNumberRange(r.requestHours,$('#filterRequestHoursMin').value,$('#filterRequestHoursMax').value)&&
  inNumberRange(r.actualHours,$('#filterActualHoursMin').value,$('#filterActualHoursMax').value)
 );
 page=Math.min(page,Math.max(1,Math.ceil(filtered.length/10)));
 $('#rows').innerHTML=filtered.slice((page-1)*10,page*10).map(r=>`<tr data-row="${r.id}">${keys.map(k=>`<td class="${k==='dept'?'department':''}" title="${esc(r[k])}">${k==='name'?`<button class="btn-text" data-detail="${r.id}">${esc(r.name)}</button>`:k==='status'?`<span class="cell-with-icon">${badge(r.status)}${r.history?.length>1?historyButton(r):''}</span>`:k==='punchStatus'?`<span class="cell-with-icon">${r.punchStatus==='—'?'—':badge(r.punchStatus)+historyButton(r,true)}</span>`:esc(k==='vestingDate'?[...new Set(vestingDates(r))].join('、'):r[k])}${k==='start'&&r.groups?.length>1?` <span class="tag">${r.groups.length}组</span>`:''}</td>`).join('')}<td>${actions(r)}</td></tr>`).join('')||`<tr><td colspan="${keys.length+1}" class="empty">暂无符合条件的加班申请</td></tr>`;
 $('#recordTotal').textContent=isSelf?'我的加班':isTeam?'团队加班':'加班申请';
 if(isMobile)$('#rows').innerHTML=filtered.slice((page-1)*10,page*10).map(mobileRecord).join('')||'<tr><td class="empty">暂无符合条件的加班申请</td></tr>';
 $('#count').textContent=`共 ${filtered.length} 条，每页 10 条`;
 $('#pages').innerHTML=`<button class="page-btn" data-page="${page-1}" ${page===1?'disabled':''}>‹</button>${Array.from({length:Math.max(1,Math.ceil(filtered.length/10))},(_,i)=>`<button class="page-btn ${page===i+1?'active':''}" data-page="${i+1}">${i+1}</button>`).join('')}<button class="page-btn" data-page="${page+1}" ${page*10>=filtered.length?'disabled':''}>›</button>`;
}
function modal(title,body,footer=''){focusReturn=document.activeElement;$('#dialogTitle').textContent=title;$('#dialogBody').innerHTML=body;$('#dialogFooter').innerHTML=footer;$('#listOverlay').hidden=false;document.body.classList.add('locked');$('#dialogClose').focus();}
function closeModal(){ $('#listOverlay').hidden=true;document.body.classList.remove('locked');focusReturn?.focus();}
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',3000);}
function showHistory(r,punch){
 const entries=(punch?r.punchHistory:r.history.slice(1)).map((record,index)=>({record,index:punch?index:index+1}));
 const headers=punch?['补卡开始时间','补卡结束时间','申请理由','审批状态','提交时间','操作']:['单据类型','加班起止时间','申请时长（h）','归属日期','补偿方式','审批状态','提交时间','操作'];
 const periods=x=>x.groups?.length?x.groups.map(g=>`${g.date} ${g.start} ～ ${g.endDay==='next'?nextDay(g.date):g.date} ${g.end}`):[`${x.start} ～ ${x.end}`];
 const lines=values=>values.map(v=>`<div class="history-line">${esc(v)}</div>`).join('');
 modal(punch?'补卡历史':'申请历史',`<p class="muted history-employee">${esc(r.name)} · ${esc(r.no)}</p><div class="history-scroll"><table class="history-table ${punch?'punch-history':''}"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${entries.map(({record:x,index})=>`<tr>${punch?`<td>${esc(x.start)}</td><td>${esc(x.end)}</td><td class="history-reason">${esc(x.reason||'—')}</td>`:`<td>${esc(x.type)}</td><td>${lines(periods(x))}</td><td>${esc(x.requestHours??x.hours??'—')}</td><td>${lines(vestingDates(x))}</td><td>${lines(x.groups?.length?x.groups.map(g=>g.comp||x.comp||'—'):[x.comp||'—'])}</td>`}<td>${badge(x.status)}</td><td>${esc(x.submitted)}</td><td><button class="btn-text" data-version="${index}" data-id="${esc(r.id)}" data-punch="${punch}">查看</button></td></tr>`).join('')||`<tr><td colspan="${headers.length}" class="empty">暂无历史记录</td></tr>`}</tbody></table></div>`);
}
function detail(r,version=null){const x=version||r;detailRecord=r;closeModal();$('#listPage').hidden=true;$('#detailPage').hidden=false;const detailKeys=version?.type==='补卡'?['name','no','dept','start','end']:keys.filter(k=>!['status','punchStatus'].includes(k));const label=k=>version?.type==='补卡'&&k==='start'?'补卡开始时间':version?.type==='补卡'&&k==='end'?'补卡结束时间':fields[keys.indexOf(k)];$('#detailPage').innerHTML=`<section class="detail-summary"><div><div class="detail-title">${esc(x.name)} · ${x.type==='申请'?'加班申请':x.type==='补卡'?'补卡':'加班'+x.type}${badge(x.status)}</div><div class="doc-meta">工号：${esc(x.no)}　提交时间：${x.submitted}${r.sealed?'　考勤已封存':''}</div></div><button class="btn btn-default" id="backList">返回列表</button></section><div class="detail-layout"><div><section class="detail-card"><h3 class="detail-section-title">${x.type==='补卡'?'补卡信息':'加班信息'}</h3><div class="detail-grid">${detailKeys.map(k=>`<div class="detail-item"><span class="detail-field-label">${label(k)}</span><span class="detail-field-value">${esc(x[k])}</span></div>`).join('')}<div class="detail-item full"><span class="detail-field-label">申请理由</span><span class="detail-field-value">${esc(x.reason||'—')}</span></div>${x.files?`<div class="detail-item full"><span class="detail-field-label">加班证明附件</span><span>${x.files.map(esc).join('、')}</span></div>`:''}</div></section>${x.groups?.length>1?`<section class="detail-card"><h3 class="detail-section-title">加班明细</h3><table style="min-width:0"><thead><tr><th>加班日期</th><th>开始时间</th><th>结束时间</th></tr></thead><tbody>${x.groups.map(g=>`<tr><td>${g.date}</td><td>${g.start}</td><td>${g.end}</td></tr>`).join('')}</tbody></table></section>`:''}</div><aside class="approval-card"><h3 class="approval-title">审批记录</h3><div class="timeline-item">提交申请<p>${esc(x.name)} · ${x.submitted}</p></div><div class="timeline-item">${x.status}<p>${x.status==='通过'?'示例审批人 · 审批通过':x.status==='审批中'?'等待示例审批人处理':'当前公共审批状态'}</p></div></aside></div>`;appendApplicationDetails(x,version);$('#backList').onclick=()=>{$('#detailPage').hidden=true;$('#listPage').hidden=false;};}
function appendApplicationDetails(x,version){
 const container=$('#detailPage .detail-layout>div');
 if(x.type==='变更'||x.type==='撤销'){const reason=x.type==='变更'?x.changeReason:x.cancelReason;if(reason){const card=document.createElement('section');card.className='detail-card';card.innerHTML=`<h3 class="detail-section-title">${x.type}信息</h3><div class="detail-item"><span class="detail-field-label">${x.type}原因</span><span class="detail-field-value">${esc(reason)}</span></div>`;container.append(card);}}
 if(x.groups?.length&&x.type!=='补卡'){
  const oldTable=container.querySelector('table');oldTable?.closest('.detail-card').remove();
  for(const [i,g] of x.groups.entries()){const card=document.createElement('section');card.className='detail-card';const pairs=[['加班日期',g.date],['归属日期',g.vesting||'—'],['开始时间','当日 '+g.start],['结束时间',(g.endDay==='next'?'次日 ':'当日 ')+g.end],['加班补偿方式',g.comp||x.comp],...(g.dutyMode?[['值班方式',g.dutyMode],['工作城市',g.city],['值班补偿方式',g.dutyComp]]:[])];card.innerHTML=`<h3 class="detail-section-title">加班 ${i+1}</h3><div class="detail-grid">${pairs.map(([k,v])=>`<div class="detail-item"><span class="detail-field-label">${k}</span><span class="detail-field-value">${esc(v||'—')}</span></div>`).join('')}<div class="detail-item full"><span class="detail-field-label">原申请理由</span><span class="detail-field-value">${esc(g.reason||'—')}</span></div></div>`;container.append(card);}
 }
 if(!version){const toolbar=document.createElement('div');toolbar.className='detail-summary-actions';toolbar.innerHTML=actions(x);$('#detailPage .detail-summary').append(toolbar);}
}
function operation(r,a){if(a==='变更'||a==='撤销'){persist();location.href=(isMobile?'mobile/':'')+'application.html?'+new URLSearchParams({mode,action:a==='变更'?'change':'cancel',id:r.id,...(isSelf&&selfEmployee==='B'?{region:'overseas'}:{})});return;}const old=r.punchHistory[0],isPunch=a==='补卡';let files=isPunch?[...(old?.files||[])]:[];const input=(label,id,value,type='datetime-local')=>`<label><span><i class="required">*</i>${label}</span><input id="${id}" type="${type}" value="${esc(value.replace(' ','T'))}" required></label>`;
const form=a==='撤销'?`<div class="full muted">${esc(r.start)} ～ ${esc(r.end)}　${esc(r.comp)}</div>`:input(isPunch?'补卡开始时间':'申请开始时间','opStart',isPunch?(old?.start||r.start):r.start)+input(isPunch?'补卡结束时间':'申请结束时间','opEnd',isPunch?(old?.end||r.end):r.end)+(isPunch?`<label class="full"><span><i class="required">*</i>加班证明附件</span><input id="opFiles" type="file" multiple><div id="fileList"></div></label>`:`<label>补偿方式<select id="opComp"><option ${r.comp==='加班费'?'selected':''}>加班费</option><option ${r.comp==='调休假'?'selected':''}>调休假</option></select></label>`);
modal(isPunch?'补卡':'加班'+a+'申请',`<p style="margin-bottom:20px">${esc(r.name)}　<span class="muted">${esc(r.no)}　${esc(r.dept)}</span></p><form class="operation-form" id="opForm">${form}<label class="full"><span><i class="required">*</i>${a==='撤销'?'撤销原因':a==='变更'?'变更原因':'申请理由'}</span><textarea id="opReason" required></textarea></label><p class="error full" id="opError" role="alert"></p></form>`,`<button class="btn btn-default" id="opCancel">取消</button><button class="btn btn-primary" id="opSubmit">提交</button>`);
$('#opCancel').onclick=closeModal;function fileRender(){$('#fileList').innerHTML=files.map((f,i)=>`<div class="file-item">${esc(f)}<button type="button" class="btn-text" data-file="${i}">删除</button></div>`).join('');$('#fileList').querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{files.splice(Number(b.dataset.file),1);fileRender();});}if(isPunch){fileRender();$('#opFiles').onchange=e=>{files.push(...Array.from(e.target.files).map(f=>f.name));fileRender();};}
$('#opSubmit').onclick=()=>{if(!$('#opForm').reportValidity())return;if(isPunch&&!files.length){$('#opError').textContent='请上传加班证明附件';return;}if(a!=='撤销'&&$('#opEnd').value<=$('#opStart').value){$('#opError').textContent='结束时间须晚于开始时间';return;}const submitted=new Date().toLocaleString('sv-SE').slice(0,16);const x={...snapshot(r),type:a,status:'审批中',submitted,reason:$('#opReason').value};if(a!=='撤销'){x.start=$('#opStart').value.replace('T',' ');x.end=$('#opEnd').value.replace('T',' ');}if(isPunch){x.files=files;r.punchHistory.unshift(x);r.punchStatus='审批中';}else{r.history[0].archived=true;if(a==='变更'){x.comp=$('#opComp').value;x.hours='—';x.requestHours='—';x.actualHours='—';x.actualStart='—';x.actualEnd='—';}normalizeTimes(x);Object.assign(r,x);r.history.unshift(snapshot(r));}persist();render();closeModal();toast('已提交');};}
$('#columns').innerHTML='<tr>'+[...fields,'操作'].map((f,i)=>`<th style="width:${widths[i]}px">${f}</th>`).join('')+'</tr>';
$('#listTable table').style.width=$('#listTable table').style.minWidth=widths.reduce((sum,width)=>sum+width,0)+'px';
for(const s of states){$('#filterStatus').add(new Option(s,s));$('#filterPunch').add(new Option(s,s));}
document.querySelectorAll('.date-range-trigger').forEach(trigger=>{syncRangeTrigger(trigger);trigger.onclick=event=>{event.stopPropagation();openRangePicker(trigger);};});
$('#query').onclick=()=>{closeRangePicker();page=1;render();};$('#reset').onclick=()=>{document.querySelectorAll('.search-bar [id^="filter"]').forEach(e=>e.value='');document.querySelectorAll('.date-range-trigger').forEach(syncRangeTrigger);closeRangePicker();page=1;render();};$('#dialogClose').onclick=closeModal;
$('#toggleAdvanced').onclick=()=>{const panel=$('#advancedSearch'),open=panel.hidden;panel.hidden=!open;$('#toggleAdvanced').innerHTML=open?'<span aria-hidden="true">↕</span>隐藏高级筛选':'<span aria-hidden="true">↕</span>展开高级筛选';$('#toggleAdvanced').setAttribute('aria-expanded',String(open));};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const r=records.find(r=>r.id===b.dataset.id);if(b.dataset.page){page=Number(b.dataset.page);render();}if(b.dataset.history)showHistory(r,b.dataset.history==='punch');if(b.dataset.detail)detail(records.find(r=>r.id===b.dataset.detail));if(b.dataset.version!==undefined)detail(r,(b.dataset.punch==='true'?r.punchHistory:r.history)[Number(b.dataset.version)]);if(b.dataset.action&&policy(r)?.[b.dataset.action]==='')operation(r,b.dataset.action);});
document.addEventListener('click',e=>{if(activeRangePicker&&!activeRangePicker.trigger.closest('.range-query').contains(e.target))closeRangePicker();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeRangePicker){closeRangePicker();return;}if($('#listOverlay').hidden)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const nodes=[...$('#listOverlay').querySelectorAll('button,input,textarea,select')].filter(x=>!x.disabled&&x.offsetParent!==null);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('#exportSettings').onclick=()=>{modal('导出设置',`<div class="export-grid">${exportableFields.map(f=>`<label><input type="checkbox" value="${f}" ${exportFields.includes(f)?'checked':''}> ${f}</label>`).join('')}</div>`,`<button class="btn btn-default" id="settingsCancel">取消</button><button class="btn btn-primary" id="settingsSave">保存</button>`);$('#settingsCancel').onclick=closeModal;$('#settingsSave').onclick=()=>{const selected=[...$('#dialogBody').querySelectorAll('input:checked')].map(x=>x.value);if(!selected.length){toast('请至少选择一个字段');return;}exportFields=selected;closeModal();};};
$('#export').onclick=()=>{const csv=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const data=[exportFields,...filtered.map(r=>exportFields.map(f=>f==='归属日期'?[...new Set(vestingDates(r))].join('、'):r[exportableKeys[exportableFields.indexOf(f)]]))].map(row=>row.map(csv).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+data],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='加班申请.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
if(isSelf){
 document.title='HR One · 我的加班';document.querySelector('#listPage h1').textContent='我的加班';document.querySelector('.breadcrumb').textContent='我的考勤 / 我的加班';document.querySelector('.user-info').textContent='简体中文　　'+employees[selfEmployee].name;
 $('#filterEmployee').closest('label').hidden=true;$('#filterOrg').closest('label').hidden=true;
 document.querySelector('a[href="application.html"]').href='application.html?mode=self'+(selfEmployee==='B'?'&region=overseas':'');
 document.querySelector('[data-mobile-preview]').hidden=true;
}
if(isTeam){
 document.title='HR One · 团队加班';document.querySelector('#listPage h1').textContent='团队加班';document.querySelector('.breadcrumb').textContent='团队考勤 / 团队加班';document.querySelector('.user-info').textContent='简体中文　　当前主管';
 document.querySelector('a[href="application.html"]').href='application.html?mode=team';
 document.querySelector('[data-mobile-preview]').hidden=true;
}
if(isMobile){
 document.body.classList.add('mobile-list');document.title='HR One · 加班记录';$('#listPage h1').textContent='加班记录';
 const add=document.createElement('a');add.className='mobile-add';add.id='mobileAdd';add.textContent='加班';add.href='mobile/application.html?mode=self'+(selfEmployee==='B'?'&region=overseas':'')+'&resume=1';$('#listPage').append(add);
 const back=document.createElement('a');back.className='mobile-home';back.href=add.href;back.textContent='‹';back.setAttribute('aria-label','返回加班申请');$('#listPage h1').before(back);
}
persist();render();
