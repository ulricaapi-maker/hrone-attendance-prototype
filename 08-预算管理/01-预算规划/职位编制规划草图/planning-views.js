/* Two perspectives on the same occupied/vacant headcount records. */
let planningTab='headcounts';
let bindingTargetId=null,bindingSourceId=null;
const sourceColumns=columns.map(c=>c.slice());
const headcountColumns=[['check','',36],['code','编制编码',140],['name','员工',205],['job','编制职位',210],['grade','编制职级',100],['occupancy','编制在岗状态',100],['overseas','是否海外编制',120],['place','编制工作地点',195],['arrival','预计到岗时间',120],['org','规划部门',180],['actions','操作',430]];
const employeeColumns=[['check','',36],['name','员工姓名',220],['code','编制',150],['job','规划职位',210],['personGrade','人员计划职级',120],['grade','编制职级',100],['employeeNo','员工工号',110],['org','规划部门',180],['actions','操作',185]];
const beforeViewRender=render,beforeViewCell=cell,beforeViewDataValue=dataValue,beforeViewVisibleRows=visibleRows,beforeViewSticky=sticky;

dataValue=function(r,key){
 if(key==='occupancy')return r.deleted?'已停用':r.person?'在职':'空编';
 if(key==='employeeNo')return staff(r)?.no||'';
 if(key==='personGrade')return staff(r)?.grade||'';
 return beforeViewDataValue(r,key);
};
visibleRows=function(){const rows=beforeViewVisibleRows();return sourceView()||planningTab==='headcounts'?rows:rows.filter(r=>r.person&&!r.deleted);};
sticky=function(key){

 if(key==='check')return 'sticky-check check';
 if(key==='code'&&planningTab==='headcounts')return 'sticky-code';
 if(key==='name'&&planningTab==='people')return 'sticky-name';
 if(key==='actions')return 'sticky-action';
 return '';
};
cell=function(r,key){

 if(key==='code')return `<button class="text name-link" data-detail="${esc(r.id)}" title="${esc(r.code)}">${esc(r.code)}</button>${r.deleted?'<small class="stopped-chip">已停用</small>':''}`;
 if(key==='name')return r.person?`<button class="text name-link" data-detail="${esc(r.id)}" title="${esc(staff(r)?.name)}">${esc(staff(r)?.name)}</button>`:'<span class="vacant-label">空编</span>';
 if(key==='occupancy')return `<span class="occupancy-chip ${r.deleted?'off':r.person?'occupied':'vacant'}">${dataValue(r,key)}</span>`;
 if(key==='actions'&&planningTab==='people')return beforeViewCell(r,key);
 if(key==='actions'&&r.person)return `<div class="actions"><button class="text" data-edit="${esc(r.id)}">编辑</button><button class="text" data-copy="${esc(r.id)}">复制</button><button class="text" data-adjust="${esc(r.id)}">人员调整</button>${changed(r)?`<button class="text" data-undo="${esc(r.id)}">取消调整</button>`:''}</div>`;
 if(key==='actions'&&!r.deleted){const previous=beforeViewCell(r,key);return previous.replace('<div class="actions">',`<div class="actions"><button class="text" data-bind-person="${esc(r.id)}">绑定人员</button>`);}
 return beforeViewCell(r,key);
};

render=function(){
 const source=false;
 staffingView=!source&&planningTab==='headcounts'&&$('#group-headcounts').checked?'grouped':'flat';
 const activeColumns=source?sourceColumns:planningTab==='headcounts'?headcountColumns:employeeColumns;
 columns.splice(0,columns.length,...activeColumns.map(c=>c.slice()));
 beforeViewRender();
 $('#staffing-views').hidden=true;
 $('#planning-tabs').hidden=source;
 $('#headcount-display-tools').hidden=source||planningTab!=='headcounts';
 if(!source)$('#plan-table').style.setProperty('--name-left','36px');
 $('#plan-table').style.setProperty('--code-left','36px');
 const all=rowScope().filter(r=>!r.deleted),occupied=all.filter(r=>r.person),vacant=all.filter(r=>!r.person);
 $('#headcount-tab').textContent=`编制列表（${all.length}）`;
 $('#people-tab').textContent=`人员列表（${occupied.length}）`;
 $('#headcount-tab').classList.toggle('active',planningTab==='headcounts');
 $('#people-tab').classList.toggle('active',planningTab==='people');
 $('#headcount-tab').setAttribute('aria-selected',String(planningTab==='headcounts'));
 $('#people-tab').setAttribute('aria-selected',String(planningTab==='people'));
 $('#occupancy-summary').textContent=`在职 ${occupied.length} · 空编 ${vacant.length}`;
 $('#headcount-view-hint').textContent=staffingView==='grouped'?'取消勾选切换为列表视图':'当前为列表视图';
 if(!source){
  $('#add-position').hidden=planningTab!=='headcounts';
  $('#add-hc').hidden=planningTab!=='headcounts';
  $('#positions').hidden=false;
  if(planningTab==='people'){$('#edit-hc').hidden=true;$('#batch-vacancy-tools').hidden=true;}
  const stopped=rowScope().filter(r=>r.deleted).length;
  $('#row-count').textContent=planningTab==='people'?`共 ${visibleRows().length} 名员工`:`共 ${visibleRows().length} 条编制记录${stopped?`（含已停用 ${stopped} 条）`:''}`;
  if(planningTab==='people'&&!visibleRows().length)$('#table-body').innerHTML=`<tr><td colspan="${columns.length}" class="empty">当前部门暂无已安排员工</td></tr>`;
 }
};
function switchPlanningTab(tab){planningTab=tab;selected.clear();filters={};closeFilter();$('.table-scroll').scrollLeft=0;render();}
$('#headcount-tab').onclick=()=>switchPlanningTab('headcounts');
$('#people-tab').onclick=()=>switchPlanningTab('people');
$('#group-headcounts').onchange=()=>{selected.clear();render();};

function validBindingHeadcount(r){return !!r&&!r.deleted&&activeOrg(r.org)&&positions.some(p=>p.org===r.org&&p.name===r.job&&!p.disabled);}
function bindSources(){const target=records.find(r=>r.id===bindingTargetId);return target?records.filter(r=>r.org===target.org&&r.person&&!r.deleted&&!r.plannedExitDate&&r.id!==target.id):[];}
function openBindPerson(id){
 const target=records.find(r=>r.id===id);
 if(bindingLocked(target)){notify(bindingLockMessage);return;}
 if(!validBindingHeadcount(target)||target.person||target.plannedExitDate){notify('请选择有效编制。');return;}
 bindingTargetId=id;bindingSourceId=null;$('#bind-person-error').textContent='';
 $('#bind-person-select').innerHTML='<option value="">请选择员工</option>'+bindSources().map(r=>`<option value="${esc(r.id)}">${esc(staff(r)?.name)}（${esc(staff(r)?.no)}）</option>`).join('');
 open('bind-person-dialog');
}
$('#bind-person-select').onchange=()=>{bindingSourceId=$('#bind-person-select').value||null;$('#bind-person-error').textContent='';};
$('#confirm-bind-person').onclick=()=>{
 const target=records.find(r=>r.id===bindingTargetId),source=records.find(r=>r.id===bindingSourceId);
 const fail=message=>{$('#bind-person-error').textContent=message;};
 if(bindingLocked(target)||bindingLocked(source))return fail(bindingLockMessage);
 if(!validBindingHeadcount(target)||target.person||target.plannedExitDate)return fail('当前编制已发生变化，请重新打开。');
 if(!source?.person||source.deleted||source.plannedExitDate||source.org!==target.org||source.id===target.id)return fail('请选择本部门员工。');
 if(records.filter(r=>r.person===source.person&&!r.deleted).length!==1)return fail('该员工已有重复绑定记录，请先核对。');
 const personFields=['plannedEntryDate','plannedExitDate','actualPerson','planningGrade','assignmentType','plannedTransferDate'];
 target.person=source.person;
 for(const key of personFields){
  delete target[key];
  if(Object.hasOwn(source,key)){target[key]=source[key];delete source[key];}
 }
 if(source.personOnly)records=records.filter(row=>row.id!==source.id);
 else {source.person=null;delete source.bindingTransferId;}
 $('#bind-person-dialog').close();selected.clear();render();notify('人员绑定已更新');
};
const beforeViewTableClick=$('#table-body').onclick;
$('#table-body').onclick=e=>{const button=e.target.closest('button');if(button?.dataset.bindPerson){openBindPerson(button.dataset.bindPerson);return;}beforeViewTableClick(e);};
render();
