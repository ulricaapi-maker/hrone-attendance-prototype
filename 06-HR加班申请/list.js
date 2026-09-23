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
function multiSegmentFixture(){
 const groups=[
  {detailId:'OT015-1',date:'2026-09-18',start:'18:30',endDay:'same',end:'19:30',vesting:'2026-09-18',hours:'1.00',actualStart:'2026-09-18 18:35',actualEnd:'2026-09-18 19:28',actualHours:'0.88',punchStatus:'—',reason:'发布前检查',comp:'调休假'},
  {detailId:'OT015-2',date:'2026-09-18',start:'20:00',endDay:'same',end:'21:00',vesting:'2026-09-18',hours:'1.00',actualStart:'2026-09-18 20:05',actualEnd:'2026-09-18 20:58',actualHours:'0.88',punchStatus:'已驳回',reason:'远程问题处理',comp:'调休假'},
  {detailId:'OT015-3',date:'2026-09-18',start:'21:30',endDay:'same',end:'22:30',vesting:'2026-09-18',hours:'1.00',actualStart:'2026-09-18 21:32',actualEnd:'2026-09-18 22:25',actualHours:'0.88',punchStatus:'—',reason:'回归验证',comp:'调休假'}
 ];
 const r=make('OT015','申请','通过',{start:'2026-09-18 18:30',end:'2026-09-18 22:30',actualStart:'2026-09-18 18:35',actualEnd:'2026-09-18 22:25',hours:'3.00',actualHours:'2.64',requestHours:'3.00',vestingDate:'2026-09-18',comp:'调休假',punchStatus:'已驳回',reason:'分段处理上线任务',groups});
 r.history=[snapshot(r)];
 r.punchHistory=[{...snapshot(r),type:'补卡',status:'已驳回',submitted:'2026-09-19 09:10',reason:'补充第 2 段加班出勤记录',segmentDetailId:'OT015-2',groups:[{...groups[1],files:['加班证明2.jpg']}]}];
 return r;
}
let records=[
 make('OT001','申请','通过'),
 make('OT002','变更','通过',{end:'2026-09-11 22:00',hours:'4.00',punchStatus:'通过'}),
 multiSegmentFixture(),
 make('OT003','变更','审批中'),make('OT004','撤销','审批中'),make('OT005','撤销','通过'),
 make('OT006','申请','通过',{sealed:true,start:'2026-08-20 18:00',end:'2026-08-20 21:00',actualStart:'2026-08-20 18:03',actualEnd:'2026-08-20 21:04',vestingDate:'2026-08-20'}),
 make('OT007','申请','通过',{punchStatus:'审批中'}),make('OT008','申请','通过',{...employees.B,region:'海外'}),
 make('OT009','申请','通过',{start:'2026-10-01 09:00',end:'2026-10-01 17:00',actualStart:'2026-10-01 09:02',actualEnd:'2026-10-01 17:03',hours:'8.00',actualHours:'8.00',vestingDate:'2026-10-01',kind:'节假日加班',comp:'加班费',dutyFlag:'值班',dutyMode:'现场值班',city:'中国 / 广东省 / 深圳市',dutyComp:'津贴',reason:'节假日现场值班'}),
 ...['草稿','不通过','已作废','已驳回','已撤回'].map((s,i)=>make('OT'+String(10+i).padStart(3,'0'),'申请',s))
];
records.forEach(r=>{if(r.punchStatus!=='—'&&!r.punchHistory.length)r.punchHistory=[{...snapshot(r),type:'补卡',status:r.punchStatus,start:r.start,end:r.end,files:['加班证明1.jpg','加班证明2.jpg'],reason:'补充加班出勤记录',submitted:'2026-09-12 09:00'}];});
const changedChain=records.find(r=>r.id==='OT002');
changedChain.history.splice(1,0,{...snapshot(changedChain),type:'变更',status:'通过',end:'2026-09-11 21:30',hours:'3.50',submitted:'2026-09-09 16:00',archived:true});
const storageKey='hr-overtime-list-v1';try{const saved=JSON.parse(sessionStorage.getItem(storageKey));if(Array.isArray(saved))records=saved;}catch{}
const cancelledChain=records.find(r=>r.id==='OT005');
if(cancelledChain&&cancelledChain.history?.length===2){cancelledChain.history.splice(1,0,{...snapshot(cancelledChain),type:'变更',status:'通过',end:'2026-09-11 21:30',hours:'3.50',requestHours:'3.50',submitted:'2026-09-10 14:00',archived:true});}
// Import new applications from the existing form without changing its submission flow.
try{const imported=JSON.parse(sessionStorage.getItem('hr-overtime-demo-records')||'[]');for(const item of imported){if(!item.listId)continue;const signature=JSON.stringify(item);if(records.some(r=>r.source===signature))continue;const g=item.groups?.[0];if(!g)continue;const isDuty=Boolean(g.dutyMode);const r=make('NEW'+records.length,'申请',item.status==='已通过'?'通过':item.status,{...employees[item.employee],region:item.employee==='B'?'海外':'国内',start:g.date+' '+g.start,end:(g.endDay==='next'?nextDay(g.date):g.date)+' '+g.end,actualStart:'—',actualEnd:'—',hours:item.applicationHours==null?'—':Number(item.applicationHours).toFixed(2),vestingDate:g.vesting||'',comp:item.comp||g.comp,dutyFlag:isDuty?'值班':'普通加班',dutyMode:g.dutyMode||'—',city:g.city||'—',dutyComp:g.dutyComp||'—',source:signature,groups:item.groups,reason:g.reason});records.unshift(r);}}catch{}
// Preserve existing application duration; actual results are not inferred from it.
function normalizeTimes(r){r.requestHours=r.requestHours??r.hours??'—';r.actualHours=r.actualHours??'—';r.vestingDate=r.vestingDate||String(r.start||'').slice(0,10)||'—';r.dutyFlag=r.dutyFlag||'普通加班';r.dutyMode=r.dutyMode||'—';r.city=r.city||'—';r.dutyComp=r.dutyComp||'—';if(r.status!=='通过'||r.type==='撤销'){r.actualStart='—';r.actualEnd='—';r.actualHours='—';}return r;}
records.forEach(r=>{normalizeTimes(r);r.history?.forEach(normalizeTimes);r.punchHistory?.forEach(normalizeTimes);});
// Include cities from locally submitted applications in the advanced query options.
const listedCities=new Set([...$('#filterCity').options].map(option=>option.value));
for(const r of records){if(r.city&&r.city!=='—'&&!listedCities.has(r.city)){const option=document.createElement('option');option.value=option.textContent=r.city;$('#filterCity').append(option);listedCities.add(r.city);}}
function nextDay(d){const date=new Date(d+'T12:00:00');date.setDate(date.getDate()+1);return date.toISOString().slice(0,10);}
let page=1,filtered=[],filteredRows=[],exportFields=[...fields],focusReturn=null,detailRecord=null,toastTimer;
function persist(){sessionStorage.setItem(storageKey,JSON.stringify(records));}
function badge(s){return `<span class="status ${s==='通过'?'pass':s==='审批中'?'pending':['不通过','已驳回'].includes(s)?'reject':''}">${esc(s)}</span>`;}
function hasPendingPunch(r){return r.punchStatus==='审批中'||r.groups?.some(g=>g.punchStatus==='审批中');}
function policy(r,row=r){if(r.sealed)return {变更:'考勤已封存，不可操作',撤销:'考勤已封存，不可操作',补卡:'考勤已封存，不可操作'};if(r.status!=='通过'||r.type==='撤销')return {变更:'当前状态不可操作',撤销:'当前状态不可操作',补卡:'当前状态不可操作'};return {变更:hasPendingPunch(r)?'已有补卡申请正在审批':'',撤销:hasPendingPunch(r)?'已有补卡申请正在审批':'',补卡:row.punchStatus==='审批中'?'该加班段已有补卡申请正在审批':r.region==='海外'?'海外补卡提交能力待确认':''};}
function actions(r,row=r,index=0){const p=policy(r,row);return `<div class="row-actions">${['变更','补卡'].map(a=>`<span title="${esc(p[a])}"><button class="btn-text" data-action="${a}" data-id="${esc(r.id)}" data-segment-index="${index}" ${p[a]?'disabled':''}>${a}</button></span>`).join('')}<button class="btn-text" data-more data-id="${esc(r.id)}" aria-haspopup="menu" aria-expanded="false">更多</button></div>`;}
function vestingDates(r){return r.groups?.length?r.groups.map(g=>g.vesting||'—'):[r.vestingDate];}
function historyButton(r,punch=false,segmentIndex=0){return `<button class="eye" data-history="${punch?'punch':'application'}" data-id="${r.id}" ${punch?`data-segment-index="${segmentIndex}"`:''} title="${punch?'查看补卡历史':'查看历史记录'}" aria-label="${punch?'查看补卡历史':'查看历史记录'}">${eye}</button>`;}
function punchEntries(r,segmentIndex=0){
 if(!r.groups?.length)return (r.punchHistory||[]).map((record,index)=>({record,index}));
 const detailId=r.groups[segmentIndex]?.detailId;
 return (r.punchHistory||[]).map((record,index)=>({record,index})).filter(({record})=>record.segmentDetailId===detailId||(!record.segmentDetailId&&record.groups?.some(g=>g.detailId===detailId)));
}
function groupHours(g){if(g?.hours!==undefined&&Number.isFinite(Number(g.hours)))return Number(g.hours).toFixed(2);if(!g?.date||!g?.start||!g?.end)return '—';const [sh,sm]=g.start.split(':').map(Number),[eh,em]=g.end.split(':').map(Number),minutes=eh*60+em+(g.endDay==='next'?1440:0)-(sh*60+sm);return minutes>0?(minutes/60).toFixed(2):'—';}
function recordRows(r){
 if(!r.groups?.length)return [{record:r,row:r,index:0,count:1}];
 return r.groups.map((g,index)=>({record:r,index,count:r.groups.length,row:{...r,start:`${g.date} ${g.start}`,end:`${g.endDay==='next'?nextDay(g.date):g.date} ${g.end}`,requestHours:groupHours(g),hours:groupHours(g),actualStart:g.actualStart||'—',actualEnd:g.actualEnd||'—',actualHours:g.actualHours??'—',vestingDate:g.vesting||'—',punchStatus:g.punchStatus||'—',kind:g.kind||r.kind,comp:g.comp||r.comp,dutyMode:g.dutyMode||r.dutyMode,city:g.city||r.city,dutyComp:g.dutyComp||r.dutyComp}}));
}
function mobileRecord(r,row,index,count){return `<tr data-row="${count>1?r.id+'-'+(index+1):r.id}" data-record-id="${r.id}" data-segment-index="${index}"><td colspan="18"><article class="mobile-record"><header><button class="btn-text mobile-record-title" data-detail="${r.id}">${esc(row.kind)}${count>1?` · 加班 ${index+1}`:''}</button><span>${badge(r.status)}${r.history?.length>1?historyButton(r):''}</span></header><button class="mobile-record-body" data-detail="${r.id}" aria-label="查看${esc(row.start)}的加班详情"><span><i>开始时间</i><b>${esc(row.start)}</b></span><span><i>结束时间</i><b>${esc(row.end)}</b></span><span><i>加班时长（小时）</i><b>${esc(row.requestHours)}</b></span></button><div class="mobile-record-meta"><span>${esc(row.comp)}${row.dutyMode!=='—'?' · '+esc(row.dutyMode):''}</span><span>归属日期 ${esc(row.vestingDate)}</span></div>${row.punchStatus!=='—'?`<div class="mobile-punch">补卡状态 ${badge(row.punchStatus)}${punchEntries(r,index).length?historyButton(r,true,index):''}</div>`:''}<footer>${actions(r,row,index)}</footer></article></td></tr>`;}
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
 filteredRows=records.flatMap(recordRows).filter(({record:r,row})=>
  (!isSelf||r.no===employees[selfEmployee].no)&&
  (r.name+r.no).includes($('#filterEmployee').value)&&
  r.dept.includes($('#filterOrg').value)&&
  inDateRange(row.start,$('#filterDateStart').value,$('#filterDateEnd').value)&&
  (!$('#filterStatus').value||r.status===$('#filterStatus').value)&&
  (!$('#filterKind').value||row.kind===$('#filterKind').value)&&
  (!$('#filterComp').value||row.comp===$('#filterComp').value)&&
  inDateRange(row.vestingDate,$('#filterVestingStart').value,$('#filterVestingEnd').value)&&
  (!$('#filterDuty').value||r.dutyFlag===$('#filterDuty').value)&&
  (!$('#filterDutyMode').value||row.dutyMode===$('#filterDutyMode').value)&&
  (!$('#filterCity').value||row.city===$('#filterCity').value)&&
  (!$('#filterDutyComp').value||row.dutyComp===$('#filterDutyComp').value)&&
  (!$('#filterPunch').value||(row.punchStatus==='—'?'未补卡':row.punchStatus)===$('#filterPunch').value)&&
  inNumberRange(row.requestHours,$('#filterRequestHoursMin').value,$('#filterRequestHoursMax').value)&&
  inNumberRange(row.actualHours,$('#filterActualHoursMin').value,$('#filterActualHoursMax').value)
 );
 filtered=[...new Map(filteredRows.map(item=>[item.record.id,item.record])).values()];
 page=Math.min(page,Math.max(1,Math.ceil(filteredRows.length/10)));
 const visibleRows=filteredRows.slice((page-1)*10,page*10);
 $('#rows').innerHTML=visibleRows.map(({record:r,row,index,count})=>`<tr data-row="${count>1?r.id+'-'+(index+1):r.id}" data-record-id="${r.id}" data-segment-index="${index}" class="${count>1?'application-segment-row':''}">${keys.map(k=>`<td class="${k==='dept'?'department':''}" title="${esc(row[k])}">${k==='name'?`<button class="btn-text" data-detail="${r.id}">${esc(r.name)}</button>`:k==='status'?`<span class="cell-with-icon">${badge(r.status)}${r.history?.length>1?historyButton(r):''}</span>`:k==='punchStatus'?`<span class="cell-with-icon">${row.punchStatus==='—'?'—':badge(row.punchStatus)+(punchEntries(r,index).length?historyButton(r,true,index):'')}</span>`:esc(row[k])}${k==='start'&&count>1?` <span class="tag" title="本申请第 ${index+1} 段，共 ${count} 段">${index+1}/${count}</span>`:''}</td>`).join('')}<td>${actions(r,row,index)}</td></tr>`).join('')||`<tr><td colspan="${keys.length+1}" class="empty">暂无符合条件的加班申请</td></tr>`;
 $('#recordTotal').textContent=isSelf?'我的加班':isTeam?'团队加班':'加班申请';
 if(isMobile)$('#rows').innerHTML=visibleRows.map(({record,row,index,count})=>mobileRecord(record,row,index,count)).join('')||'<tr><td class="empty">暂无符合条件的加班申请</td></tr>';
 $('#count').textContent=`共 ${filteredRows.length} 条加班明细，每页 10 条`;
 $('#pages').innerHTML=`<button class="page-btn" data-page="${page-1}" ${page===1?'disabled':''}>‹</button>${Array.from({length:Math.max(1,Math.ceil(filteredRows.length/10))},(_,i)=>`<button class="page-btn ${page===i+1?'active':''}" data-page="${i+1}">${i+1}</button>`).join('')}<button class="page-btn" data-page="${page+1}" ${page*10>=filteredRows.length?'disabled':''}>›</button>`;
}
function modal(title,body,footer=''){focusReturn=document.activeElement;$('#dialogTitle').textContent=title;$('#dialogBody').innerHTML=body;$('#dialogFooter').innerHTML=footer;$('#listOverlay').hidden=false;document.body.classList.add('locked');$('#dialogClose').focus();}
function closeModal(){ $('#listOverlay').hidden=true;document.body.classList.remove('locked');focusReturn?.focus();}
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',3000);}
function showHistory(r,punch,segmentIndex=0){
 const entries=punch?punchEntries(r,segmentIndex):r.history.slice(1).map((record,index)=>({record,index:index+1}));
 const headers=punch?['补卡时段','加班证明附件','申请理由','审批状态','提交时间','操作']:['单据类型','加班起止时间','申请时长（h）','归属日期','补偿方式','审批状态','提交时间','操作'];
 const periods=x=>x.groups?.length?x.groups.map(g=>`${g.date} ${g.start} ～ ${g.endDay==='next'?nextDay(g.date):g.date} ${g.end}`):[`${x.start} ～ ${x.end}`];
 const lines=values=>values.map(v=>`<div class="history-line">${esc(v)}</div>`).join('');
 const punchPeriods=x=>x.groups?.length?x.groups.map(g=>`${g.actualStart||'—'} ～ ${g.actualEnd||'—'}`):[`${x.start} ～ ${x.end}`];
 const punchFiles=x=>x.groups?.length?x.groups.map(g=>(g.files||[]).join('、')||'—'):[(x.files||[]).join('、')||'—'];
 modal(punch?'补卡历史':'申请历史',`<p class="muted history-employee">${esc(r.name)} · ${esc(r.no)}</p><div class="history-scroll"><table class="history-table ${punch?'punch-history':''}"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${entries.map(({record:x,index})=>`<tr>${punch?`<td>${lines(punchPeriods(x))}</td><td>${lines(punchFiles(x))}</td><td class="history-reason">${esc(x.reason||'—')}</td>`:`<td>${esc(x.type)}</td><td>${lines(periods(x))}</td><td>${esc(x.requestHours??x.hours??'—')}</td><td>${lines(vestingDates(x))}</td><td>${lines(x.groups?.length?x.groups.map(g=>g.comp||x.comp||'—'):[x.comp||'—'])}</td>`}<td>${badge(x.status)}</td><td>${esc(x.submitted)}</td><td><button class="btn-text" data-version="${index}" data-id="${esc(r.id)}" data-punch="${punch}">查看</button></td></tr>`).join('')||`<tr><td colspan="${headers.length}" class="empty">暂无历史记录</td></tr>`}</tbody></table></div>`);
}
function detail(r,version=null){const x=version||r;detailRecord=r;closeModal();$('#listPage').hidden=true;$('#detailPage').hidden=false;const detailKeys=version?.type==='补卡'?['name','no','dept']:keys.filter(k=>!['status','punchStatus'].includes(k));const label=k=>fields[keys.indexOf(k)];$('#detailPage').innerHTML=`<section class="detail-summary"><div><div class="detail-title">${esc(x.name)} · ${x.type==='申请'?'加班申请':x.type==='补卡'?'补卡':'加班'+x.type}${badge(x.status)}</div><div class="doc-meta">工号：${esc(x.no)}　提交时间：${x.submitted}${r.sealed?'　考勤已封存':''}</div></div><button class="btn btn-default" id="backList">返回列表</button></section><div class="detail-layout"><div><section class="detail-card"><h3 class="detail-section-title">${x.type==='补卡'?'补卡信息':'加班信息'}</h3><div class="detail-grid">${detailKeys.map(k=>`<div class="detail-item"><span class="detail-field-label">${label(k)}</span><span class="detail-field-value">${esc(x[k])}</span></div>`).join('')}<div class="detail-item full"><span class="detail-field-label">申请理由</span><span class="detail-field-value">${esc(x.reason||'—')}</span></div>${x.files?`<div class="detail-item full"><span class="detail-field-label">加班证明附件</span><span>${x.files.map(esc).join('、')}</span></div>`:''}</div></section>${x.groups?.length>1&&x.type!=='补卡'?`<section class="detail-card"><h3 class="detail-section-title">加班明细</h3><table style="min-width:0"><thead><tr><th>加班日期</th><th>开始时间</th><th>结束时间</th></tr></thead><tbody>${x.groups.map(g=>`<tr><td>${g.date}</td><td>${g.start}</td><td>${g.end}</td></tr>`).join('')}</tbody></table></section>`:''}</div><aside class="approval-card"><h3 class="approval-title">审批记录</h3><div class="timeline-item">提交申请<p>${esc(x.name)} · ${x.submitted}</p></div><div class="timeline-item">${x.status}<p>${x.status==='通过'?'示例审批人 · 审批通过':x.status==='审批中'?'等待示例审批人处理':'当前公共审批状态'}</p></div></aside></div>`;appendApplicationDetails(x,version);$('#backList').onclick=()=>{$('#detailPage').hidden=true;$('#listPage').hidden=false;};}
function appendApplicationDetails(x,version){
 const container=$('#detailPage .detail-layout>div');
 if(x.type==='变更'||x.type==='撤销'){const reason=x.type==='变更'?x.changeReason:x.cancelReason;if(reason){const card=document.createElement('section');card.className='detail-card';card.innerHTML=`<h3 class="detail-section-title">${x.type}信息</h3><div class="detail-item"><span class="detail-field-label">${x.type}原因</span><span class="detail-field-value">${esc(reason)}</span></div>`;container.append(card);}}
 if(x.groups?.length&&x.type!=='补卡'){
  const oldTable=container.querySelector('table');oldTable?.closest('.detail-card').remove();
  for(const [i,g] of x.groups.entries()){const card=document.createElement('section');card.className='detail-card';const pairs=[['加班日期',g.date],['归属日期',g.vesting||'—'],['开始时间','当日 '+g.start],['结束时间',(g.endDay==='next'?'次日 ':'当日 ')+g.end],['加班补偿方式',g.comp||x.comp],...(g.dutyMode?[['值班方式',g.dutyMode],['工作城市',g.city],['值班补偿方式',g.dutyComp]]:[])];card.innerHTML=`<h3 class="detail-section-title">加班 ${i+1}</h3><div class="detail-grid">${pairs.map(([k,v])=>`<div class="detail-item"><span class="detail-field-label">${k}</span><span class="detail-field-value">${esc(v||'—')}</span></div>`).join('')}<div class="detail-item full"><span class="detail-field-label">原申请理由</span><span class="detail-field-value">${esc(g.reason||'—')}</span></div></div>`;container.append(card);}
 }
 if(x.groups?.length&&x.type==='补卡'){
  for(const [i,g] of x.groups.entries()){const card=document.createElement('section');card.className='detail-card';card.innerHTML=`<h3 class="detail-section-title">加班 ${i+1} 补卡明细</h3><div class="detail-grid"><div class="detail-item"><span class="detail-field-label">申请加班时段</span><span class="detail-field-value">${esc(g.date+' '+g.start)} ～ ${esc((g.endDay==='next'?nextDay(g.date):g.date)+' '+g.end)}</span></div><div class="detail-item"><span class="detail-field-label">补卡开始时间</span><span class="detail-field-value">${esc(g.actualStart||'—')}</span></div><div class="detail-item"><span class="detail-field-label">补卡结束时间</span><span class="detail-field-value">${esc(g.actualEnd||'—')}</span></div><div class="detail-item full"><span class="detail-field-label">加班证明附件</span><span class="detail-field-value">${esc((g.files||[]).join('、')||'—')}</span></div></div>`;container.append(card);}
 }
 if(!version){const toolbar=document.createElement('div');toolbar.className='detail-summary-actions';toolbar.innerHTML=actions(x);$('#detailPage .detail-summary').append(toolbar);}
}
function operation(r,a,segmentIndex=0){
 if(a==='变更'||a==='撤销'){persist();location.href=(isMobile?'mobile/':'')+'application.html?'+new URLSearchParams({mode,action:a==='变更'?'change':'cancel',id:r.id,...(isSelf&&selfEmployee==='B'?{region:'overseas'}:{})});return;}
 if(a!=='补卡')return;
 const segments=r.groups?.length?r.groups:[{detailId:r.id,date:r.start.slice(0,10),start:r.start.slice(11,16),endDay:r.end.slice(0,10)>r.start.slice(0,10)?'next':'same',end:r.end.slice(11,16),vesting:r.vestingDate}],selected=segments[segmentIndex]||segments[0],detailId=selected.detailId||r.id,old=punchEntries(r,segmentIndex)[0]?.record;
 const previous=old?.groups?.[0],draft=[{...structuredClone(selected),actualStart:previous?.actualStart||selected.date+' '+selected.start,actualEnd:previous?.actualEnd||(selected.endDay==='next'?nextDay(selected.date):selected.date)+' '+selected.end,files:[...(previous?.files||old?.files||[])]}];
 const repeated=Boolean(old),segmentMarkup=(g,index)=>`<section class="punch-segment" data-punch-segment="${index}"><div class="punch-segment-head"><strong>加班 ${segmentIndex+1}</strong><span>申请时段：${esc(g.date+' '+g.start)} ～ ${esc((g.endDay==='next'?nextDay(g.date):g.date)+' '+g.end)}</span></div><div class="punch-segment-grid"><label><span><i class="required">*</i>补卡开始时间</span><input type="datetime-local" data-punch-start="${index}" value="${esc(String(g.actualStart||'').replace(' ','T'))}" required></label><label><span><i class="required">*</i>补卡结束时间</span><input type="datetime-local" data-punch-end="${index}" value="${esc(String(g.actualEnd||'').replace(' ','T'))}" required></label><label class="full"><span><i class="required">*</i>加班证明附件</span><input type="file" multiple data-punch-files="${index}"><div data-file-list="${index}"></div><span class="error" data-punch-error="${index}" role="alert"></span></label></div></section>`;
 modal(repeated?'再次补卡':'补卡',`<p class="history-employee">${esc(r.name)} · ${esc(r.no)} · ${esc(r.dept)}</p><form id="opForm"><div class="punch-segment-list">${draft.map(segmentMarkup).join('')}</div><label class="punch-reason"><span><i class="required">*</i>申请理由</span><textarea id="opReason" required>${esc(repeated?old.reason||'':'')}</textarea></label><p class="error" id="opError" role="alert"></p></form>`,`<button class="btn btn-default" id="opCancel">取消</button><button class="btn btn-primary" id="opSubmit">提交</button>`);
 $('#opCancel').onclick=closeModal;
 function renderFiles(index){const list=$(`[data-file-list="${index}"]`);list.innerHTML=draft[index].files.map((file,fileIndex)=>`<div class="file-item">${esc(file)}<button type="button" class="btn-text" data-remove-punch-file="${index}-${fileIndex}">删除</button></div>`).join('');}
 draft.forEach((g,index)=>{renderFiles(index);$(`[data-punch-files="${index}"]`).onchange=event=>{g.files.push(...Array.from(event.target.files).map(file=>file.name));renderFiles(index);};});
 $('#opForm').onclick=event=>{const button=event.target.closest('[data-remove-punch-file]');if(!button)return;const [segmentIndex,fileIndex]=button.dataset.removePunchFile.split('-').map(Number);draft[segmentIndex].files.splice(fileIndex,1);renderFiles(segmentIndex);};
 $('#opSubmit').onclick=()=>{
  $('#opError').textContent='';document.querySelectorAll('[data-punch-error]').forEach(node=>node.textContent='');if(!$('#opForm').reportValidity())return;let invalid=false;
  draft.forEach((g,index)=>{const start=$(`[data-punch-start="${index}"]`).value,end=$(`[data-punch-end="${index}"]`).value,error=$(`[data-punch-error="${index}"]`);if(end<=start){error.textContent='补卡结束时间须晚于补卡开始时间';invalid=true;}else if(!g.files.length){error.textContent='请上传该段加班证明附件';invalid=true;}g.actualStart=start.replace('T',' ');g.actualEnd=end.replace('T',' ');});
  if(invalid){$('#opForm .error:not(:empty)')?.closest('label')?.querySelector('input')?.focus();return;}
  const submitted=new Date().toLocaleString('sv-SE').slice(0,16),x={...snapshot(r),type:'补卡',status:'审批中',submitted,reason:$('#opReason').value,segmentDetailId:detailId,groups:structuredClone(draft),start:draft[0].actualStart,end:draft[0].actualEnd,files:draft[0].files};
  r.punchHistory.unshift(x);if(r.groups?.length)r.groups[segmentIndex].punchStatus='审批中';r.punchStatus='审批中';persist();render();closeModal();toast('已提交');
 };
}
$('#columns').innerHTML='<tr>'+[...fields,'操作'].map((f,i)=>`<th style="width:${widths[i]}px">${f}</th>`).join('')+'</tr>';
$('#listTable table').style.width=$('#listTable table').style.minWidth=widths.reduce((sum,width)=>sum+width,0)+'px';
for(const s of states){$('#filterStatus').add(new Option(s,s));$('#filterPunch').add(new Option(s,s));}
document.querySelectorAll('.date-range-trigger').forEach(trigger=>{syncRangeTrigger(trigger);trigger.onclick=event=>{event.stopPropagation();openRangePicker(trigger);};});
$('#query').onclick=()=>{closeRangePicker();page=1;render();};$('#reset').onclick=()=>{document.querySelectorAll('.search-bar [id^="filter"]').forEach(e=>e.value='');document.querySelectorAll('.date-range-trigger').forEach(syncRangeTrigger);closeRangePicker();page=1;render();};$('#dialogClose').onclick=closeModal;
$('#toggleAdvanced').onclick=()=>{const panel=$('#advancedSearch'),open=panel.hidden;panel.hidden=!open;$('#toggleAdvanced').innerHTML=open?'<span aria-hidden="true">↕</span>隐藏高级筛选':'<span aria-hidden="true">↕</span>展开高级筛选';$('#toggleAdvanced').setAttribute('aria-expanded',String(open));};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const r=records.find(r=>r.id===b.dataset.id),segmentIndex=Number(b.dataset.segmentIndex||0),row=r?recordRows(r)[segmentIndex]?.row:null;if(b.dataset.page){page=Number(b.dataset.page);render();}if(b.dataset.history)showHistory(r,b.dataset.history==='punch',segmentIndex);if(b.dataset.detail)detail(records.find(r=>r.id===b.dataset.detail));if(b.dataset.version!==undefined)detail(r,(b.dataset.punch==='true'?r.punchHistory:r.history)[Number(b.dataset.version)]);if(b.dataset.action&&policy(r,row||r)?.[b.dataset.action]==='')operation(r,b.dataset.action,segmentIndex);});
document.addEventListener('click',e=>{if(activeRangePicker&&!activeRangePicker.trigger.closest('.range-query').contains(e.target))closeRangePicker();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeRangePicker){closeRangePicker();return;}if($('#listOverlay').hidden)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const nodes=[...$('#listOverlay').querySelectorAll('button,input,textarea,select')].filter(x=>!x.disabled&&x.offsetParent!==null);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('#exportSettings').onclick=()=>{modal('导出设置',`<div class="export-grid">${exportableFields.map(f=>`<label><input type="checkbox" value="${f}" ${exportFields.includes(f)?'checked':''}> ${f}</label>`).join('')}</div>`,`<button class="btn btn-default" id="settingsCancel">取消</button><button class="btn btn-primary" id="settingsSave">保存</button>`);$('#settingsCancel').onclick=closeModal;$('#settingsSave').onclick=()=>{const selected=[...$('#dialogBody').querySelectorAll('input:checked')].map(x=>x.value);if(!selected.length){toast('请至少选择一个字段');return;}exportFields=selected;closeModal();};};
$('#export').onclick=()=>{const csv=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const data=[exportFields,...filteredRows.map(({row})=>exportFields.map(f=>row[exportableKeys[exportableFields.indexOf(f)]]))].map(row=>row.map(csv).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+data],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='加班申请.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
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
