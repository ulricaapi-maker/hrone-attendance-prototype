/* Personnel update and planned exit sketch. Fictional personnel feed only. */
const incomingPeople=[{id:'e7',name:'陈新',no:'E0007',org:'o',job:'项目专员',grade:'P2-1',originalHc:'HC009'},{id:'e10',name:'周新',no:'E0010',org:'p',job:'产品经理',grade:'P2-1',originalHc:''}];
const actualMovements=[{id:'e3',org:'s',job:'数据分析专员',grade:'P3-1',originalHc:'HC020'},{id:'e5',org:'outside',orgName:'其他部门',job:'项目专员',grade:'P2-2',originalHc:'HC021',outside:true}];
for(const row of records)if(row.actualPerson){const p=STAFF_DEMO.find(p=>p.id===row.actualPerson.id);if(p)Object.assign(p,row.actualPerson);else STAFF_DEMO.push(structuredClone(row.actualPerson));}
for(const person of incomingPeople)if(!STAFF_DEMO.some(p=>p.id===person.id))STAFF_DEMO.push({...person});
const actualDepartures=[{person:'e6',date:'2026-10-21'}];
const updatePeopleButton=document.createElement('button');updatePeopleButton.id='update-people';updatePeopleButton.textContent='拉取最新的员工和编制';updatePeopleButton.title='';for(const button of [updatePeopleButton,$('#open-planning-import'),$('#preview-plan')])$('#planning-global-actions').appendChild(button);
const plannedExitDialog=document.createElement('dialog');plannedExitDialog.id='planned-exit-dialog';plannedExitDialog.className='small-dialog';plannedExitDialog.setAttribute('aria-labelledby','planned-exit-title');plannedExitDialog.innerHTML=`<form id="planned-exit-form" novalidate><div class="modal-header"><h2 id="planned-exit-title">移出人员</h2><button type="button" class="close" data-close="planned-exit-dialog" aria-label="关闭移出人员">×</button></div><div class="modal-body"><div id="planned-exit-person"></div><div class="form-grid"><label>计划移出日期 <em>*</em><input id="planned-exit-date" type="date"></label><label>编制编码<input id="planned-exit-hc" readonly></label></div></div><div class="modal-footer"><p id="planned-exit-error" class="error" role="alert"></p><button type="button" data-close="planned-exit-dialog">取消</button><button type="submit" class="primary">确认移出</button></div></form>`;document.body.appendChild(plannedExitDialog);
let plannedExitId=null;
function exitActionFor(row){return adjustmentHistory.slice().reverse().find(t=>!t.revoked&&t.label==='计划移出'&&t.records.some(c=>c.id===row.id));}
function openPlannedExit(id){const row=records.find(r=>r.id===id);if(!row?.person||row.deleted)return;const person=staff(row);plannedExitId=id;$('#planned-exit-person').innerHTML=info([['姓名',person?.name],['工号',person?.no]]);$('#planned-exit-hc').value=row.code;$('#planned-exit-date').value='';$('#planned-exit-error').textContent='';plannedExitDialog.showModal();}
$('#planned-exit-form').onsubmit=e=>{e.preventDefault();const row=records.find(r=>r.id===plannedExitId),date=$('#planned-exit-date').value;if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))){$('#planned-exit-error').textContent='请填写计划移出日期。';$('#planned-exit-date').focus();return;}if(!row?.person||row.deleted){$('#planned-exit-error').textContent='人员已发生变化，请重新打开。';return;}const before=snapshot();row.plannedExitDate=date;row.deleted=true;recordAction('计划移出',before);plannedExitDialog.close();selected.delete(row.id);render();notify('已计划移出，原编制同时停用');};
$('#planned-exit-date').oninput=()=>$('#planned-exit-error').textContent='';
if(!employeeColumns.some(c=>c[0]==='plannedEntryDate'))employeeColumns.splice(employeeColumns.length-1,0,['plannedEntryDate','计划调入日期',140]);
if(!employeeColumns.some(c=>c[0]==='plannedTransferDate'))employeeColumns.splice(employeeColumns.length-1,0,['plannedTransferDate','计划调动日期',140]);
if(!employeeColumns.some(c=>c[0]==='plannedExitDate'))employeeColumns.splice(employeeColumns.length-1,0,['plannedExitDate','计划移出日期',140]);
const cellBeforePeopleUpdate=cell;cell=function(row,key){
 if(row.plannedExitDate){if(key==='actions'){const action=exitActionFor(row);return action?`<button class="text" data-cancel-planned-exit="${esc(action.id)}">取消移出</button>`:'—';}if(key==='name'&&planningTab==='people')return cellBeforePeopleUpdate(row,key)+'<small class="person-exit-tag">计划移出</small>';}
 const html=cellBeforePeopleUpdate(row,key);if(key==='actions'&&planningTab==='people'&&row.person&&!row.deleted)return html.replace('</div>',`<button class="text" data-planned-exit="${esc(row.id)}">移出人员</button></div>`);return html;
};
const tableClickBeforePeopleUpdate=$('#table-body').onclick;$('#table-body').onclick=e=>{const data=e.target.closest('button')?.dataset;if(data?.plannedExit){openPlannedExit(data.plannedExit);return;}if(data?.cancelPlannedExit){const action=adjustmentHistory.find(t=>t.id===data.cancelPlannedExit),row=records.find(r=>r.plannedExitDate&&!r.person&&r.lastActualDeparture&&action?.records.some(c=>c.id===r.id));if(row){const before=snapshot();delete row.plannedExitDate;row.deleted=false;recordAction('取消计划移出',before);render();notify('已取消移出，编制恢复为空编');}else undoAction(data.cancelPlannedExit);return;}tableClickBeforePeopleUpdate(e);};
const visibleBeforePeopleUpdate=visibleRows;visibleRows=function(){if(planningTab!=='people')return visibleBeforePeopleUpdate();return currentRows().filter(r=>r.person&&(!r.deleted||r.plannedExitDate)&&Object.entries(filters).every(([key,value])=>dataValue(r,key).toLowerCase().includes(value.toLowerCase())));};
const renderBeforePeopleUpdate=render;render=function(){if(sourceView())planningTab='people';renderBeforePeopleUpdate();$('#headcount-tab').hidden=sourceView();$('#headcount-display-tools').hidden=sourceView()||planningTab!=='headcounts';const scope=scopes(),people=records.filter(r=>scope.has(r.org)&&r.person&&(!r.deleted||r.plannedExitDate)),hcs=records.filter(r=>scope.has(r.org)&&!r.personOnly&&!r.deleted);$('#people-tab').textContent=`人员列表（${people.length}）`;$('#headcount-tab').textContent=`编制列表（${hcs.length}）`;};
// If the saved sketch has emptied every stopped department, retain a reviewable example.
const stoppedDemoOrg=orgPlan.nodes.find(n=>n.disabled&&positions.some(p=>p.org===n.id));
if(stoppedDemoOrg&&!records.some(r=>!activeOrg(r.org)&&r.person)&&!records.some(r=>r.id.startsWith('stopped-demo-'))){
 const job=positions.find(p=>p.org===stoppedDemoOrg.id)?.name;
 for(const [suffix,name,no]of [['8','陈七','E0008'],['9','孙八','E0009']]){const person={id:'stopped-demo-e'+suffix,name,no,org:stoppedDemoOrg.id,job,grade:'P3-1'};STAFF_DEMO.push(person);const row={id:'stopped-demo-hc'+suffix,code:'HC-DEMO-00'+suffix,person:person.id,org:person.org,job,grade:person.grade,overseas:false,place:'深圳',office:'深圳',center:'示例业务成本中心',abc:'B',remark:'',arrival:''};records.push(row);baseRecords.push(clone(row));}
}
for(const [suffix,name,no]of [['8','陈七','E0008'],['9','孙八','E0009']]){const r=records.find(r=>r.id==='stopped-demo-hc'+suffix);if(r&&!STAFF_DEMO.some(p=>p.id==='stopped-demo-e'+suffix)){const source=adjustmentHistory.flatMap(t=>t.records).find(c=>c.id===r.id)?.before||r;STAFF_DEMO.push({id:'stopped-demo-e'+suffix,name,no,org:source.org,job:source.job,grade:'P3-1'});if(!baseRecords.some(b=>b.id===r.id))baseRecords.push(clone(source));}}
// Preview all personnel changes before committing any of them.
function updateHcAvailable(r,person,rows){return !!r&&!r.personOnly&&r.org===person.org&&!r.deleted&&activeOrg(r.org)&&positions.some(p=>p.org===r.org&&p.name===r.job&&!p.disabled)&&(!r.person||r.person===person.id);}
function manuallyPlanned(personId){const current=records.find(r=>r.person===personId),baseline=baseRecords.find(r=>r.person===personId);if(current&&baseline&&(current.code!==baseline.code||current.org!==baseline.org||current.job!==baseline.job))return true;return adjustmentHistory.some(action=>!action.revoked&&(action.label.includes('人员调整')||action.label==='计划移出')&&action.records.some(c=>c.before?.person===personId||c.after?.person===personId));}
function actualOrgName(p){return orgPlan.get(p.org)?formatOrg(p.org):p.orgName||'其他部门';}
function buildPeopleUpdate(){
 const before=snapshot(),next=clone(records),added=[],departed=[],moved=[],out=[],actuals=[],bindings=[],departedIds=new Set(actualDepartures.map(e=>e.person)),movementIds=new Set();
 const saveActual=(row,p)=>{row.actualPerson=clone(p);actuals.push(clone(p));};
 const release=row=>{row.person=null;delete row.plannedEntryDate;delete row.plannedExitDate;delete row.bindingTransferId;delete row.actualPerson;delete row.planningGrade;delete row.assignmentType;delete row.plannedTransferDate;};
 const place=(person,dates={})=>{const hc=next.find(r=>r.code===person.originalHc&&updateHcAvailable(r,person,next));if(hc){Object.assign(hc,{person:person.id},dates);saveActual(hc,person);return hc;}const row={id:'unbound-person-'+person.id,personOnly:true,code:'',person:person.id,org:person.org,job:person.job,grade:'',planningGrade:person.grade,...dates,actualPerson:clone(person)};const old=next.findIndex(r=>r.id===row.id);if(old>=0)next[old]=row;else next.push(row);actuals.push(clone(person));return row;};
 for(const exit of actualDepartures){const row=next.find(r=>r.person===exit.person);if(!row)continue;const p=STAFF_DEMO.find(p=>p.id===exit.person);departed.push({person:clone(p),oldCode:row.code||'',oldOrg:row.org});row.lastActualDeparture=clone(exit);release(row);}
 for(const change of actualMovements){if(departedIds.has(change.id)||movementIds.has(change.id))continue;movementIds.add(change.id);const row=next.find(r=>r.person===change.id),p={...STAFF_DEMO.find(p=>p.id===change.id),...change};if(!row){if(!change.outside){moved.push({person:clone(p),oldCode:'',oldOrg:null,protectedPlan:false});bindings.push({person:p,dates:{}});}continue;}const old=row.actualPerson||STAFF_DEMO.find(p=>p.id===change.id);const oldActualCode=old.originalHc||baseRecords.find(r=>r.person===p.id)?.code||'';if(['org','job','grade'].every(k=>p[k]===old[k])&&p.originalHc===oldActualCode)continue;
  const protectedPlan=manuallyPlanned(p.id),item={person:clone(p),oldCode:old.originalHc||baseRecords.find(r=>r.person===p.id)?.code||row.code||'',oldOrg:row.org,protectedPlan};
  if(change.outside){out.push(item);saveActual(row,p);if(!protectedPlan){row.lastActualTransfer=clone(p);release(row);}continue;}
  moved.push(item);const locationChanged=p.org!==old.org||p.job!==old.job||p.originalHc!==old.originalHc;
  if(protectedPlan){row.planningGrade??=old.grade;saveActual(row,p);continue;}
  if(!locationChanged){saveActual(row,p);row.planningGrade=p.grade;continue;}
  const dates=Object.fromEntries(['plannedEntryDate','plannedExitDate','assignmentType','plannedTransferDate'].filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]));release(row);bindings.push({person:p,dates});
 }
 // Departures and transfers release their former headcounts before any new binding.
 for(const assignment of bindings)place(assignment.person,assignment.dates);
 for(const p of incomingPeople){if(departedIds.has(p.id)||movementIds.has(p.id)||next.some(r=>r.person===p.id))continue;place(p);added.push({person:clone(p)});}
 return {before,next,added,departed,moved,out,actuals};
}
// Fictional organization/position additions exercise duplicate-name handling.
// All changes stay in the preview until its footer is confirmed.
const actualOrgAdditions=[{id:'actual-demo-project-org',parent:'a',name:'原项目组',code:'DEMO-ORG-101',owner:'李主管'}];
const actualPositionAdditions=[{id:'actual-demo-project-position',org:'o',name:'项目专员',code:'DEMO-POS-101',min:'P1-1',max:'P4-3',sequence:'专业序列',family:'业务族',category:'业务支持类',costClass:'职能',collar:'白领'}];
function prepareStructureUpdate(plan){
 plan.orgBefore=clone(orgPlan.nodes);plan.nextOrgs=clone(orgPlan.nodes);plan.nextPositions=clone(positions);plan.orgDuplicates=[];plan.positionDuplicates=[];
 for(const source of actualOrgAdditions){
  if(plan.nextOrgs.some(n=>n.id===source.id)||!plan.nextOrgs.some(n=>n.id===source.parent&&!n.disabled))continue;
  const existing=plan.nextOrgs.find(n=>n.parent===source.parent&&n.name.trim()===source.name.trim());
  if(existing)plan.orgDuplicates.push({source:clone(source),existingId:existing.id,resolved:false});else plan.nextOrgs.push(clone(source));
 }
 for(const source of actualPositionAdditions){
  if(plan.nextPositions.some(p=>p.id===source.id)||!plan.nextOrgs.some(n=>n.id===source.org&&!n.disabled))continue;
  const existing=plan.nextPositions.find(p=>p.org===source.org&&p.name.trim()===source.name.trim());
  if(existing)plan.positionDuplicates.push({source:clone(source),existingId:existing.id,resolved:false});else plan.nextPositions.push(clone(source));
 }
 return plan;
}
const peoplePreview=document.createElement('dialog');peoplePreview.id='people-update-preview';peoplePreview.setAttribute('aria-labelledby','people-update-preview-title');peoplePreview.innerHTML=`<div class="modal-header"><h2 id="people-update-preview-title">拉取最新的员工和编制</h2><button class="close" data-close="people-update-preview" aria-label="关闭拉取最新的员工和编制">×</button></div><div class="modal-body" id="people-update-preview-body"></div><div class="modal-footer"><p id="people-update-preview-error" class="error" role="alert"></p><button data-close="people-update-preview">取消</button><button id="confirm-people-preview" class="primary">确认更新</button></div>`;document.body.appendChild(peoplePreview);
let peoplePreviewPlan=null,peopleUpdateTab='org';
function renderPeopleUpdatePreview(){
 const plan=peoplePreviewPlan;if(!plan)return;
 const table=(title,headers,items,values)=>items.length?`<section class="people-update-section"><h3>${title}（${items.length}）</h3><div class="people-update-scroll"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${items.map(item=>`<tr>${values(item).map(value=>`<td><span title="${esc(value)}">${esc(value)}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`:'';
 const identity=item=>[`${item.person.name}（${item.person.no}）`,actualOrgName(item.person),item.person.job];
 const result=item=>plan.next.find(r=>r.person===item.person.id);
 const personCount=plan.added.length+plan.departed.length+plan.moved.length+plan.out.length;
 const tabs=`<div class="pull-update-tabs" role="tablist" aria-label="拉取数据类型">${[['org','组织',plan.orgDuplicates.filter(d=>!d.resolved).length],['position','职位',plan.positionDuplicates.filter(d=>!d.resolved).length],['people','员工',personCount]].map(([key,label,count])=>`<button id="pull-tab-${key}" role="tab" aria-selected="${peopleUpdateTab===key}" aria-controls="pull-update-panel" data-pull-tab="${key}">${label}（${count}）</button>`).join('')}</div>`;
 let content='';
 if(peopleUpdateTab==='people'){
  content=table('新增人员',['员工','任职部门','任职职位','编制'],plan.added,item=>[...identity(item),result(item)?.code||''])+
   table('调动人员',['员工','任职部门','任职职位','规划部门','编制'],[...plan.moved,...plan.out],item=>[...identity(item),result(item)?formatOrg(result(item).org):'',result(item)?.code||''])+
   table('离职人员',['员工','离职前任职部门','离职前任职职位','原编制'],plan.departed,item=>[...identity(item),item.oldCode]);
  if(!content)content='<div class="pull-empty">暂无人员变化</div>';
 }else{
  const isOrg=peopleUpdateTab==='org',items=isOrg?plan.orgDuplicates:plan.positionDuplicates,collection=isOrg?plan.nextOrgs:plan.nextPositions;
  const remaining=items.filter(d=>!d.resolved);
  content=remaining.length?`<section class="people-update-section"><h3>名称重复（${remaining.length}）</h3><div class="people-update-scroll pull-duplicates"><table><thead><tr><th>${isOrg?'上级组织':'部门'}</th><th>${isOrg?'组织全称':'部门全称'}</th><th>${isOrg?'组织名称':'职位名称'}</th><th>规划${isOrg?'组织':'职位'}名称</th></tr></thead><tbody>${remaining.map(item=>{const index=items.indexOf(item),existing=collection.find(n=>n.id===item.existingId);const scopeId=isOrg?item.source.parent:item.source.org,scope=plan.nextOrgs.find(n=>n.id===scopeId),fullName=isOrg?orgPlan.path(scopeId,plan.nextOrgs)+' / '+item.source.name:orgPlan.path(scopeId,plan.nextOrgs);return `<tr><td><span title="${esc(scope?.name||'')}">${esc(scope?.name||'')}</span></td><td><span title="${esc(fullName)}">${esc(fullName)}</span></td><td><span title="${esc(item.source.name)}">${esc(item.source.name)}</span></td><td><input aria-label="规划${isOrg?'组织':'职位'}名称" data-pull-name="${index}" value="${esc(item.proposedName??existing.name)}" maxlength="100"></td></tr>`;}).join('')}</tbody></table></div></section>`:'<div class="pull-empty">暂无名称重复</div>';
 }
 $('#people-update-preview-body').innerHTML=tabs+`<div id="pull-update-panel" role="tabpanel" aria-labelledby="pull-tab-${peopleUpdateTab}">${content}</div>`;
}
function openPeopleUpdatePreview(plan){peoplePreviewPlan=prepareStructureUpdate(plan);peopleUpdateTab='org';$('#people-update-preview-error').textContent='';renderPeopleUpdatePreview();peoplePreview.showModal();$('#people-update-preview-body').scrollTop=0;}
$('#people-update-preview-body').onclick=e=>{
 const button=e.target.closest('[data-pull-tab]');if(!button)return;
 peopleUpdateTab=button.dataset.pullTab;$('#people-update-preview-error').textContent='';renderPeopleUpdatePreview();
};
$('#people-update-preview-body').oninput=e=>{
 const input=e.target.closest('[data-pull-name]');if(!input)return;
 const items=peopleUpdateTab==='org'?peoplePreviewPlan.orgDuplicates:peoplePreviewPlan.positionDuplicates;
 items[Number(input.dataset.pullName)].proposedName=input.value;
 input.removeAttribute('aria-invalid');$('#people-update-preview-error').textContent='';
};
function applyPullNameEdits(plan){
 // Validate both tabs on copies, so an invalid name never partially changes the preview.
 const nextOrgs=clone(plan.nextOrgs),nextPositions=clone(plan.nextPositions),nextRows=clone(plan.next),resolved=[];
 for(const kind of ['org','position']){
  const isOrg=kind==='org',items=isOrg?plan.orgDuplicates:plan.positionDuplicates,collection=isOrg?nextOrgs:nextPositions;
  for(const [index,item] of items.entries()){
   if(item.resolved||item.proposedName===undefined)continue;
   const existing=collection.find(n=>n.id===item.existingId),name=item.proposedName.trim();
   const sameScope=n=>isOrg?n.parent===existing.parent:n.org===existing.org;
   let error='';if(!name)error='必填项不能为空';else if(name===item.source.name||collection.some(n=>n.id!==existing.id&&sameScope(n)&&n.name.trim()===name))error=isOrg?'同一上级下已存在同名组织，请修改名称。':'同一部门下已存在同名职位，请修改名称。';
   if(error){peopleUpdateTab=kind;renderPeopleUpdatePreview();$('#people-update-preview-error').textContent=error;const input=$(`[data-pull-name="${index}"]`);input.setAttribute('aria-invalid','true');input.focus();return false;}
   const oldName=existing.name;existing.name=name;
   if(!isOrg)for(const row of nextRows)if(row.org===existing.org&&row.job===oldName)row.job=name;
   collection.push(clone(item.source));resolved.push(item);
  }
 }
 plan.nextOrgs=nextOrgs;plan.nextPositions=nextPositions;plan.next=nextRows;for(const item of resolved)item.resolved=true;return true;
}
function commitPeopleUpdate(plan){
 if(JSON.stringify(snapshot())!==JSON.stringify(plan.before)||JSON.stringify(orgPlan.nodes)!==JSON.stringify(plan.orgBefore)){$('#people-update-preview-error').textContent='规划已发生变化，请关闭后重新拉取。';return false;}
 if(!applyPullNameEdits(plan))return false;
 const ids=plan.next.filter(r=>r.person&&!r.deleted).map(r=>r.person);if(new Set(ids).size!==ids.length){$('#people-update-preview-error').textContent='人员存在重复绑定，请重新拉取。';return false;}
 // Persist the organization and staffing drafts as one local operation.
 const orgKey='hrone-org-plan-demo-v1',staffKey='hrone-staffing-sketch-v1';let oldOrg,oldStaff;
 try{
  oldOrg=localStorage.getItem(orgKey);oldStaff=localStorage.getItem(staffKey);
  const orgDraft=oldOrg?JSON.parse(oldOrg):{};
  localStorage.setItem(orgKey,JSON.stringify({...orgDraft,nodes:plan.nextOrgs,time:Date.now()}));
  localStorage.setItem(staffKey,JSON.stringify({records:plan.next,positions:plan.nextPositions,selectedOrg,bindingTransfers,staffingView,adjustmentHistory}));
 }catch{
  try{if(oldOrg!==undefined){if(oldOrg===null)localStorage.removeItem(orgKey);else localStorage.setItem(orgKey,oldOrg);}if(oldStaff!==undefined){if(oldStaff===null)localStorage.removeItem(staffKey);else localStorage.setItem(staffKey,oldStaff);}}catch{}
  $('#people-update-preview-error').textContent='当前浏览器无法保存，请重试。';return false;
 }
 records=plan.next;positions=plan.nextPositions;orgPlan.nodes=plan.nextOrgs;
 for(const p of plan.actuals){const old=STAFF_DEMO.find(s=>s.id===p.id);if(old)Object.assign(old,p);else STAFF_DEMO.push(clone(p));}
 selected.clear();render();notify('数据更新完成');return true;
}
updatePeopleButton.onclick=()=>openPeopleUpdatePreview(buildPeopleUpdate());
$('#confirm-people-preview').onclick=()=>{if(peoplePreviewPlan&&commitPeopleUpdate(peoplePreviewPlan)){peoplePreview.close();peoplePreviewPlan=null;}};
peoplePreview.addEventListener('close',()=>{peoplePreviewPlan=null;});
// Unbound people remain in the personnel list without creating headcounts.
const rowsBeforeUnboundPeople=currentRows;
currentRows=function(){return rowsBeforeUnboundPeople().filter(r=>!r.personOnly||planningTab==='people');};rowScope=currentRows;
const cellBeforeUnboundPeople=cell;
cell=function(row,key){if(row.personOnly&&['code','job','grade','occupancy'].includes(key))return '';return cellBeforeUnboundPeople(row,key);};
const arrangeBeforeUnboundPeople=openArrange;
openArrange=function(ids){
 const chosen=ids?.length?ids:[...selected],unbound=chosen.some(id=>records.find(r=>r.id===id)?.personOnly);
 arrangeBeforeUnboundPeople(ids);
 const carry=$('#binding-mode input[value="carry"]'),target=$('#binding-mode input[value="target"]');carry.disabled=unbound;
 if(unbound){bindingMode='target';carry.checked=false;target.checked=true;renderMappings();}
};
const valueBeforeUnboundPeople=dataValue;
dataValue=function(row,key){if(key==='personGrade')return row.planningGrade||staff(row)?.grade||'';return valueBeforeUnboundPeople(row,key);};
// Durable presentation examples for the newly planned customer operations department.
(function installCustomerPositionExamples(){
 const org=orgPlan.nodes.find(n=>n.name==='客户运营部'&&!n.disabled);if(!org)return;
 const marker='hrone-position-demo-customer-ops-v1';try{if(localStorage.getItem(marker)==='1')return;}catch{}
 const examples=[{id:'demo-customer-ops-manager',code:'DEMO-POS-001',name:'客户运营经理',min:'P3-1',max:'P4-3',sequence:'管理序列',order:'1'},{id:'demo-customer-ops-specialist',code:'DEMO-POS-002',name:'客户运营专员',min:'P1-1',max:'P3-3',sequence:'专业序列',order:'2'}];
 let added=false;for(const example of examples){if(positions.some(p=>p.org===org.id&&p.name===example.name))continue;positions.push({...example,org:org.id,establishDate:'2027-01-01',family:'业务族',category:'业务支持类',costClass:'职能',collar:'白领'});added=true;}
 if(added&&!saveDraft())return;try{localStorage.setItem(marker,'1');}catch{}
})();
render();

// Two headcount examples for the presentation, installed once without replacing saved changes.
(function installCustomerHeadcountExamples(){
 const org=orgPlan.nodes.find(n=>n.name==='客户运营部'&&!n.disabled);if(!org)return;
 const marker='hrone-hc-demo-customer-ops-v1';try{if(localStorage.getItem(marker)==='1')return;}catch{}
 const examples=[{id:'demo-customer-ops-hc-manager',code:'DEMO-HC-001',job:'客户运营经理',grade:'P4-1',arrival:'2027-01-01'},{id:'demo-customer-ops-hc-specialist',code:'DEMO-HC-002',job:'客户运营专员',grade:'P2-1',arrival:'2027-07-01'}];
 if(examples.some(example=>!positions.some(p=>p.org===org.id&&p.name===example.job&&!p.disabled)))return;
 const before=snapshot();let added=false;
 for(const example of examples){if(records.some(r=>r.id===example.id||r.code===example.code))continue;records.push({...example,org:org.id,person:null,abc:'B',overseas:false,center:'示例业务成本中心',place:'深圳',office:'深圳',remark:''});added=true;}
 if(added){recordAction('新增编制',before);if(!saveDraft())return;}
 try{localStorage.setItem(marker,'1');}catch{}render();
})();
