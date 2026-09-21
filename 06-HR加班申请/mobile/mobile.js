'use strict';
// Mobile presentation reuses the existing application data, validation and fixtures.
const mobileOriginalRender=renderGroups;
function decorateMobile(){
 document.querySelectorAll('[data-reference]').forEach(button=>{const row=button.closest('.date-field');if(row)row.append(button);});
 document.querySelectorAll('.group-duration-field,.duration-summary').forEach(row=>{
  const detail=row.querySelector('.form-label .btn-text');if(detail){row.append(detail);detail.setAttribute('aria-label','查看明细');detail.innerHTML='<span aria-hidden="true">›</span>';row.onclick=e=>{if(!e.target.closest('button')&&!detail.hidden&&!detail.disabled)detail.click();};}
 });
 document.querySelectorAll('.time-field').forEach(field=>{
  const input=field.querySelector('input');field.setAttribute('role','button');field.tabIndex=0;
  field.setAttribute('aria-label',input.dataset.key==='start'?'选择开始时间':'选择结束时间');input.tabIndex=-1;
  const display=document.createElement('span');display.className='mobile-time-value';field.append(display);
  const dayControl=field.querySelector('[data-key="endDay"]');
  const sync=()=>{display.textContent=input.value?`${dayControl?.value==='next'?'次日':'当日'} ${input.value}`:'请选择';display.classList.toggle('placeholder',!input.value);};sync();input.addEventListener('change',sync);dayControl?.addEventListener('change',sync);
  field.onclick=()=>openMobileTime(input);
  field.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openMobileTime(input);}};
 });
}
renderGroups=function(){mobileOriginalRender();decorateMobile();};
const meta=$('#employeeMeta'),metaDetails=document.createElement('details');metaDetails.className='employee-details';
meta.before(metaDetails);metaDetails.innerHTML='<summary>员工信息</summary>';metaDetails.append(meta);
$('#formTitle').textContent='加班申请';
const mobileParams=new URLSearchParams(location.search),isMobileOperation=Boolean(mobileParams.get('action'));
const draftKey='hr-overtime-mobile-draft-'+selfEmployee;
const back=$('#formOverlay .close');back.textContent='‹';back.setAttribute('aria-label',isMobileOperation?'返回加班记录':'返回移动端首页');
back.removeAttribute('data-close');back.onclick=()=>{location.href=isMobileOperation?listRoute:'../../07-移动端首页/index.html';};
if(!isMobileOperation){
 const recordsLink=document.createElement('a');recordsLink.className='mobile-record-link';recordsLink.textContent='加班记录';recordsLink.href=listRoute;$('#formTitle').after(recordsLink);
 recordsLink.onclick=()=>{sessionStorage.setItem(draftKey,JSON.stringify({employee:activeEmployee,groups,comp}));};
 if(mobileParams.get('resume')==='1'){try{const draft=JSON.parse(sessionStorage.getItem(draftKey));if(draft?.employee===selfEmployee&&draft.groups?.length){groups=draft.groups;seq=Math.max(seq,...groups.map(g=>g.id));comp=draft.comp;}}catch{sessionStorage.removeItem(draftKey);}}
}
const mobileOriginalClose=close;
close=function(id){if(id==='formOverlay'){if(!isMobileOperation)sessionStorage.removeItem(draftKey);location.href=listRoute;return;}mobileOriginalClose(id);};
const mobileOriginalOpen=openPopover,mobileOriginalClosePopover=closePopover;
openPopover=function(...args){mobileOriginalOpen(...args);$('#mobileShade').hidden=fieldPopover.hidden;if(!fieldPopover.hidden)fieldPopover.setAttribute('aria-modal','true');};
closePopover=function(...args){mobileOriginalClosePopover(...args);$('#mobileShade').hidden=true;};
$('#mobileShade').onclick=()=>closePopover();
OvertimeCalculationView.detail=function(d){
 const deductions=d.deductions||[],filling=d.fillingMinutes??Math.max(0,d.grossMinutes-deductions.reduce((n,r)=>n+r.minutes,0));
 return `<div class="mobile-calc-summary"><div><span>填写时长</span><strong>${OvertimeCalculationView.hours(filling)}</strong></div><div><span>实际时长</span><strong>${OvertimeCalculationView.hours(d.resultMinutes)}</strong></div></div><div class="mobile-calc-row"><span>加班日期</span><b>${esc(d.date)}<small>${esc(d.type)}</small></b></div><div class="mobile-calc-row"><span>归属日期</span><b>${esc(d.vestingDate||'—')}</b></div><div class="mobile-calc-row"><span>加班时间</span><b>${esc(d.time)}</b></div>${deductions.length||d.note?`<div class="calculation-explanation">${deductions.map(r=>`<p class="calculation-deduction">填写时长已计算扣除时长，${esc(r.time)}不计入加班时长（${esc(r.label)}，共${r.minutes}分钟）。</p>`).join('')}${d.note?`<p>${esc(d.note)}</p>`:''}</div>`:''}`;
};
const timeSheet=$('#timeSheet');let timeTarget=null;
$('#pickHour').innerHTML=Array.from({length:24},(_,i)=>`<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');
$('#pickMinute').innerHTML=Array.from({length:60},(_,i)=>`<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');
function openMobileTime(input){
 timeTarget=input;$('#timeSheetTitle').textContent=input.dataset.key==='start'?'选择开始时间':'选择结束时间';
 const dayControl=input.closest('.time-field').querySelector('[data-key="endDay"]');
 $('#pickDay').innerHTML=input.dataset.key==='start'?'<option value="same">当日</option>':'<option value="same">当日</option><option value="next">次日</option>';
 $('#pickDay').value=dayControl?.value||'same';
 const [h,m]=(input.value||'18:00').split(':');$('#pickHour').value=h;$('#pickMinute').value=m;timeSheet.showModal();renderTimeWheels();
}
$('#cancelTime').onclick=()=>timeSheet.close();
$('#confirmTime').onclick=()=>{const dayControl=timeTarget.closest('.time-field').querySelector('[data-key="endDay"]');if(dayControl){dayControl.value=$('#pickDay').value;dayControl.dispatchEvent(new Event('change',{bubbles:true}));}timeTarget.value=$('#pickHour').value+':'+$('#pickMinute').value;timeTarget.dispatchEvent(new Event('change',{bubbles:true}));timeSheet.close();};
timeSheet.addEventListener('close',()=>timeTarget?.closest('.time-field')?.focus());
timeSheet.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
// First review example keeps one group open; remaining groups expose their summary.
if(groups.length>1)groups.forEach((g,i)=>g.collapsed=i>0);
renderGroups();
if(document.activeElement===$('#employee'))$('#employee').blur();
// Keep keyboard navigation inside whichever bottom sheet is active.
document.addEventListener('keydown',e=>{
 const sheet=timeSheet.open?timeSheet:!fieldPopover.hidden?fieldPopover:null;
 if(!sheet||e.key!=='Tab')return;
 const targets=[...sheet.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(x=>!x.disabled&&x.offsetParent!==null);
 const first=targets[0],last=targets.at(-1);
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 e.stopImmediatePropagation();
},true);

// The mobile time selector uses period, hour and minute wheels.
function renderTimeWheels(){
 const host=document.querySelector('.time-selection');
 host.querySelectorAll('.time-wheel').forEach(el=>el.remove());
 for(const id of ['pickDay','pickHour','pickMinute']){
  const select=document.getElementById(id),options=[...select.options].map(option=>({value:option.value,label:option.textContent})),wheel=document.createElement('div');wheel.className='time-wheel';wheel.setAttribute('role','group');wheel.setAttribute('aria-label',id==='pickDay'?'选择时段':id==='pickHour'?'选择小时':'选择分钟');
  wheel.innerHTML=`<div class="wheel-highlight"></div><div class="wheel-scroll"><div class="wheel-space"></div>${options.map(option=>`<button type="button" data-value="${option.value}" aria-pressed="${select.value===option.value}" class="${select.value===option.value?'selected':''}">${option.label}</button>`).join('')}<div class="wheel-space"></div></div>`;
  host.append(wheel);const scroll=wheel.querySelector('.wheel-scroll');let timer;
  const selectValue=value=>{select.value=value;wheel.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',b.dataset.value===value);b.setAttribute('aria-pressed',String(b.dataset.value===value));});};
  wheel.onclick=e=>{const button=e.target.closest('[data-value]');if(!button)return;selectValue(button.dataset.value);scroll.scrollTo({top:options.findIndex(option=>option.value===button.dataset.value)*44,behavior:'smooth'});};
  scroll.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>selectValue(options[Math.max(0,Math.min(options.length-1,Math.round(scroll.scrollTop/44)))].value),80);});
  requestAnimationFrame(()=>scroll.scrollTop=Math.max(0,options.findIndex(option=>option.value===select.value))*44);
 }
}

const mobileAddGroup=$('#addGroup').onclick;$('#addGroup').onclick=()=>{mobileAddGroup();document.querySelector('.group:last-child')?.scrollIntoView({behavior:'smooth',block:'start'});};
