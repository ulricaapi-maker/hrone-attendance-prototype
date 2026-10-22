/* Position retirement interactions. Binding uses the compact form in planning-views.js. */
const stopBody=$('#stop-position-dialog .modal-body');
stopBody.innerHTML=`<div class="planning-tabs stop-tabs" role="tablist" aria-label="停用职位安排"><button id="stop-people-tab" role="tab">人员</button><button id="stop-hcs-tab" role="tab">编制</button></div><div class="stop-tab-toolbar"><button id="stop-batch-person" class="primary" hidden>批量人员调整</button><button id="stop-batch-hc" hidden>批量编辑</button><button id="stop-batch-retire" hidden>批量停用</button><span id="stop-selected-count" class="muted"></span></div><div class="stop-scroll"><table id="stop-tab-table"><thead id="stop-tab-head"></thead><tbody id="stop-tab-body"></tbody></table></div><p id="stop-error" class="error" role="alert"></p>`;
$('#confirm-position-stop').textContent='确认停用职位';
const stopEdit=document.createElement('dialog');stopEdit.id='stop-edit-dialog';stopEdit.setAttribute('aria-labelledby','stop-edit-title');stopEdit.innerHTML=`<div class="modal-header"><h2 id="stop-edit-title">人员调整</h2><button class="close" data-close="stop-edit-dialog" aria-label="关闭本次安排">×</button></div><div class="modal-body"><p id="stop-edit-summary"></p><label class="target-label" id="stop-edit-mode-label">编制处理<select id="stop-edit-mode"><option value="carry">携带原编制</option><option value="target">使用目标部门编制</option></select></label><label class="target-label">目标部门 <select id="stop-edit-dept"></select></label><label class="target-label" id="stop-edit-target-label">目标职位<select id="stop-edit-target"></select></label><div id="stop-edit-mappings"></div><button class="text" id="stop-edit-new-position">新增目标职位</button><p class="small muted" id="stop-edit-note"></p><p class="error" id="stop-edit-error" role="alert"></p></div><div class="modal-footer"><button data-close="stop-edit-dialog">取消</button><button class="primary" id="stop-save-edit">确定</button></div>`;document.body.appendChild(stopEdit);
let stopTab='people',stopSelected=new Set(),stopEditing=null;
function stopRowRecord(row){return records.find(r=>r.id===row.id);}
function stopHcFree(row){return !row.person||row.personPlan?.mode==='target';}
function stopHcDone(row){return row.personPlan?.mode==='carry'||!!row.hcPlan;}
function stopResult(row,people){
 const plan=people?row.personPlan:row.personPlan?.mode==='carry'?row.personPlan:row.hcPlan;
 if(!plan)return people?'尚未安排':stopHcFree(row)?'尚未安排':'请先调整人员';
 if(plan.mode==='stop')return '将停用';
 const target=plan.mode==='target'?records.find(r=>r.id===plan.target):positions.concat(stopState.newPositions).find(p=>p.id===plan.target);
 return plan.mode==='target'?`${formatOrg(plan.dept)} / ${target?.code||''}`:`${formatOrg(plan.dept)} / ${target?.name||''}`;
}
openPositionStop=function(id){
 const p=positions.find(p=>p.id===id);if(!p||p.disabled||!activeOrg(p.org))return;
 const rows=records.filter(r=>!r.deleted&&r.org===p.org&&r.job===p.name);
 if(!rows.some(r=>r.person)){const before=snapshot();rows.forEach(r=>r.deleted=true);p.disabled=true;recordAction('停用职位',before);render();if($('#position-list').open)renderPositions();notify('职位已停用');return;}
 stopState={positionId:id,newPositions:[],rows:rows.map(r=>({id:r.id,person:r.person||null,personPlan:null,hcPlan:null}))};stopTab='people';stopEditing=null;stopSelected.clear();
 $('#stop-position-title').textContent='停用职位 · '+p.name;$('#stop-error').textContent='';renderStopRows();open('stop-position-dialog');
};
renderStopRows=function(){
 if(!stopState)return;stopTab='people';$('#stop-hcs-tab').hidden=true;const p=positions.find(p=>p.id===stopState.positionId),people=stopState.rows.filter(r=>r.person),rows=stopTab==='people'?people:stopState.rows;

 for(const [id,tab,count]of [['stop-people-tab','people',people.length],['stop-hcs-tab','hcs',stopState.rows.length]]){const el=$('#'+id);el.textContent=(tab==='people'?'人员':'编制')+'（'+count+'）';el.classList.toggle('active',stopTab===tab);el.setAttribute('aria-selected',String(stopTab===tab));}
 const picked=rows.filter(r=>stopSelected.has(r.id));$('.stop-tab-toolbar').hidden=false;$('#stop-batch-person').hidden=stopTab!=='people';$('#stop-batch-person').disabled=!picked.length;$('#stop-batch-hc').hidden=true;$('#stop-batch-hc').disabled=!picked.length;$('#stop-batch-retire').hidden=stopTab!=='hcs';$('#stop-batch-retire').disabled=!picked.length;$('#stop-selected-count').textContent=picked.length?`已选${picked.length}条`:'';
 const headers=stopTab==='people'?['员工','员工工号','占用编制','当前职级','安排结果','操作']:['编制编码','员工','编制职级','编制工作地点','安排结果','操作'];
 $('#stop-tab-head').innerHTML='<tr><th><input type="checkbox" id="stop-tab-all" aria-label="全选当前安排列表"></th>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr>';
 $('#stop-tab-body').innerHTML=rows.map(row=>{const r=stopRowRecord(row),person=STAFF_DEMO.find(p=>p.id===row.person),editable=stopTab==='people'||stopHcFree(row);
 const values=stopTab==='people'?[person?.name,person?.no,r.code,person?.grade]:[r.code,stopHcFree(row)?'空编':person?.name,r.grade,r.place];
 const actions=stopTab==='people'?`<button class="text" data-stage-person="${row.id}">人员调整</button>${row.personPlan?`<button class="text" data-stage-undo-person="${row.id}">取消调整</button>`:''}`:row.hcPlan?.mode==='stop'?`<button class="text" data-stage-undo-hc="${row.id}">取消停用</button>`:editable?`<button class="text" data-stage-stop="${row.id}">停用</button>${row.hcPlan?`<button class="text" data-stage-undo-hc="${row.id}">${row.hcPlan.mode==='stop'?'取消停用':'取消调整'}</button>`:''}`:`<span class="muted">${row.personPlan?.mode==='carry'?'随人员调整':'从人员页签调整'}</span>`;
 return `<tr class="${row.hcPlan?.mode==='stop'&&stopTab==='hcs'?'stage-stopped':''}"><td><input type="checkbox" data-stage-select="${row.id}" aria-label="勾选${esc(stopTab==='people'?person?.name:r.code)}" ${editable&&!(stopTab==='hcs'&&row.hcPlan?.mode==='stop')?'':'disabled'} ${stopSelected.has(row.id)?'checked':''}></td>${values.map(v=>`<td><span class="cell-text" title="${esc(v)}">${esc(v)||'—'}</span></td>`).join('')}<td><span class="cell-text ${((stopTab==='people'?row.personPlan:stopHcDone(row))?'stage-ready':'muted')}" title="${esc(stopResult(row,stopTab==='people'))}">${esc(stopResult(row,stopTab==='people'))}</span></td><td><div class="actions">${actions}</div></td></tr>`;}).join('')||`<tr><td colspan="7" class="empty">该职位下没有${stopTab==='people'?'人员':'编制'}</td></tr>`;
 const selectable=rows.filter(r=>stopTab==='people'||stopHcFree(r)&&r.hcPlan?.mode!=='stop');$('#stop-tab-all').checked=!!selectable.length&&selectable.every(r=>stopSelected.has(r.id));
};
function switchStopTab(tab){stopTab=tab;stopSelected.clear();$('#stop-error').textContent='';renderStopRows();}
$('#stop-people-tab').onclick=()=>switchStopTab('people');$('#stop-hcs-tab').onclick=()=>switchStopTab('hcs');
$('#stop-tab-table').onchange=e=>{if(e.target.id==='stop-tab-all'){stopState.rows.filter(r=>(stopTab==='people'?r.person:stopHcFree(r)&&r.hcPlan?.mode!=='stop')).forEach(r=>e.target.checked?stopSelected.add(r.id):stopSelected.delete(r.id));}else if(e.target.dataset.stageSelect){e.target.checked?stopSelected.add(e.target.dataset.stageSelect):stopSelected.delete(e.target.dataset.stageSelect);}renderStopRows();};
function openStopEditor(ids,kind){
 stopEditing={ids,kind};const row=stopState.rows.find(r=>r.id===ids[0]),old=kind==='people'?row.personPlan:row.hcPlan;
 $('#stop-edit-title').textContent=(ids.length>1?'批量':'')+(kind==='people'?'人员调整':'编辑编制');$('#stop-edit-summary').textContent=kind==='people'?`已选${ids.length}名员工`:`已选${ids.length}份空编`;
 $('#stop-edit-mode-label').hidden=kind!=='people';$('#stop-edit-mode').value=kind==='people'&&old?.mode==='target'?'target':'carry';$('#stop-edit-dept').innerHTML='<option value="">请选择目标部门</option>'+orgOptions();$('#stop-edit-dept').value=old?.dept||'';$('#stop-edit-error').textContent='';fillStopEditor(old?.target);open('stop-edit-dialog');
}
function fillStopEditor(value){
 if(!stopEditing||!stopState)return;const mode=stopEditing.kind==='people'?$('#stop-edit-mode').value:'move',dept=$('#stop-edit-dept').value,using=mode==='target';
 $('#stop-edit-target-label').hidden=using;$('#stop-edit-mappings').hidden=!using;$('#stop-edit-new-position').hidden=using;
 $('#stop-edit-target').innerHTML=stopChoiceOptions('carry',dept);$('#stop-edit-target').value=value||'';
 if(using){const reserved=new Set(stopState.rows.filter(r=>!stopEditing.ids.includes(r.id)&&r.personPlan?.mode==='target').map(r=>r.personPlan.target));
 $('#stop-edit-mappings').innerHTML=stopEditing.ids.map(id=>{const row=stopState.rows.find(r=>r.id===id),person=STAFF_DEMO.find(p=>p.id===row.person);return `<label class="target-label">${esc(person?.name)}的目标编制<select data-stage-target="${id}" aria-label="${esc(person?.name)}的目标编制"><option value="">请选择空编</option>${stopVacancies(dept).filter(h=>!reserved.has(h.id)).map(h=>`<option value="${h.id}">${esc(h.code)} · ${esc(h.job)} · ${esc(h.grade)}</option>`).join('')}</select></label>`;}).join('');
 for(const id of stopEditing.ids){const plan=stopState.rows.find(r=>r.id===id).personPlan;if(plan?.dept===dept&&plan.mode==='target')$(`[data-stage-target="${id}"]`).value=plan.target;}
 }
 $('#stop-edit-note').hidden=true;$('#stop-edit-note').textContent='';
}
$('#stop-edit-dept').onchange=()=>fillStopEditor();$('#stop-edit-mode').onchange=()=>fillStopEditor();
$('#stop-edit-new-position').onclick=()=>{const dept=$('#stop-edit-dept').value;if(!activeOrg(dept)){notify('请先选择目标部门');return;}openPosition(dept,'stop');};
fillStopBulk=function(){};fillSimpleStopTarget=function(value){if(stopEditing)fillStopEditor(value);};
$('#stop-save-edit').onclick=()=>{
 const dept=$('#stop-edit-dept').value,mode=stopEditing.kind==='people'?$('#stop-edit-mode').value:'move',target=$('#stop-edit-target').value;
 const fail=t=>{$('#stop-edit-error').textContent=t;};if(!activeOrg(dept))return fail('请选择有效目标部门。');
 const planned=stopEditing.ids.map(id=>({id,mode,dept,target:mode==='target'?$(`[data-stage-target="${id}"]`).value:target}));
 const reserved=new Set(stopState.rows.filter(r=>!stopEditing.ids.includes(r.id)&&r.personPlan?.mode==='target').map(r=>r.personPlan.target));
 for(const plan of planned){if(mode==='target'){if(!stopVacancies(dept).some(h=>h.id===plan.target)||reserved.has(plan.target))return fail('每位员工请选择不同的有效空编。');reserved.add(plan.target);}else if(!stopPositions(dept).some(p=>p.id===plan.target))return fail('请选择有效目标职位。');}
 for(const plan of planned){const row=stopState.rows.find(r=>r.id===plan.id);if(stopEditing.kind==='people'){row.personPlan=plan;row.hcPlan=null;}else row.hcPlan=plan;}
 $('#stop-edit-dialog').close();stopSelected.clear();$('#stop-error').textContent='';renderStopRows();
};
$('#stop-tab-body').onclick=e=>{const d=e.target.closest('button')?.dataset;if(!d)return;
 if(d.stagePerson)openStopEditor([d.stagePerson],'people');if(d.stageHc)openStopEditor([d.stageHc],'hcs');
 if(d.stageStop){stopState.rows.find(r=>r.id===d.stageStop).hcPlan={mode:'stop'};stopSelected.delete(d.stageStop);renderStopRows();}
 if(d.stageUndoPerson){const row=stopState.rows.find(r=>r.id===d.stageUndoPerson);row.personPlan=null;row.hcPlan=null;renderStopRows();}
 if(d.stageUndoHc){stopState.rows.find(r=>r.id===d.stageUndoHc).hcPlan=null;renderStopRows();}
};
$('#stop-batch-person').onclick=()=>openStopEditor([...stopSelected],'people');$('#stop-batch-hc').onclick=()=>openStopEditor([...stopSelected],'hcs');$('#stop-batch-retire').onclick=()=>{stopState.rows.filter(r=>stopSelected.has(r.id)&&stopHcFree(r)).forEach(r=>r.hcPlan={mode:'stop'});stopSelected.clear();renderStopRows();};
$('#confirm-position-stop').onclick=()=>{
 if(!stopState)return;const p=positions.find(p=>p.id===stopState.positionId),current=records.filter(r=>!r.deleted&&r.org===p.org&&r.job===p.name),fail=t=>{$('#stop-error').textContent=t;};
 if(current.length!==stopState.rows.length||current.some(r=>!stopState.rows.some(row=>row.id===r.id&&row.person===(r.person||null))))return fail('关联数据已变化，请关闭后重新安排。');
 if(stopState.rows.some(r=>r.person&&!r.personPlan)){switchStopTab('people');return fail('请先完成全部人员安排。');}
 const used=new Set();for(const row of stopState.rows){for(const plan of [row.personPlan,row.hcPlan].filter(Boolean)){if(plan.mode==='stop')continue;if(!activeOrg(plan.dept))return fail('目标部门已不可用。');if(plan.mode==='target'){if(used.has(plan.target)||!stopVacancies(plan.dept).some(h=>h.id===plan.target))return fail('目标空编不可用或被重复安排。');used.add(plan.target);}else if(!stopPositions(plan.dept).some(p=>p.id===plan.target))return fail('目标职位已不可用。');}}
 const before=snapshot();positions.push(...clone(stopState.newPositions));
 for(const row of stopState.rows){const r=stopRowRecord(row),plan=row.personPlan;if(plan?.mode==='target'){records.find(h=>h.id===plan.target).person=r.person;r.person=null;}else if(plan?.mode==='carry'){const target=positions.find(p=>p.id===plan.target);Object.assign(r,{org:target.org,job:target.name});}
 if(plan?.mode!=='carry')r.deleted=true;
 }
 p.disabled=true;recordAction('停用职位',before);$('#stop-position-dialog').close();stopSelected.clear();render();if($('#position-list').open)renderPositions();notify('职位已停用，人员已调整');stopState=null;
};

// Retain field constraints and real consequences, remove repeated operation explanations.
$('#transfer-note').hidden=true;
const mappingsBeforeCleanup=renderMappings;
renderMappings=function(){mappingsBeforeCleanup();$('#transfer-note').hidden=true;};
rangeInfo=function(){$('#hc-range').textContent='';$('#hc-range').hidden=true;};
render();
