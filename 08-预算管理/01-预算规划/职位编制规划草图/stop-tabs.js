/* Stage personnel arrangements before confirming a position or organization action. */
const stopDialog = $('#stop-position-dialog');
stopDialog.querySelector('.modal-body').innerHTML = `
 <p id="stop-org-hint" class="muted" hidden>请先处理该组织下的员工</p>
 <div class="planning-tabs stop-tabs" role="tablist" aria-label="人员"><button id="stop-people-tab" class="active" role="tab" aria-selected="true" aria-controls="stop-people-list">人员（0）</button></div>
 <div class="stop-tab-toolbar" id="stop-toolbar"><button id="stop-batch-person">批量人员调整</button></div>
 <div class="stop-scroll" id="stop-people-list"><table><thead><tr>
 <th><input type="checkbox" id="stop-tab-all" aria-label="全选员工"></th>
 <th>员工</th><th>员工工号</th><th id="stop-org-column" hidden>部门</th><th>编制</th><th>当前职级</th><th>操作</th>
 </tr></thead><tbody id="stop-tab-body"></tbody></table></div>
 <p id="stop-error" class="error" role="alert"></p>`;
$('#confirm-position-stop').classList.remove('primary');

const stopEdit = document.createElement('dialog');
stopEdit.id = 'stop-edit-dialog';
stopEdit.setAttribute('aria-labelledby', 'stop-edit-title');
stopEdit.innerHTML = `
 <div class="modal-header"><h2 id="stop-edit-title">人员调整</h2><button class="close" data-close="stop-edit-dialog" aria-label="关闭人员调整">×</button></div>
 <div class="modal-body">
 <div id="stop-edit-summary" class="info-grid"></div>
 <div class="retirement-fields">
 <label class="target-label"><span><em>*</em> 计划调动日期</span><input type="date" id="stop-edit-date" required></label>
 <label class="target-label"><span><em>*</em> 目标部门</span><select id="stop-edit-dept" required></select></label>
 <fieldset class="retirement-modes"><legend>编制处理</legend>
 <label><input type="radio" name="stop-edit-mode" value="carry" checked> 携带原编制</label>
 <label><input type="radio" name="stop-edit-mode" value="target"> 使用目标部门编制</label>
 </fieldset></div>
 <label class="target-label" id="stop-edit-target-label"><span><em>*</em> 目标职位</span><select id="stop-edit-target"></select></label>
 <div id="stop-edit-mappings"></div>
 <button class="text" id="stop-edit-new-position">新增目标职位</button>
 <p id="stop-edit-note" class="retirement-impact">员工使用目标编制后，原编制自计划调动月份起自动停用。</p>
 <p class="error" id="stop-edit-error" role="alert"></p></div>
 <div class="modal-footer"><button data-close="stop-edit-dialog">取消</button><button class="primary" id="stop-save-edit">确认调整</button></div>`;
document.body.appendChild(stopEdit);

const stopSelected = new Set();
let stopEditing = null;
let orgActionBridge = null;

const stopActionLabels = {
 positionStop: {title:'停用职位', confirm:'确认停用职位', done:'职位已停用'},
 positionRemove: {title:'取消新增职位', confirm:'确认取消新增', done:'已取消新增职位'},
 orgStop: {title:'停用组织', confirm:'确认', done:'组织已停用'},
 orgRemove: {title:'取消新增组织', confirm:'确认取消新增', done:'已取消新增组织'}
};

function stopActionRecords(state) {
 if (state.orgId) return records.filter(r => !r.deleted && state.orgIds.has(r.org));
 const p = positions.find(item => item.id === state.positionId);
 return p ? records.filter(r => !r.deleted && r.org === p.org && r.job === p.name) : [];
}

function beginStopAction(kind, id) {
 const isOrg = kind.startsWith('org');
 const item = isOrg ? orgPlan.get(id) : positions.find(p => p.id === id);
 if (!item || item.disabled || (!isOrg && !activeOrg(item.org))) return false;
 if (kind === 'positionRemove' && originalPositionIds.has(id)) return false;
 if (kind === 'orgRemove' && (orgPlan.original(id) || orgPlan.descendants(id).length)) return false;
 stopState = {kind, positionId:isOrg ? null : id, orgId:isOrg ? id : null,
  orgIds:new Set(isOrg ? [id, ...orgPlan.descendants(id).map(n => n.id)] : []), newPositions:[], rows:[]};
 stopState.rows = stopActionRecords(stopState).map(r => ({id:r.id, person:r.person || null, personPlan:null}));
 stopSelected.clear();
 stopEditing = null;
 const labels = stopActionLabels[kind];
 $('#stop-position-title').textContent = labels.title + ' · ' + item.name;
 $('#confirm-position-stop').textContent = labels.confirm;
 $('#stop-error').textContent = '';
 renderStopRows();
 open(stopDialog.id);
 return true;
}

openPositionStop = id => beginStopAction('positionStop', id);
const positionActionBeforePersonnel = handlePositionAction;
handlePositionAction = function(action) {
 if (!action.cancelPosition) return positionActionBeforePersonnel(action);
 beginStopAction('positionRemove', action.cancelPosition);
 return true;
};

stopPositions = function(org) {
 if (!activeOrg(org) || stopState.orgIds.has(org)) return [];
 return positions.concat(stopState.newPositions).filter(p => p.org === org && !p.disabled && p.id !== stopState.positionId);
};
stopVacancies = function(org) {
 const availableJobs = new Set(stopPositions(org).map(p => p.name));
 const sourceIds = new Set(stopState.rows.map(r => r.id));
 return records.filter(r => r.org === org && !r.person && !r.deleted && !sourceIds.has(r.id)
  && !pending(r) && availableJobs.has(r.job));
};

renderStopRows = function() {
 if (!stopState) return;
 const people = stopState.rows.filter(r => r.person);
 const isOrgStop = stopState.kind === 'orgStop';
 $('#stop-people-tab').textContent = `人员（${people.length}）`;
 $('#stop-org-hint').hidden = !isOrgStop || !people.length;
 $('#stop-org-column').hidden = !isOrgStop;
 $('#stop-people-list').classList.toggle('with-department', isOrgStop);
 $('#stop-batch-person').disabled = !stopSelected.size;
 $('#stop-tab-all').disabled = !people.length;
 $('#stop-tab-all').checked = !!people.length && people.every(r => stopSelected.has(r.id));
 $('#stop-tab-all').indeterminate = stopSelected.size > 0 && stopSelected.size < people.length;
 $('#stop-tab-body').innerHTML = people.map(row => {
  const r = records.find(item => item.id === row.id);
  const person = staff(r);
  return `<tr><td><input type="checkbox" data-stage-select="${esc(row.id)}" aria-label="勾选${esc(person?.name || r.code)}" ${stopSelected.has(row.id) ? 'checked' : ''}></td>
    <td>${esc(person?.name || row.person)}</td><td>${esc(person?.no || '—')}</td>${isOrgStop ? `<td>${esc(formatOrg(r.org))}</td>` : ''}<td>${esc(r.code)}</td><td>${esc(person?.grade || '—')}</td>
    <td><div class="actions"><button class="text" data-stage-person="${esc(row.id)}">人员调整</button>
    ${row.personPlan ? `<button class="text" data-stage-undo-person="${esc(row.id)}">取消调整</button>` : ''}</div></td></tr>`;
 }).join('');
};

function stopEditorMode() {
 return stopEdit.querySelector('input[name="stop-edit-mode"]:checked').value;
}

function openStopEditor(ids, batch = false) {
 if (!ids.length) return;
 stopEditing = {ids, batch};
 const r = records.find(item => item.id === ids[0]);
 const person = staff(r);
 const old = batch ? null : stopState.rows.find(row => row.id === r.id).personPlan;
 stopEdit.classList.toggle('retirement-batch', batch);
 $('#stop-edit-title').textContent = batch ? '批量人员调整' : '人员调整';
 const sourceDept = orgPlan.path(person?.org, orgPlan.baseline) || formatOrg(r.org);
 $('#stop-edit-summary').innerHTML = batch ? '' : [['姓名',person?.name],['工号',person?.no],['任职部门',sourceDept],['任职职位',person?.job || r.job]].map(([key,val]) =>
  `<div><small>${key}</small><strong>${esc(val || '—')}</strong></div>`).join('');
 $('#stop-edit-date').value = old?.date || '';
 stopEdit.querySelector(`input[name="stop-edit-mode"][value="${old?.mode || 'carry'}"]`).checked = true;
 $('#stop-edit-dept').innerHTML = '<option value="">请选择目标部门</option>' + orgPlan.nodes
  .filter(n => activeOrg(n.id) && !stopState.orgIds.has(n.id))
  .map(n => `<option value="${esc(n.id)}">${esc(orgPlan.path(n.id))}</option>`).join('');
 $('#stop-edit-dept').value = old?.dept || '';
 fillStopEditor(old?.target, old);
 open(stopEdit.id);
}

function fillStopEditor(position, previousPlan) {
 if (!stopEditing || !stopState) return;
 const mode = stopEditorMode();
 const dept = $('#stop-edit-dept').value;
 const useTarget = mode === 'target';
 const showMappings = stopEditing.batch || useTarget;
 $('#stop-edit-error').textContent = '';
 $('#stop-edit-target-label').hidden = showMappings;
 $('#stop-edit-target').disabled = !dept;
 $('#stop-edit-target').innerHTML = '<option value="">请选择目标职位</option>' +
  stopPositions(dept).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
 $('#stop-edit-target').value = position || '';
 $('#stop-edit-new-position').hidden = useTarget;
 $('#stop-edit-new-position').disabled = !dept;
 $('#stop-edit-mappings').hidden = !showMappings;
 $('#stop-edit-note').hidden = !useTarget;
 if (!showMappings) return;

 const reserved = new Set(stopState.rows.filter(r => !stopEditing.ids.includes(r.id) && r.personPlan?.mode === 'target')
  .map(r => r.personPlan.target));
 const options = useTarget
  ? stopVacancies(dept).filter(r => !reserved.has(r.id)).map(r => [r.id, `${r.code} · ${r.job} · ${r.grade}`])
  : stopPositions(dept).map(p => [p.id,p.name]);
 const optionHtml = '<option value="">请选择' + (useTarget ? '目标部门空编制' : '目标职位') + '</option>' +
  options.map(([id,label]) => `<option value="${esc(id)}">${esc(label)}</option>`).join('');
 $('#stop-edit-mappings').innerHTML = `<table><thead><tr><th>员工</th><th>原职位</th><th>${useTarget ? '目标编制' : '目标职位'}</th></tr></thead><tbody>${
  stopEditing.ids.map(id => {
   const r = records.find(item => item.id === id);
   const person = staff(r);
   return `<tr><td><strong>${esc(person?.name || r.person)}</strong><small>${esc(person?.no || '—')} / ${esc(r.code)}</small></td>
    <td>${esc(r.job)}</td><td><select data-stage-target="${esc(id)}" aria-label="${esc(person?.name || r.code)}的${useTarget ? '目标编制' : '目标职位'}" ${dept ? '' : 'disabled'}>${optionHtml}</select></td></tr>`;
  }).join('')}</tbody></table>`;
 for (const select of stopEdit.querySelectorAll('[data-stage-target]')) {
  if (previousPlan?.dept === dept && previousPlan.mode === mode) select.value = previousPlan.target;
 }
}

$('#stop-edit-dept').onchange = () => fillStopEditor();
stopEdit.querySelector('.retirement-modes').onchange = () => fillStopEditor();
$('#stop-edit-new-position').onclick = () => {
 const dept = $('#stop-edit-dept').value;
 if (activeOrg(dept) && !stopState.orgIds.has(dept)) openPosition(dept, 'stop');
};
fillStopBulk = function() {};
fillSimpleStopTarget = function(value) {
 if (!stopEditing) return;
 const prior = new Map([...stopEdit.querySelectorAll('[data-stage-target]')].map(select => [select.dataset.stageTarget, select.value]));
 fillStopEditor(value);
 for (const select of stopEdit.querySelectorAll('[data-stage-target]')) select.value = prior.get(select.dataset.stageTarget) || value;
};

function validateStopPlan(plan, reserved) {
 if (!plan?.date) return '请填写计划调动日期。';
 if (!activeOrg(plan.dept) || stopState.orgIds.has(plan.dept)) return '请选择有效目标部门。';
 if (plan.mode === 'target') {
  if (reserved.has(plan.target) || !stopVacancies(plan.dept).some(r => r.id === plan.target)) return '请为每位员工选择不同的有效空编制。';
  reserved.add(plan.target);
 } else if (!stopPositions(plan.dept).some(p => p.id === plan.target)) return '请选择有效目标职位。';
 return '';
}

$('#stop-save-edit').onclick = () => {
 const date = $('#stop-edit-date').value;
 const dept = $('#stop-edit-dept').value;
 const mode = stopEditorMode();
 const planned = stopEditing.ids.map(id => {
  const mapping = [...stopEdit.querySelectorAll('[data-stage-target]')].find(select => select.dataset.stageTarget === id);
  return {id, date, dept, mode, target:mode === 'target' || stopEditing.batch ? mapping?.value : $('#stop-edit-target').value};
 });
 const used = new Set(stopState.rows.filter(row => !stopEditing.ids.includes(row.id) && row.personPlan?.mode === 'target')
  .map(row => row.personPlan.target));
 for (const plan of planned) {
  const error = validateStopPlan(plan, used);
  if (error) { $('#stop-edit-error').textContent = error; return; }
 }
 for (const plan of planned) stopState.rows.find(r => r.id === plan.id).personPlan = plan;
 stopEdit.close();
 stopSelected.clear();
 $('#stop-error').textContent = '';
 renderStopRows();
};

$('#stop-tab-all').onchange = event => {
 stopSelected.clear();
 if (event.target.checked) stopState.rows.filter(r => r.person).forEach(r => stopSelected.add(r.id));
 renderStopRows();
};
$('#stop-tab-body').onchange = event => {
 const id = event.target.dataset.stageSelect;
 if (!id) return;
 if (event.target.checked) stopSelected.add(id);
 else stopSelected.delete(id);
 renderStopRows();
};
$('#stop-tab-body').onclick = event => {
 const data = event.target.closest('button')?.dataset;
 if (data?.stagePerson) openStopEditor([data.stagePerson]);
 if (data?.stageUndoPerson) {
  stopState.rows.find(r => r.id === data.stageUndoPerson).personPlan = null;
  renderStopRows();
 }
};
$('#stop-batch-person').onclick = () => openStopEditor([...stopSelected], true);

function applyStopAction() {
 const state = stopState;
 const fail = message => { $('#stop-error').textContent = message; };
 const current = stopActionRecords(state);
 if (current.length !== state.rows.length || current.some(r => !state.rows.some(row => row.id === r.id && row.person === (r.person || null)))) {
  return fail('关联数据已变化，请关闭后重新安排。');
 }
 const people = state.rows.filter(row => row.person);
 if (people.some(row => !row.personPlan)) return fail('请先完成全部人员调整。');
 const used = new Set();
 for (const row of people) {
  const error = validateStopPlan(row.personPlan, used);
  if (error) return fail(error);
 }
 const before = snapshot();
 const kind = state.kind;
 const labels = stopActionLabels[kind];
 const stagedPositions = new Set(people.filter(row => row.personPlan.mode === 'carry').map(row => row.personPlan.target));
 positions.push(...state.newPositions.filter(p => stagedPositions.has(p.id)));
 for (const row of state.rows) {
  const r = records.find(item => item.id === row.id);
  const plan = row.personPlan;
  if (plan?.mode === 'carry') {
   const target = positions.find(p => p.id === plan.target);
   Object.assign(r, {org: target.org, job: target.name, plannedTransferDate:plan.date});
   continue;
  }
  if (plan?.mode === 'target') {
   const target = records.find(item => item.id === plan.target);
   target.person = r.person;
   target.plannedTransferDate = plan.date;
   for (const field of ['assignmentType', 'plannedEntryDate']) {
    if (r[field]) target[field] = r[field];
    else delete target[field];
    delete r[field];
   }
   r.person = null;
   delete r.plannedTransferDate;
   r.transferStopDate = plan.date;
   r.deleted = true;
  } else if (kind !== 'orgStop') {
   r.deleted = true;
  }
 }
 if (kind === 'positionStop') positions.find(p => p.id === state.positionId).disabled = true;
 if (kind === 'positionRemove') positions = positions.filter(p => p.id !== state.positionId);
 if (kind === 'orgRemove') positions = positions.filter(p => !state.orgIds.has(p.org));

 if (state.orgId) {
  try {
   const nextSelectedOrg = kind === 'orgRemove' && state.orgIds.has(selectedOrg)
    ? orgPlan.get(state.orgId).parent : selectedOrg;
   orgActionBridge.commit(JSON.stringify({records, positions, selectedOrg:nextSelectedOrg,
    bindingTransfers, staffingView, adjustmentHistory}));
  } catch (error) {
   records = before.records;
   positions = before.positions;
   return fail(error.message);
  }
  return;
 }
 recordAction(labels.title, before);
 stopSelected.clear();
 stopDialog.close();
 render();
 if ($('#position-list').open) renderPositions();
 notify(labels.done);
}

$('#confirm-position-stop').onclick = applyStopAction;

if (new URLSearchParams(location.search).has('organization-personnel')) {
 document.body.classList.add('organization-personnel-frame');
 try {
  orgActionBridge = parent.organizationPersonnelAction(window);
  orgPlan.nodes = orgActionBridge.nodes;
  stopDialog.addEventListener('close', orgActionBridge.close);
  if (!beginStopAction(orgActionBridge.kind, orgActionBridge.id)) orgActionBridge.close();
 } catch (error) {
  document.body.classList.remove('organization-personnel-frame');
  notify(error.message);
 }
}

$('#transfer-note').hidden = true;
const mappingsBeforeCleanup = renderMappings;
renderMappings = function() { mappingsBeforeCleanup(); $('#transfer-note').hidden = true; };
rangeInfo = function() { $('#hc-range').textContent = ''; $('#hc-range').hidden = true; };
render();
