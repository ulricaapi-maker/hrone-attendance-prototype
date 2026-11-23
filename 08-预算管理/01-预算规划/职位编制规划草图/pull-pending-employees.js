/* Personnel arrangements stay in the pull preview until Confirm update. */
const pullPendingSelection=new Set();
let pullPendingEditing=[];
const pullPendingEditor=document.createElement('dialog');
pullPendingEditor.id='pull-pending-editor';
pullPendingEditor.setAttribute('aria-labelledby','pull-pending-editor-title');
pullPendingEditor.innerHTML=`<div class="modal-header"><h2 id="pull-pending-editor-title">人员调整</h2><button class="close" data-close="pull-pending-editor" aria-label="关闭人员调整">×</button></div><div class="modal-body"><div id="pull-pending-identity" class="info-grid"></div><label class="target-label"><span><em>*</em> 计划调动日期</span><input type="date" id="pull-pending-date" aria-label="计划调动日期"></label><label class="target-label"><span><em>*</em> 目标部门</span><select id="pull-pending-dept" aria-label="目标部门"></select></label><fieldset class="retirement-modes"><legend>编制处理</legend><label><input type="radio" name="pull-pending-mode" value="carry" disabled> 携带原编制</label><label><input type="radio" name="pull-pending-mode" value="target" checked> 使用目标部门编制</label></fieldset><div id="pull-pending-targets"></div><p class="retirement-impact">员工使用目标编制后，原编制自计划调动月份起自动停用。</p><p id="pull-pending-editor-error" class="error" role="alert"></p></div><div class="modal-footer"><button data-close="pull-pending-editor">取消</button><button id="pull-pending-save" class="primary">确认调整</button></div>`;
document.body.appendChild(pullPendingEditor);
function pullPendingPerson(row){return row.actualPerson||peoplePreviewPlan.actuals.find(p=>p.id===row.person)||STAFF_DEMO.find(p=>p.id===row.person)||{};}
function pullPendingOrgActive(id,plan=peoplePreviewPlan){const seen=new Set();while(id){if(seen.has(id))return false;seen.add(id);const org=plan.nextOrgs.find(n=>n.id===id);if(!org||org.disabled||plan.orgStopped.some(n=>n.id===id))return false;id=org.parent;}return true;}
function pullPendingPositionActive(row,plan=peoplePreviewPlan){return pullPendingOrgActive(row.org,plan)&&plan.nextPositions.some(p=>p.org===row.org&&p.name===row.job&&!p.disabled&&!plan.positionStopped.some(s=>s.id===p.id));}
function pullPendingVacancies(org,personId){const plan=peoplePreviewPlan,reserved=new Set(Object.entries(plan.pendingArrangements).filter(([id])=>id!==personId&&!pullPendingEditing.includes(id)).map(([,a])=>a.target));return plan.next.filter(row=>row.org===org&&!row.person&&!row.personOnly&&!row.deleted&&pullPendingPositionActive(row)&&!reserved.has(row.id));}
function renderPullPendingEmployees(){
 const plan=peoplePreviewPlan,rows=plan.pendingEmployees;
 for(const id of pullPendingSelection)if(!rows.some(r=>r.person===id))pullPendingSelection.delete(id);
 return `<div class="pull-pending-toolbar"><button id="pull-pending-batch" ${pullPendingSelection.size?'':'disabled'}>批量人员调整</button></div><div class="people-update-scroll pull-pending-table"><table><colgroup><col style="width:40px"><col style="width:110px"><col style="width:120px"><col style="width:240px"><col style="width:120px"><col style="width:180px"><col style="width:100px"><col style="width:160px"></colgroup><thead><tr><th><input type="checkbox" id="pull-pending-all" aria-label="全选待调整员工" ${rows.length&&rows.every(r=>pullPendingSelection.has(r.person))?'checked':''} ${rows.length?'':'disabled'}></th><th>员工</th><th>员工工号</th><th>部门</th><th>编制</th><th>当前职位</th><th>当前职级</th><th>操作</th></tr></thead><tbody>${rows.length?rows.map(row=>{const person=pullPendingPerson(row),arranged=plan.pendingArrangements[row.person];return `<tr><td><input type="checkbox" data-pull-pending-select="${esc(row.person)}" aria-label="勾选${esc(person.name)}" ${pullPendingSelection.has(row.person)?'checked':''}></td>${[person.name,person.no,orgPlan.path(row.org,plan.nextOrgs),row.code,row.job,person.grade].map(value=>`<td><span title="${esc(value)}">${esc(value)}</span></td>`).join('')}<td><div class="actions"><button class="text" data-pull-pending-adjust="${esc(row.person)}">人员调整</button>${arranged?`<button class="text" data-pull-pending-undo="${esc(row.person)}">取消调整</button>`:''}</div></td></tr>`;}).join(''):'<tr><td colspan="8" class="pull-group-empty">暂无待调整员工</td></tr>'}</tbody></table></div>`;
}
function openPullPendingEditor(ids){
 const plan=peoplePreviewPlan;if(!plan||!ids.length)return;
 pullPendingEditing=ids;const row=plan.pendingEmployees.find(r=>r.person===ids[0]),person=pullPendingPerson(row),saved=ids.length===1?plan.pendingArrangements[ids[0]]:null;
 $('#pull-pending-editor-title').textContent=ids.length>1?'批量人员调整':'人员调整';
 $('#pull-pending-identity').innerHTML=ids.length===1?[['姓名',person.name],['工号',person.no],['任职部门',orgPlan.path(row.org,plan.nextOrgs)],['任职职位',row.job]].map(([label,value])=>`<div><small>${label}</small><strong>${esc(value||'—')}</strong></div>`).join(''):'';
 $('#pull-pending-date').value=saved?.date||'';
 $('#pull-pending-dept').innerHTML='<option value="">请选择目标部门</option>'+plan.nextOrgs.filter(n=>pullPendingOrgActive(n.id)).map(n=>`<option value="${esc(n.id)}">${esc(orgPlan.path(n.id,plan.nextOrgs))}</option>`).join('');
 $('#pull-pending-dept').value=saved?.dept||'';$('#pull-pending-editor-error').textContent='';renderPullPendingTargets();
 if(saved)$('#pull-pending-targets select').value=saved.target;
 pullPendingEditor.showModal();
}
function renderPullPendingTargets(){
 const dept=$('#pull-pending-dept').value;
 $('#pull-pending-targets').innerHTML=pullPendingEditing.map(id=>{const row=peoplePreviewPlan.pendingEmployees.find(r=>r.person===id),person=pullPendingPerson(row);return `<label class="target-label"><span><em>*</em> ${pullPendingEditing.length>1?esc(person.name)+' · ':''}目标空编</span><select data-pull-pending-target="${esc(id)}" aria-label="${esc(person.name)}的目标空编" ${dept?'':'disabled'}><option value="">请选择目标空编</option>${pullPendingVacancies(dept,id).map(r=>`<option value="${esc(r.id)}">${esc(r.code+' · '+r.job+' · '+(r.grade||''))}</option>`).join('')}</select></label>`;}).join('');
}
$('#pull-pending-dept').onchange=renderPullPendingTargets;
$('#pull-pending-save').onclick=()=>{
 const plan=peoplePreviewPlan,date=$('#pull-pending-date').value,dept=$('#pull-pending-dept').value;
 const fail=text=>$('#pull-pending-editor-error').textContent=text;
 if(!date||!Number.isFinite(Date.parse(date)))return fail('请填写计划调动日期。');
 if(!pullPendingOrgActive(dept))return fail('请选择有效目标部门。');
 const used=new Set(),arrangements=[];
 for(const input of pullPendingEditor.querySelectorAll('[data-pull-pending-target]')){
  const id=input.dataset.pullPendingTarget,target=input.value;
  if(used.has(target)||!pullPendingVacancies(dept,id).some(r=>r.id===target))return fail('请为每位员工选择不同的有效空编。');
  used.add(target);arrangements.push([id,{date,dept,target}]);
 }
 for(const [id,value]of arrangements)plan.pendingArrangements[id]=value;
 pullPendingSelection.clear();pullPendingEditor.close();renderPeopleUpdatePreview();
};
function pullPendingNeedsAdjustment(row,plan){
 if(!row.person||row.deleted)return false;
 const stoppedOrgs=new Set(plan.orgStopped.map(n=>n.id)),seen=new Set();let id=row.org;
 while(id&&!seen.has(id)){seen.add(id);const org=plan.nextOrgs.find(n=>n.id===id);if(org?.disabled||stoppedOrgs.has(id))return true;id=org?.parent;}
 return plan.nextPositions.some(p=>p.org===row.org&&p.name===row.job&&(p.disabled||plan.positionStopped.some(s=>s.id===p.id)));
}
function handlePullPendingClick(event){
 const button=event.target.closest('button');if(!button)return false;
 if(button.id==='pull-pending-batch'){openPullPendingEditor([...pullPendingSelection]);return true;}
 const id=button.dataset.pullPendingAdjust;if(id){openPullPendingEditor([id]);return true;}
 const undo=button.dataset.pullPendingUndo;if(undo){delete peoplePreviewPlan.pendingArrangements[undo];renderPeopleUpdatePreview();return true;}
 return false;
}
$('#people-update-preview-body').addEventListener('change',event=>{
 if(!peoplePreviewPlan||peopleUpdateTab!=='pending')return;
 if(event.target.id==='pull-pending-all'){
  pullPendingSelection.clear();if(event.target.checked)peoplePreviewPlan.pendingEmployees.forEach(row=>pullPendingSelection.add(row.person));
 }else if(event.target.dataset.pullPendingSelect){
  const id=event.target.dataset.pullPendingSelect;if(event.target.checked)pullPendingSelection.add(id);else pullPendingSelection.delete(id);
 }else return;
 renderPeopleUpdatePreview();
});
function applyPullPendingArrangements(plan){
 const fail=message=>{peopleUpdateTab='pending';renderPeopleUpdatePreview();$('#people-update-preview-error').textContent=message;return false;};
 const used=new Set();
 for(const row of plan.pendingEmployees){
  const value=plan.pendingArrangements[row.person];
  if(!value)return fail('请先完成待调整员工的人员安排。');
  const target=plan.next.find(r=>r.id===value.target);
  if(!value.date||!pullPendingOrgActive(value.dept,plan)||!target||target.org!==value.dept||target.deleted||target.person||target.personOnly||!pullPendingPositionActive(target,plan)||used.has(target.id))return fail('目标编制已发生变化，请重新完成人员调整。');
  used.add(target.id);
 }
 if(!plan.pendingEmployees.length)return true;
 const next=clone(plan.next);
 for(const source of plan.pendingEmployees){
  const value=plan.pendingArrangements[source.person],row=next.find(r=>r.person===source.person),target=next.find(r=>r.id===value.target);
  if(!row)return fail('员工数据已发生变化，请重新拉取。');
  target.person=row.person;target.plannedTransferDate=value.date;
  for(const field of ['assignmentType','plannedEntryDate','actualPerson','planningGrade']){if(Object.hasOwn(row,field)){target[field]=row[field];delete row[field];}else delete target[field];}
  row.person=null;delete row.plannedTransferDate;row.transferStopDate=value.date;row.deleted=true;
 }
 plan.next=next;return true;
}
pullPendingEditor.addEventListener('input',()=>$('#pull-pending-editor-error').textContent='');
pullPendingEditor.addEventListener('change',()=>$('#pull-pending-editor-error').textContent='');
