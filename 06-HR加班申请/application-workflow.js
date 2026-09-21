/* Change/cancel use the existing application form and its validators. Local prototype data only. */
(function(){
 'use strict';
 const params=new URLSearchParams(location.search),action=params.get('action');
 if(!['change','cancel'].includes(action))return;
 const cancel=action==='cancel',label=cancel?'撤销':'变更',key='hr-overtime-list-v1';
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'[]');}catch{return [];}};
 const allowed=r=>r&&r.status==='通过'&&r.type!=='撤销'&&!r.sealed&&r.punchStatus!=='审批中'&&(!isSelf||r.no===employees[selfEmployee].no);
 const target=read().find(r=>r.id===params.get('id'));
 const header='加班'+label+'申请';$('#formTitle').textContent=header;document.title='HR One · '+header;document.querySelector('.breadcrumb').textContent=(isSelf?'我的考勤 / 我的加班':isTeam?'团队考勤 / 团队加班':'考勤管理 / 假勤流程 / 加班')+' / '+header;document.body.classList.add('operation-'+action);
 function blocked(text){let node=$('#workflowError');if(!node){node=document.createElement('p');node.id='workflowError';node.className='workflow-error';node.setAttribute('role','alert');$('#application .modal-body').prepend(node);}node.textContent=text;$('#submit').disabled=true;$('#editable').disabled=true;$('#employee').disabled=true;}
 if(!allowed(target)){blocked('该单据当前不可'+label+'，请返回列表确认单据状态。');return;}
 const source=structuredClone(target.history?.find(r=>r.status==='通过'&&r.type!=='撤销')||target);
 // The current approved record is authoritative; history is a fallback for older local fixtures.
 Object.assign(source,structuredClone(target));delete source.history;delete source.punchHistory;
 const basis=g=>[g.date,g.start,g.endDay,g.end].join('|');
 const originalGroups=source.groups?.length?source.groups:[{date:source.start.slice(0,10),start:source.start.slice(11,16),end:source.end.slice(11,16),endDay:source.end.slice(0,10)>source.start.slice(0,10)?'next':'same',vesting:source.vestingDate,reason:source.originalReason||source.reason||'',dutyMode:source.dutyMode==='—'?'':source.dutyMode,city:source.city==='—'?'':source.city,dutyComp:source.dutyComp==='—'?'':source.dutyComp,comp:source.comp}];
 activeEmployee=Object.keys(employees).find(k=>employees[k].no===source.no)||'';if(!activeEmployee){blocked('未找到原单员工信息，不可提交。');return;}
 groups=originalGroups.map(g=>({...blank(),...structuredClone(g),id:++seq,collapsed:false}));
 const originalTotal=Number(source.requestHours??source.hours),savedById=new Map(groups.map((g,i)=>[g.id,{basis:basis(g),hours:Number(originalGroups[i].hours??(groups.length===1?originalTotal:NaN))}]));
 const originalDuration=duration;duration=function(g){const saved=savedById.get(g.id);return saved&&saved.basis===basis(g)&&Number.isFinite(saved.hours)?saved.hours:originalDuration(g);};
 const originalCalculation=periodCalculation;periodCalculation=function(g,anchor){const saved=savedById.get(g.id);if(saved&&saved.basis===basis(g)&&Number.isFinite(saved.hours)){openPopover(anchor,'original-'+g.id,'加班计算明细',OvertimeCalculationView.detail({date:g.date,vestingDate:g.vesting||'—',type:type(g),time:`当日 ${g.start} ～ ${g.endDay==='next'?'次日':'当日'} ${g.end}`,grossMinutes:spanMinutes(g),fillingMinutes:saved.hours*60,resultMinutes:saved.hours*60,deductions:[],note:'展示原申请记录时长。'}));}else originalCalculation(g,anchor);};
 comp=source.comp;$('#employee').value=activeEmployee;
 const reason=document.createElement('section');reason.className='workflow-reason';reason.innerHTML=`<label class="form-item"><span class="form-label"><i class="required">*</i>${label}原因</span><textarea id="operationReason" maxlength="200" placeholder="请输入${label}原因"></textarea><span class="error" id="operationReasonError" role="alert"></span></label>`;$('#editable').after(reason);
 function enforce(){
  $('#employee').disabled=true;$('#addGroup').hidden=true;$('#addGroup').disabled=true;document.querySelector('.group-add-row').hidden=true;document.querySelectorAll('[data-remove]').forEach(b=>{b.hidden=true;b.disabled=true;});
  document.querySelectorAll('[data-key="reason"]').forEach(el=>{el.readOnly=true;const field=el.closest('.form-item');field.querySelector('.form-label').textContent='原申请理由';field.hidden=!cancel;});
  if(cancel){document.querySelectorAll('#editable input,#editable select,#editable textarea,#editable [data-city-trigger]').forEach(el=>el.disabled=true);document.querySelectorAll('.time-field').forEach(el=>{el.setAttribute('aria-disabled','true');el.tabIndex=-1;el.onclick=null;el.onkeydown=null;el.removeAttribute('role');});}
 }
 const oldRender=renderGroups,oldRefresh=refresh,oldEmployee=renderEmployee;
 renderGroups=function(){oldRender();enforce();};refresh=function(){oldRefresh();enforce();};renderEmployee=function(){oldEmployee();$('#employee').disabled=true;};
 renderEmployee();renderGroups();
 $('#operationReason').addEventListener('input',()=>{$('#operationReasonError').textContent='';});
 $('#application').onsubmit=e=>{
  e.preventDefault();const reasonText=$('#operationReason').value.trim();$('#operationReasonError').textContent=reasonText?'':'必填项不能为空';if(!reasonText){$('#operationReason').focus();return;}
  const latest=read(),index=latest.findIndex(r=>r.id===target.id),current=latest[index];if(!allowed(current)||JSON.stringify(current)!==JSON.stringify(target)){blocked('原单状态或内容已变化，当前不可提交，请返回列表重新发起。');return;}
  if(!cancel){submitted=true;if(!validate(true)){groups.forEach(g=>{g.collapsed=false;const body=$(`#group-body-${g.id}`);body.hidden=false;const toggle=$(`[data-toggle="${g.id}"]`);if(toggle){toggle.setAttribute('aria-expanded','true');toggle.querySelector('.toggle-label').textContent='收起';}});$('#application [aria-invalid="true"]')?.focus();return;}}
  const updatedGroups=cancel?structuredClone(originalGroups):structuredClone(groups),g=updatedGroups[0];
  const next={...source,type:label,status:'审批中',submitted:new Date().toLocaleString('sv-SE').slice(0,16),groups:updatedGroups,originalReason:source.originalReason||source.reason||'',reason:source.originalReason||source.reason||'',actualStart:'—',actualEnd:'—',actualHours:'—'};
  next[cancel?'cancelReason':'changeReason']=reasonText;
  if(!cancel){Object.assign(next,{start:g.date+' '+g.start,end:(g.endDay==='next'?dateShift(g.date,1):g.date)+' '+g.end,vestingDate:g.vesting,kind:type(g),hours:total(groups).toFixed(2),requestHours:total(groups).toFixed(2),comp:overseas()?[...new Set(groups.map(g=>g.comp))].join(' / '):comp,dutyFlag:duty(g)?'值班':'普通加班',dutyMode:g.dutyMode||'—',city:g.city||'—',dutyComp:g.dutyComp||'—'});}
  const history=structuredClone(current.history||[]);if(!history.length){const original={...current};delete original.history;delete original.punchHistory;history.push(original);}
  latest[index]={...next,history:[structuredClone(next),...history],punchHistory:structuredClone(current.punchHistory||[])};
  sessionStorage.setItem(key,JSON.stringify(latest));close('formOverlay');
 };
})();
