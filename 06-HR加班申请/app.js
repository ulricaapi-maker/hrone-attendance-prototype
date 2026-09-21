"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const employees={A:{name:'示例员工A',no:'E10086',org:'中国区 / 产品研发部',position:'产品经理',grade:'P6',workAreaCode:'01',city:'中国 / 广东省 / 深圳市'},B:{name:'示例员工B',no:'E10092',org:'海外区 / 客户成功部',position:'客户成功经理',grade:'P5',workAreaCode:'02',city:'非中国 / 新加坡'}};
// Style-review fixtures only. These dates represent configured calendar entries.
const calendar={dutyDates:['2026-10-01','2026-10-02','2026-05-01'],holidayDates:['2026-10-01','2026-10-02','2026-05-01']};
const entryMode=new URLSearchParams(location.search).get('mode')||'hr';
const isSelf=entryMode==='self',isTeam=entryMode==='team';
const selfEmployee=new URLSearchParams(location.search).get('region')==='overseas'?'B':'A';
const mobileApplication=location.pathname.includes('/mobile/');
const listRoute=(mobileApplication?'../':'')+'index.html'+(isSelf?'?mode=self'+(selfEmployee==='B'?'&region=overseas':'')+(mobileApplication?'&surface=mobile':''):isTeam?'?mode=team':'');
const isApplication=location.pathname.endsWith('/application.html');
const overseas=()=>employees[activeEmployee]?.workAreaCode==='02';
let seq=0, groups=[],comp='',activeEmployee='',submitted=false,focusReturn=null;
const blank=()=>({id:++seq,collapsed:false,date:'',start:'',endDay:'same',end:'',vesting:'',reason:'',dutyMode:'',city:employees[activeEmployee]?.city||'',dutyComp:'',comp:''});
const sample=()=>({...blank(),date:'2026-09-11',start:'18:30',end:'22:00',vesting:'2026-09-11',reason:'项目上线支持与问题处理。'});
const minutes=t=>t?t.split(':').reduce((h,m)=>Number(h)*60+Number(m)):0;
const endMinutes=g=>minutes(g.end)+(g.endDay==='next'?1440:0);
const spanMinutes=g=>g.start&&g.end?endMinutes(g)-minutes(g.start):null;
const dateShift=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
const duty=g=>!overseas()&&calendar.dutyDates.includes(g.date);
const type=g=>{if(!g.date)return '—';if(overseas()&&Object.hasOwn(overseasScheduleSamples,g.date))return overseasScheduleSamples[g.date]?.attr?overseasScheduleSamples[g.date].attr+'加班':'—';return calendar.holidayDates.includes(g.date)?'节假日加班':[0,6].includes(new Date(g.date+'T12:00:00').getDay())?'公休日加班':'工作日加班';};
const hrs=n=>Number(n.toFixed(2))+'小时';
// Local demonstration plan, not production configuration. No rounding or cap is applied.
const demoPlan={'工作日加班':30,'公休日加班':0,'节假日加班':0};
function periodResult(g,options={}){
 if(!g.date||!g.start||!g.end)return null;
 const start=minutes(g.start),end=endMinutes(g);
 const effectiveStart=Math.max(start,type(g)==='工作日加班'?1080:0);
 const afterShift=options.afterShiftMinutes??(overseas()?0:demoPlan[type(g)]||0);
 const intervals=[...(options.restPeriods||[[720,780]]).map(([from,to])=>({from,to,label:'班次休息'})),{from:1080,to:1080+afterShift,label:'班后不计加班时段'}].map(x=>({...x,from:Math.max(x.from,effectiveStart),to:Math.min(x.to,end)})).filter(x=>x.to>x.from).sort((a,b)=>a.from-b.from);
 const afterShiftMinutes=intervals.filter(x=>x.label==='班后不计加班时段').reduce((n,x)=>n+x.to-x.from,0);
 const restMinutes=intervals.filter(x=>x.label==='班次休息').reduce((n,x)=>n+x.to-x.from,0);
 const merged=[];for(const x of intervals){const last=merged.at(-1);if(last&&x.from<=last.to){last.to=Math.max(last.to,x.to);if(!last.labels.includes(x.label))last.labels.push(x.label);}else merged.push({...x,labels:[x.label]});}
 const deductedMinutes=merged.reduce((n,x)=>n+x.to-x.from,0);
 const deductions=merged.map(x=>({label:x.labels.join('、'),time:`当日 ${clockText(x.from)}～当日 ${clockText(x.to)}`,minutes:x.to-x.from}));
 return {hours:Math.max(0,end-effectiveStart-deductedMinutes)/60,restMinutes,afterShiftMinutes,deductedMinutes,deductions};
}
function duration(g){return periodResult(g)?.hours??null;}
const clockText=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
function canViewPeriod(g){return Boolean(g)&&duration(g)>0&&!timeError(g);}
function timeError(g){if(!g.start||!g.end)return '';const a=minutes(g.start),b=endMinutes(g);if(b<=a)return '结束时间须晚于开始时间';if(type(g)==='工作日加班'&&a<1080&&b>540)return '申请时间不能在工作时间范围内！';return '';}
function submitTimeError(g){return spanMinutes(g)>1440?'加班时长不能超过24小时':'';}
let records=[{employee:'A',groups:[sample()],comp:'调休假',status:'审批中'},{employee:'B',groups:[{...sample(),date:'2026-09-10',vesting:'2026-09-10',start:'19:00',end:'21:00'}],comp:'加班费',status:'已通过'}];
try{const saved=JSON.parse(sessionStorage.getItem('hr-overtime-demo-records'));if(Array.isArray(saved))records=saved.map(r=>({...r,groups:r.groups.map(g=>({...g,endDay:g.endDay||(g.end==='00:00'?'next':'same')}))}));}catch{}
let filtered=records, exportFields=['员工','工号','组织全称','加班日期','加班时长','加班补偿方式','审批状态'];
const fullExportFields=[...exportFields];
function total(gs){return gs.reduce((n,g)=>n+(duration(g)||0),0);}
function renderRows(){filtered=records.filter(r=>{const e=employees[r.employee];return (!$('#filterEmployee').value||(e.name+e.no).includes($('#filterEmployee').value))&&(!$('#filterOrg').value||e.org.includes($('#filterOrg').value))&&(!$('#filterStatus').value||r.status===$('#filterStatus').value)&&(!$('#filterDate').value||r.groups.some(g=>g.date===$('#filterDate').value));});$('#rows').innerHTML=filtered.length?filtered.map((r,i)=>{const e=employees[r.employee];return `<tr><td>${e.name}</td><td>${e.no}</td><td>${e.org}</td><td>${r.groups[0].date}${r.groups.length>1?` <span class="tag">${r.groups.length}组</span>`:''}</td><td>${hrs(total(r.groups))}</td><td>${r.comp}</td><td><span class="badge ${r.status==='审批中'?'pending':''}">${r.status}</span></td><td><button class="btn-text" data-record="${i}">计算明细</button></td></tr>`;}).join(''):'<tr><td colspan="8" class="empty">暂无符合条件的加班申请</td></tr>';$('#count').textContent=`共 ${filtered.length} 条记录，第 1/1 页`;$('#recordTotal').textContent=`加班申请 · ${filtered.length} 条`;}
function showForm(filled=false){submitted=false;activeEmployee=isSelf?selfEmployee:filled?(new URLSearchParams(location.search).get('region')==='overseas'?'B':'A'):'';groups=[filled?sample():blank()];if(overseas()){groups[0].comp=filled?'调休假':'';}syncVesting(groups[0]);comp=filled?'调休假':'';$('#employee').value=activeEmployee;$('#formOverlay').hidden=false;if(!isApplication)document.body.classList.add('locked');renderEmployee();renderGroups();if(!isSelf)$('#employee').focus();}
function renderEmployee(){const e=employees[activeEmployee];$('#employee').disabled=isSelf;document.body.classList.toggle('self-application',isSelf);const avatar=$('#employeeAvatar');if(avatar)avatar.textContent=e?e.name.slice(-1):'员';const selfName=$('#selfEmployeeName');if(selfName)selfName.textContent=e?`${e.name}（${e.no}）`:'—';$('#employeeMeta').innerHTML=['工号','组织全称','职位','职级'].map((n,i)=>`<div><span>${n}</span><b title="${e?esc(e[['no','org','position','grade'][i]]):'—'}">${e?esc(e[['no','org','position','grade'][i]]):'—'}</b></div>`).join('');$('#editable').disabled=!e;$('#employeeError').textContent=submitted&&!e?'必填项不能为空':'';$('#employee').setAttribute('aria-invalid',String(submitted&&!e));}
function field(g,key,label,control){return `<label class="form-item ${key}-field"><span class="form-label"><i class="required">*</i>${label}</span>${control}<span class="error" data-error="${g.id}-${key}"></span></label>`;}
// Cascader options are demonstration location data, not the complete location dictionary.
const cityOptions={'中国':{'北京市':['北京市'],'天津市':['天津市'],'河北省':['石家庄市'],'山西省':['太原市'],'内蒙古':['呼和浩特市'],'上海市':['上海市'],'广东省':['广州市','深圳市'],'浙江省':['杭州市','宁波市'],'四川省':['成都市']},'非中国':{'新加坡':null,'马来西亚':['吉隆坡'],'印度':['孟买']}};
function cityField(g){return `<div class="form-item city-field"><span class="form-label" id="city-label-${g.id}"><i class="required">*</i>工作城市</span><div class="city-cascader"><button type="button" class="form-select city-trigger" data-city-trigger="${g.id}" aria-labelledby="city-label-${g.id}" aria-expanded="false">${esc(g.city||'请选择工作城市')}</button><input type="hidden" data-key="city" value="${esc(g.city)}"><div class="city-panel" hidden></div></div><span class="error" data-error="${g.id}-city"></span></div>`;}
function openCity(g,trigger){
 const panel=trigger.parentElement.querySelector('.city-panel');if(!panel.hidden){panel.hidden=true;trigger.setAttribute('aria-expanded','false');return;}
 document.querySelectorAll('.city-panel').forEach(p=>p.hidden=true);let [country,province]=g.city.split(' / ');
 const choose=value=>{g.city=value;trigger.textContent=value;trigger.parentElement.querySelector('input').value=value;panel.hidden=true;trigger.setAttribute('aria-expanded','false');refresh();trigger.focus();};
 function render(){panel.innerHTML=`<div>${Object.keys(cityOptions).map(c=>`<button type="button" data-city-country="${c}" class="${c===country?'active':''}">${c}<span>›</span></button>`).join('')}</div>${country?`<div>${Object.entries(cityOptions[country]).map(([p,cities])=>`<button type="button" data-city-province="${p}" class="${p===province?'active':''}">${p}${cities?'<span>›</span>':''}</button>`).join('')}</div>`:''}${country&&cityOptions[country]?.[province]?`<div>${cityOptions[country][province].map(c=>`<button type="button" data-city-leaf="${c}">${c}</button>`).join('')}</div>`:''}`;
 panel.querySelectorAll('[data-city-country]').forEach(b=>b.onclick=()=>{country=b.dataset.cityCountry;province='';render();});panel.querySelectorAll('[data-city-province]').forEach(b=>b.onclick=()=>{province=b.dataset.cityProvince;if(cityOptions[country][province])render();else choose(country+' / '+province);});panel.querySelectorAll('[data-city-leaf]').forEach(b=>b.onclick=()=>choose([country,province,b.dataset.cityLeaf].join(' / ')));}
 render();panel.hidden=false;trigger.setAttribute('aria-expanded','true');
}

// Prototype clock windows only; domestic and overseas reuse the same decision order.
function suggestVesting(g){
 if(!g.date||!g.start||!g.end)return '';
 const origin=Date.parse(g.date+'T00:00:00Z'),a=origin+minutes(g.start)*60000,b=origin+endMinutes(g)*60000;
 const days=[-1,0,1].map(n=>{const d=dateShift(g.date,n),shift=overseas()?overseasScheduleSamples[d]:referenceSchedule(d),range=overseas()?overseasVestingWindows[d]:(domesticVestingWindows[d]||[420,1380]);return shift&&range?{date:d,working:shift.attr?shift.attr==='工作日':type({date:d})==='工作日加班',from:origin+(n*1440+range[0])*60000,to:origin+(n*1440+range[1])*60000}:null;});
 return OvertimeVestingDate.resolve(a,b,days)||'';
}
function syncVesting(g){const basis=[g.date,g.start,g.endDay,g.end].join('|');if(g.vestingBasis===basis)return;g.vesting=suggestVesting(g);g.vestingBasis=basis;}

function renderGroups(){
 closePopover(false);
 const shared=$('#sharedCompResult');$('#sharedPlacement').append(shared);
 $('#groups').innerHTML=groups.map((g,i)=>`<article class="group ${groups.length===1?'single-group':'multi-group'}" data-group="${g.id}">${groups.length>1?`<div class="group-head"><button type="button" class="group-toggle" data-toggle="${g.id}" aria-expanded="${!g.collapsed}" aria-controls="group-body-${g.id}"><span class="group-chevron">${g.collapsed?'›':'⌄'}</span><b>加班 ${i+1}</b><span class="group-brief" data-brief="${g.id}">${groupBrief(g)}</span><span class="toggle-label">${g.collapsed?'展开':'收起'}</span></button><button type="button" class="btn-text" data-remove="${g.id}" aria-label="删除加班 ${i+1}">删除</button></div>`:''}<div class="form-grid" id="group-body-${g.id}" ${groups.length>1&&g.collapsed?'hidden':''}>
 <div class="form-item date-field"><span class="form-label"><label for="date-${g.id}"><i class="required">*</i>加班日期</label><button type="button" class="btn-text" data-reference="${g.id}">班次和打卡记录</button></span><input class="form-input" id="date-${g.id}" type="date" data-key="date" value="${g.date}"><span class="error" data-error="${g.id}-date"></span></div>
 ${field(g,'start','开始时间',`<div class="time-field"><span class="time-day">当日</span><input class="form-input" type="time" data-key="start" value="${g.start}" aria-label="开始时间"></div>`)}
 ${field(g,'end','结束时间',`<div class="time-field"><select class="time-day-select" data-key="endDay" aria-label="结束时段"><option value="same" ${g.endDay!=='next'?'selected':''}>当日</option><option value="next" ${g.endDay==='next'?'selected':''}>次日</option></select><input class="form-input" type="time" data-key="end" value="${g.end}" aria-label="结束时间"></div>`)}
 <div class="form-item kind-field"><span class="form-label" id="kind-label-${g.id}">加班类型</span><div class="readonly type-value" aria-labelledby="kind-label-${g.id}" data-kind="${g.id}">${type(g)}</div></div>
 ${duty(g)?field(g,'dutyMode','值班方式',`<select class="form-select" data-key="dutyMode"><option value="">请选择</option>${['现场值班','远程值班'].map(v=>`<option ${g.dutyMode===v?'selected':''}>${v}</option>`).join('')}</select>`)+field(g,'dutyComp','值班补偿方式',`<select class="form-select" data-key="dutyComp"><option value="">请选择</option>${['津贴','调休假'].map(v=>`<option ${g.dutyComp===v?'selected':''}>${v}</option>`).join('')}</select>`)+cityField(g):''}
 ${overseas()?field(g,'comp','加班补偿方式',`<select class="form-select" data-key="comp"><option value="">请选择</option>${['加班费','调休假'].map(v=>`<option ${g.comp===v?'selected':''}>${v}</option>`).join('')}</select>`):''}
 ${groups.length>1?`<div class="form-item group-duration-field"><span class="form-label"><span id="duration-label-${g.id}">加班时长</span><button type="button" class="btn-text" data-calculation="${g.id}">查看明细</button></span><div class="duration-control"><output class="readonly duration-value" aria-labelledby="duration-label-${g.id}" data-duration="${g.id}">${duration(g)===null?'—':hrs(duration(g))}</output></div></div>`:''}
 ${groups.length===1?`<div class="single-comp-slot ${overseas()?'':'full'}"></div>`:''}
 <label class="form-item group-reason ${groups.length===1?'full':''}"><span class="form-label"><i class="required">*</i>申请理由</span><div class="reason-box"><textarea data-key="reason" maxlength="200" placeholder="请输入申请理由">${esc(g.reason)}</textarea><span class="counter"><span data-counter="${g.id}">${g.reason.length}</span>/200</span></div><span class="error" data-error="${g.id}-reason"></span></label>
 </div></article>`).join('');
 shared.querySelector('.form-item').hidden=overseas();shared.classList.toggle('overseas-result',overseas());const slot=$('.single-comp-slot');if(slot){slot.classList.add('full');slot.append(shared);const overseasComp=$('.single-group [data-key="comp"]')?.closest('.form-item');if(overseasComp)slot.append(overseasComp);}
 shared.prepend(shared.querySelector('.duration-summary'));
 document.querySelectorAll('.group .form-grid').forEach(grid=>{const date=grid.querySelector('.date-field'),kind=grid.querySelector('.kind-field');date.after(kind);const end=grid.querySelector('.end-field'),slot=grid.querySelector('.single-comp-slot'),duration=grid.querySelector('.group-duration-field'),groupComp=grid.querySelector('.comp-field');if(slot)end.after(slot);else if(duration){const result=document.createElement('div');result.className='group-result-row';end.after(result);result.append(duration);if(groupComp)result.append(groupComp);}const dutyMode=grid.querySelector('.dutyMode-field'),city=grid.querySelector('.city-field');if(dutyMode&&city)dutyMode.after(city);});
 $('#groupCount').textContent=`${groups.length} / 7 组`;$('#totalDurationLabel').textContent=groups.length>1?'合计加班时长':'加班时长';$('#openCalculation').hidden=groups.length>1;$('#sharedCompResult').classList.toggle('multi-result',groups.length>1);$('#groupCount').hidden=groups.length===1;$('#addGroup').disabled=groups.length>=7;
 const allDuty=groups.length&&groups.every(duty);if(allDuty)comp='加班费';$('#compOptions').innerHTML=allDuty?'<div class="readonly">加班费</div>':['加班费','调休假'].map(v=>`<label><input type="radio" name="comp" value="${v}" ${comp===v?'checked':''}>${v}</label>`).join('');refresh();
}
function groupBrief(g){const d=duration(g);return `<span>${g.date||'日期待填写'}</span><span>${g.start||'—'} ～ ${g.endDay==='next'?'次日 ':''}${g.end||'—'}</span><span>${type(g)}${duty(g)?' · 值班':''}</span>${overseas()?`<span>${g.comp||'补偿待选择'}</span>`:''}<span class="brief-hours">${timeError(g)||d===null?'—':hrs(d)}</span>`;}
function refresh(){closePopover(false);let complete=groups.every(g=>duration(g)!==null&&!timeError(g));$('#total').textContent=complete?hrs(total(groups)):'—';for(const g of groups){const brief=$(`[data-brief="${g.id}"]`);if(brief)brief.innerHTML=groupBrief(g);const d=$(`[data-duration="${g.id}"]`);if(d)d.textContent=timeError(g)||duration(g)===null?'—':hrs(duration(g));const counter=$(`[data-counter="${g.id}"]`);if(counter)counter.textContent=g.reason.length;}
 $('#openCalculation').disabled=!canViewPeriod(groups[0]);for(const g of groups){const b=$(`[data-calculation="${g.id}"]`);if(b)b.disabled=!canViewPeriod(g);}
 validate(false);
}
function validate(strict){let ok=Boolean(activeEmployee&&(overseas()||comp));$('#compError').textContent=submitted&&!overseas()&&!comp?'必填项不能为空':'';const mixed=groups.some(duty)&&!groups.every(duty);if(mixed){$('#compError').textContent='普通加班与值班请分别提交申请';ok=false;}
 for(const g of groups){const required=['date','start','end','reason',...(overseas()?['comp']:[]),...(duty(g)?['dutyMode','city','dutyComp']:[])];for(const k of required){const node=$(`[data-error="${g.id}-${k}"]`),input=$(`[data-group="${g.id}"] [data-key="${k}"]`);let msg=(strict||submitted)&&!String(g[k]).trim()?'必填项不能为空':'';if(k==='end')msg=timeError(g)||((strict||submitted)?submitTimeError(g):'')||msg;if(!g[k]||msg)ok=false;if(node)node.textContent=msg;if(input)input.setAttribute('aria-invalid',String(Boolean(msg)));}
  if(duration(g)!==null&&duration(g)<=0){ok=false;if(strict&&!$(`[data-error="${g.id}-end"]`).textContent)$(`[data-error="${g.id}-end"]`).textContent='每组加班时长须大于0';}
 }
 for(let i=0;i<groups.length;i++)for(let j=0;j<i;j++){const a=groups[i],b=groups[j];if(a.date&&a.date===b.date&&a.start&&a.end&&b.start&&b.end&&minutes(a.start)<=endMinutes(b)&&minutes(b.start)<=endMinutes(a)){ok=false;if(strict)$(`[data-error="${a.id}-start"]`).textContent='同一申请内的加班时段不能重叠或首尾相接';}}
 return ok;
}
function drawer(title,body){focusReturn=document.activeElement;$('#drawerTitle').textContent=title;$('#drawerBody').innerHTML=body;$('#drawerMask').hidden=false;document.body.classList.add('locked');$('#drawerMask .close').focus();}
function calculation(gs=groups,c=comp,focusId=null){const selected=gs.find(g=>g.id===focusId);const selectedIndex=selected?gs.indexOf(selected)+1:0;const complete=gs.every(g=>duration(g)!==null&&!timeError(g));const byDay={};gs.forEach(g=>{const key=g.date+'|'+(g.comp||c);if(g.date)byDay[key]=(byDay[key]||0)+(duration(g)||0);});drawer(selected?`加班 ${selectedIndex} · 计算明细`:'加班计算明细',`<div class="trial-card"><div>${selected?'本组加班时长':'本次加班时长'}<strong>${selected?(duration(selected)===null||timeError(selected)?'—':hrs(duration(selected))):(complete?hrs(total(gs)):'—')}</strong><small>申请试算</small></div></div>${selected?'<p class="rule-summary">本组时长为取整前时长。每日取整与上限按合并结果计算，不将零头分摊回单组；下方保留整单各组和每日汇总供核对。</p>':''}<h3>逐组加班明细</h3><div class="table-wrap"><table><thead><tr><th>加班日期 / 类型</th><th>加班时间</th><th>取整前时长</th></tr></thead><tbody>${gs.map(g=>`<tr class="${g.id===focusId?'selected-calculation':''}"><td>${g.date||'—'}<br><span class="muted">${type(g)}</span></td><td>${g.start||'—'} ～ ${g.endDay==='next'?'次日 ':''}${g.end||'—'}</td><td>${duration(g)===null||timeError(g)?'—':hrs(duration(g))}</td></tr>`).join('')}</tbody></table></div><h3>每日汇总明细</h3><div class="table-wrap"><table><thead><tr><th>日期</th><th>补偿方式</th><th>取整前</th><th>取整后</th><th>上限处理后</th></tr></thead><tbody>${Object.entries(byDay).map(([d,h])=>`<tr><td>${d.split('|')[0]}</td><td>${d.split('|')[1]||'—'}</td><td>${complete?hrs(h):'—'}</td><td>${complete?hrs(h):'—'}</td><td>${complete?hrs(h):'—'}</td></tr>`).join('')}</tbody></table></div><h3>计算说明</h3><div class="rule-summary">${complete?'本次示例未扣减休息时长，未发生取整扣减及上限截断。':'请先完整填写有效的加班日期及起止时间。'}<br>申请页展示试算时长，审批后按加班方案核算最终认可时长。</div>`);}
// One non-modal, click-open popover follows the selected field.
let popoverAnchor=null,popoverKey='';
const fieldPopover=document.createElement('section');
fieldPopover.id='fieldPopover';fieldPopover.className='field-popover';fieldPopover.hidden=true;
fieldPopover.setAttribute('role','dialog');fieldPopover.setAttribute('aria-modal','false');fieldPopover.setAttribute('aria-labelledby','popoverTitle');
document.body.append(fieldPopover);
function closePopover(restoreFocus=true){
 if(!popoverAnchor)return;
 const anchor=popoverAnchor;anchor.setAttribute('aria-expanded','false');
 fieldPopover.hidden=true;popoverAnchor=null;popoverKey='';
 if(restoreFocus&&anchor.isConnected)anchor.focus({preventScroll:true});
}
function positionPopover(){
 if(!popoverAnchor)return;
 if(!popoverAnchor.isConnected){closePopover(false);return;}
 const r=popoverAnchor.getBoundingClientRect(),pad=12,gap=12;
 if(r.bottom<0||r.top>innerHeight){closePopover(false);return;}
 fieldPopover.style.maxHeight=`${Math.max(100,innerHeight-pad*2)}px`;
 const box=fieldPopover.getBoundingClientRect();
 const above=r.top-gap-pad,below=innerHeight-r.bottom-gap-pad;
 const onTop=above>=box.height||(below<box.height&&above>below);
 const available=Math.max(100,onTop?above:below);
 fieldPopover.style.maxHeight=`${Math.min(innerHeight-pad*2,available)}px`;
 const height=fieldPopover.getBoundingClientRect().height;
 const left=Math.max(pad,Math.min(r.right-box.width+24,innerWidth-box.width-pad));
 const top=Math.max(pad,Math.min(onTop?r.top-gap-height:r.bottom+gap,innerHeight-height-pad));
 fieldPopover.style.left=`${left}px`;fieldPopover.style.top=`${top}px`;
 fieldPopover.dataset.placement=onTop?'above':'below';
 fieldPopover.style.setProperty('--arrow-left',`${Math.max(20,Math.min(box.width-20,r.left+r.width/2-left))}px`);
}
function openPopover(anchor,key,title,body,kind='calculation',replace=false){
 if(!replace&&popoverAnchor===anchor&&popoverKey===key){closePopover();return;}
 closePopover(false);popoverAnchor=anchor;popoverKey=key;
 anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-haspopup','dialog');anchor.setAttribute('aria-controls','fieldPopover');
 fieldPopover.className=`field-popover ${kind}-popover`;
 fieldPopover.innerHTML=`<header class="popover-heading"><h3 id="popoverTitle">${title}</h3><button type="button" class="close" data-close-popover aria-label="关闭${title}">×</button></header><div class="popover-content">${body}</div>`;
 fieldPopover.hidden=false;positionPopover();
 fieldPopover.querySelector('[data-close-popover]').onclick=()=>closePopover();
 if(!replace)fieldPopover.querySelector('[data-close-popover]').focus({preventScroll:true});
}
function periodCalculation(g,anchor){
 if(!canViewPeriod(g))return;
 const result=periodResult(g);
 const start=minutes(g.start),end=endMinutes(g);
 const detail={date:g.date,vestingDate:g.vesting||'—',type:type(g),time:`当日 ${g.start} ～ ${g.endDay==='next'?'次日':'当日'} ${g.end}`,grossMinutes:end-start,fillingMinutes:Math.round(result.hours*60),resultMinutes:Math.round(result.hours*60),deductions:result.deductions};
 openPopover(anchor,`period-${g.id}`,'加班计算明细',OvertimeCalculationView.detail(detail));
}
// Read-only layout samples for employee + attendance date, not production schedules.
const overseasVestingWindows={'2026-09-10':[360,1800],'2026-09-11':[420,1380],'2026-09-12':[420,1380],'2026-09-13':[1200,1980],'2026-09-15':[420,1380],'2026-09-16':[420,1380],'2026-09-17':[0,1440]};
const domesticVestingWindows={'2026-09-12':[360,1800],'2026-09-26':[1200,1980]};
const durationRestRules=[{condition:'工作时长 ≥ 4小时 且 < 6小时',minutes:30},{condition:'工作时长 ≥ 6小时',minutes:60}];
const normalShift={name:'',kind:'固定班次',hours:8,start:'当日 09:00',end:'当日 18:00',restMode:'period',rests:[{start:'当日 12:00',end:'当日 13:00',minutes:60}]};
const overseasScheduleSamples={
 '2026-09-10':{attr:'工作日',name:'',kind:'自由班次',hours:8,included:'当日 06:00 ～ 次日 06:00',restMode:'duration',rules:durationRestRules},
 '2026-09-11':{...normalShift,attr:'工作日',name:'',restMode:'duration',rules:durationRestRules,rests:[]},
 '2026-09-12':{attr:'工作日',name:'',kind:'弹性班次',hours:8,start:'当日 08:30',end:'当日 17:30',elasticType:'早到早走、晚到晚走',elasticMinutes:30,restMode:'period',rests:[{start:'当日 12:00',end:'当日 13:00',minutes:60}],checkRange:[['上班最早打卡时间','当日 07:00'],['上班最晚打卡时间','当日 10:00'],['下班最早打卡时间','当日 16:00'],['下班最晚打卡时间','当日 23:00']]},
 '2026-09-13':{attr:'工作日',name:'',kind:'固定班次',hours:8.5,punches:['当日 21:54','次日 02:00','次日 02:31','次日 07:02'],start:'当日 22:00',end:'次日 07:00',restMode:'period',rests:[{start:'次日 02:00',end:'次日 02:30',minutes:30}],checkRange:[['上班最早打卡时间','当日 20:00'],['下班最晚打卡时间','次日 09:00']]},
 '2026-09-14':null,
 '2026-09-15':{...normalShift,attr:'工作日',name:'',hours:7.5,rests:[{start:'当日 12:00',end:'当日 13:00',minutes:60},{start:'当日 15:00',end:'当日 15:30',minutes:30}]},
 '2026-09-16':{...normalShift,attr:'工作日',name:'',hours:8,end:'当日 17:00',restMode:'none',rests:[]},
 '2026-09-17':{attr:'工作日',name:'',kind:'灵活班次',hours:8,restMode:'fixedDuration',restMinutes:60}
};
const domesticScheduleSamples={
 '2026-09-10':{...normalShift,restMode:'duration',rules:durationRestRules,rests:[]},
 '2026-09-12':{name:'',kind:'自由班次',hours:8,included:'当日 06:00 ～ 次日 06:00',restMode:'duration',rules:durationRestRules},
 '2026-09-26':{...overseasScheduleSamples['2026-09-13'],punches:['当日 21:54','次日 02:00','次日 02:31','次日 09:00']},
 '2026-09-28':null
};
function referenceSchedule(day){
 if(activeEmployee==='A'&&Object.hasOwn(domesticScheduleSamples,day))return domesticScheduleSamples[day];
 if(activeEmployee==='B'&&Object.hasOwn(overseasScheduleSamples,day))return overseasScheduleSamples[day];
 return normalShift;
}
function shiftReferenceMarkup(shift){
 if(!shift)return '<div class="reference-empty">暂无排班</div>';
 let rows='';
 const row=(label,value)=>`<div class="shift-info-row"><span>${label}</span><div>${value}</div></div>`;
 rows+=row('班次名称',esc(shift.name||'—'));
 rows+=row('班次类型',esc(shift.kind));
 rows+=row('班次时长',hrs(shift.hours));
 if(shift.kind==='自由班次')rows+=row('纳入范围',esc(shift.included||'—'));
 else if(shift.start||shift.end)rows+=row(shift.kind==='弹性班次'?'标准上下班时间':'上下班时间',`${esc(shift.start||'—')} ～ ${esc(shift.end||'—')}`);
 else rows+=row('上下班时间','未设置');
 if(shift.kind==='弹性班次')rows+=row('弹性',`${esc(shift.elasticType)}，${shift.elasticMinutes}分钟`);
 if(shift.restMode==='period')rows+=row('休息时间',`<div class="rest-periods">${shift.rests.map(r=>`<div><span>${esc(r.start)} ～ ${esc(r.end)}</span><span class="rest-minutes">（${r.minutes}分钟）</span></div>`).join('')}</div>`);
 else if(shift.restMode==='duration')rows+=row('休息规则',`<div class="rest-conditions">${shift.rules.map(r=>`<div><span>${esc(r.condition)}</span><span class="rest-minutes">休息${r.minutes}分钟</span></div>`).join('')}</div>`);
 else if(shift.restMode==='fixedDuration')rows+=row('休息时长',`${shift.restMinutes}分钟`);
 else rows+=row('是否休息','否');
 return `<div class="shift-info">${rows}</div>`;
}
function reference(id,offset=0,anchor=null,replace=false){
 const g=groups.find(x=>x.id===id);if(!g)return;
 if(!g.date){$(`[data-error="${id}-date"]`).textContent='必填项不能为空';return;}
 anchor=anchor||$(`[data-reference="${id}"]`);
 const base=g.vesting||g.date,day=dateShift(base,offset),shift=referenceSchedule(day);
 const attr=!shift?'':shift.attr|| (calendar.holidayDates.includes(day)?'节假日':[0,6].includes(new Date(day+'T12:00:00').getDay())?'公休日':'工作日');
 const punches=offset===0&&shift?(shift.punches||['当日 08:56','当日 12:01','当日 12:58','当日 22:03']):[];
 openPopover(anchor,`reference-${id}`,'班次和打卡记录',`<div class="date-tabs">${[-1,0,1].map(n=>`<button type="button" class="date-tab ${offset===n?'active':''}" aria-pressed="${offset===n}" data-reference-date="${n}" data-gid="${id}">${['前一天','当日','后一天'][n+1]} <span>${dateShift(base,n).slice(5)}</span></button>`).join('')}</div><section class="reference-section"><div class="reference-section-head"><h4>班次明细</h4>${attr?`<span>${attr}</span>`:''}</div>${shiftReferenceMarkup(shift)}</section><section class="reference-section"><h4>打卡记录</h4><div class="punch-list">${punches.length?punches.map(t=>`<span>${t}</span>`).join(''):'<span class="no-punch">暂无打卡记录</span>'}</div></section>`,'reference',replace);
 const details=fieldPopover.querySelector('details');if(details)details.addEventListener('toggle',positionPopover);
 if(replace)fieldPopover.querySelector(`[data-reference-date="${offset}"]`).focus({preventScroll:true});
}
document.addEventListener('pointerdown',e=>{if(popoverAnchor&&!fieldPopover.contains(e.target)&&!popoverAnchor.contains(e.target))closePopover(false);if(!e.target.closest('.city-cascader')){document.querySelectorAll('.city-panel').forEach(p=>p.hidden=true);document.querySelectorAll('[data-city-trigger]').forEach(b=>b.setAttribute('aria-expanded','false'));}});
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-city-trigger]');if(trigger)openCity(groups.find(g=>g.id===Number(trigger.dataset.cityTrigger)),trigger);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const panel=[...document.querySelectorAll('.city-panel')].find(p=>!p.hidden);if(panel){panel.hidden=true;const trigger=panel.parentElement.querySelector('button');trigger.setAttribute('aria-expanded','false');trigger.focus();e.stopImmediatePropagation();}}},true);
window.addEventListener('resize',positionPopover);
window.addEventListener('scroll',positionPopover,true);
function close(id){if(id==='formOverlay'&&isApplication){location.href=listRoute;return;}$('#'+id).hidden=true;if($('#formOverlay').hidden&&$('#drawerMask').hidden)document.body.classList.remove('locked');if(id==='drawerMask'&&focusReturn?.isConnected)focusReturn.focus();if(id==='formOverlay')$('#add').focus();}
let toastTimer;function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',3500);}
$('#add').onclick=()=>location.href='application.html'+(isSelf?'?mode=self':'');$('#query').onclick=renderRows;$('#reset').onclick=()=>{['Employee','Org','Status','Date'].forEach(k=>$('#filter'+k).value='');renderRows();};
$('#employee').onchange=e=>{activeEmployee=e.target.value;groups=[blank()];comp='';submitted=false;renderEmployee();renderGroups();};
$('#addGroup').onclick=()=>{if(groups.length<7){groups.forEach(g=>g.collapsed=true);groups.push(blank());renderGroups();$('#groups .group:last-child input').focus();}};
$('#groups').addEventListener('input',e=>{const g=groups.find(x=>x.id===Number(e.target.closest('[data-group]')?.dataset.group));if(!g||!e.target.dataset.key)return;const k=e.target.dataset.key;if(k==='date')return;g[k]=e.target.value;refresh();});
$('#groups').addEventListener('change',e=>{const g=groups.find(x=>x.id===Number(e.target.closest('[data-group]')?.dataset.group));if(!g||!e.target.dataset.key)return;const k=e.target.dataset.key;const wasDuty=duty(g);g[k]=e.target.value;if(k==='date'){syncVesting(g);if(!duty(g)){g.dutyMode='';g.dutyComp='';if(wasDuty)comp='';}renderGroups();}else{if(k==='start'||k==='end'||k==='endDay')syncVesting(g);refresh();}});
$('#compOptions').onchange=e=>{comp=e.target.value;refresh();};
$('#openCalculation').onclick=e=>periodCalculation(groups[0],e.currentTarget);
document.addEventListener('click',e=>{const c=e.target.closest('[data-close]');if(c)close(c.dataset.close);const toggle=e.target.closest('[data-toggle]');if(toggle){const g=groups.find(g=>g.id===Number(toggle.dataset.toggle));g.collapsed=!g.collapsed;renderGroups();$(`[data-toggle="${g.id}"]`)?.focus();}const r=e.target.closest('[data-remove]');if(r){const index=groups.findIndex(g=>g.id===Number(r.dataset.remove));groups.splice(index,1);if(groups.length===1)groups[0].collapsed=false;renderGroups();const next=groups[Math.min(index,groups.length-1)];($(`[data-toggle="${next.id}"]`)||$(`[data-group="${next.id}"] input`))?.focus();}const calc=e.target.closest('[data-calculation]');if(calc)periodCalculation(groups.find(g=>g.id===Number(calc.dataset.calculation)),calc);const ref=e.target.closest('[data-reference]');if(ref)reference(Number(ref.dataset.reference),0,ref);const day=e.target.closest('[data-reference-date]');if(day)reference(Number(day.dataset.gid),Number(day.dataset.referenceDate),popoverAnchor,true);const rec=e.target.closest('[data-record]');if(rec){const r=filtered[Number(rec.dataset.record)];calculation(r.groups,r.comp);}});
$('#application').onsubmit=e=>{e.preventDefault();submitted=true;renderEmployee();if(!validate(true)){for(const g of groups){const body=$(`#group-body-${g.id}`);if([...body.querySelectorAll('.error')].some(n=>n.textContent)){g.collapsed=false;body.hidden=false;const toggle=$(`[data-toggle="${g.id}"]`);if(toggle){toggle.setAttribute('aria-expanded','true');toggle.querySelector('.toggle-label').textContent='收起';toggle.querySelector('.group-chevron').textContent='⌄';}body.querySelector('.error:not(:empty)')?.closest('.form-item')?.querySelector('input,select,textarea')?.setAttribute('aria-invalid','true');}}$('#application [aria-invalid="true"]')?.focus();return;}records.unshift({listId:crypto.randomUUID(),employee:activeEmployee,applicationHours:total(groups),groups:structuredClone(groups),comp:overseas()?[...new Set(groups.map(g=>g.comp))].join(' / '):comp,status:'审批中'});sessionStorage.setItem('hr-overtime-demo-records',JSON.stringify(records));close('formOverlay');renderRows();toast('演示提交完成，已加入本页列表');};
$('#exportSettings').onclick=()=>{drawer('导出设置',`<div class="export-columns">${fullExportFields.map(n=>`<label><input type="checkbox" name="exportField" value="${n}" ${exportFields.includes(n)?'checked':''}>${n}</label>`).join('')}</div><div class="drawer-actions"><button class="btn btn-default" data-close="drawerMask">取消</button><button class="btn btn-primary" id="saveExport">确定</button></div>`);$('#saveExport').onclick=()=>{const vals=[...document.querySelectorAll('[name="exportField"]:checked')].map(x=>x.value);if(!vals.length){toast('请至少选择一个导出字段');return;}exportFields=vals;close('drawerMask');};};
$('#export').onclick=()=>{const csv=[exportFields,...filtered.map(r=>{const e=employees[r.employee];const v=[e.name,e.no,e.org,r.groups.map(g=>g.date).join('、'),hrs(total(r.groups)),r.comp,r.status];return exportFields.map(n=>v[fullExportFields.indexOf(n)]);})].map(r=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='HR加班申请.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&popoverAnchor){e.preventDefault();closePopover();return;}if(e.key==='Escape'){if(!$('#drawerMask').hidden)close('drawerMask');else if(!$('#formOverlay').hidden)close('formOverlay');}if(e.key==='Tab'){const zone=!$('#drawerMask').hidden?$('#drawerMask'):!$('#formOverlay').hidden?$('#formOverlay'):null;if(!zone)return;const f=[...zone.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.offsetParent!==null);const first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
renderRows();
if(isApplication){document.body.classList.add('application-page');document.querySelector('.content').hidden=true;document.querySelector('.main').append($('#formOverlay'));$('#formOverlay').className='application-shell';const panel=$('#formOverlay .modal');panel.removeAttribute('role');panel.removeAttribute('aria-modal');$('#formOverlay .close').textContent='返回列表';$('#formOverlay .close').setAttribute('aria-label','返回列表');document.querySelector('.breadcrumb').textContent=isSelf?'我的考勤 / 我的加班 / 新增加班':isTeam?'团队考勤 / 团队加班 / 新增加班':'考勤管理 / 假勤流程 / 加班 / 新增加班';if(isSelf){document.title='HR One · 我的加班 · 新增加班';document.querySelector('.user-info').textContent='简体中文　　'+employees[selfEmployee].name;}if(isTeam){document.title='HR One · 团队加班 · 新增加班';document.querySelector('.user-info').textContent='简体中文　　当前主管';}showForm(new URLSearchParams(location.search).get('preview')==='filled');}
else if(new URLSearchParams(location.search).get('preview')==='filled')location.replace('application.html'+location.search);

// Direct review links keep fixture selection outside the application fields.
const reviewMode=new URLSearchParams(location.search).get('preview');
if(isApplication&&['deduction','no-deduction'].includes(reviewMode)){
 showForm(true);Object.assign(groups[0],{date:'2026-09-21',start:reviewMode==='deduction'?'18:00':'18:30',end:'21:00',reason:'班后加班示例。'});syncVesting(groups[0]);renderGroups();
}
if(isApplication&&reviewMode==='multi'){
 showForm(true);groups.push({...sample(),date:'2026-09-13',start:'11:00',end:'14:00',reason:'上线问题排查。',comp:overseas()?'调休假':'',vesting:overseas()?'':'2026-09-13'});syncVesting(groups.at(-1));renderGroups();
}
if(isApplication&&reviewMode==='shifts'&&!isSelf){
 activeEmployee='B';groups=[blank()];groups[0].date=new URLSearchParams(location.search).get('date')||'2026-09-10';groups[0].vesting=groups[0].date;
 $('#employee').value='B';renderEmployee();renderGroups();
}
// Domestic night-shift reference fixture; overtime calculation remains the existing demo.
if(isApplication&&reviewMode==='night'&&selfEmployee==='A'){
 showForm(true);Object.assign(groups[0],{date:'2026-09-27',start:'07:00',end:'09:00',reason:'夜班结束后继续处理设备问题。'});syncVesting(groups[0]);renderGroups();
}
