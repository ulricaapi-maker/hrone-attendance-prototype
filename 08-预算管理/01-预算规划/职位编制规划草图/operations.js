/* Local staffing prototype actions. All changes stay in the planning draft. */
let staffingView='flat';
let positionEditing=null;
let vacancyMigration=false;
const originalPositionIds=new Set(initialPositions(baseRecords).map(p=>p.id));
const originalCell=cell, originalRender=render, originalOpenHC=openHC, originalOpenArrange=openArrange;
const originalTableClick=$('#table-body').onclick;

function resolvePositionName(org,name){
 const p=positions.find(p=>p.org===org&&(p.name===name||p.previousNames?.includes(name)));
 return p?.name||name;
}
function syncPositionNames(){records.forEach(r=>r.job=resolvePositionName(r.org,r.job));}
function positionActions(p){
 if(p.disabled)return `<button class="text" data-restore-position="${esc(p.id)}">取消停用</button>`;
 return `<button class="text" data-edit-position="${esc(p.id)}">编辑</button><button class="text" data-stop-position="${esc(p.id)}">停用</button>${!originalPositionIds.has(p.id)?`<button class="text" data-cancel-position="${esc(p.id)}">取消新增</button>`:''}`;
}
function positionRowCount(p,occupied){return records.filter(r=>!r.deleted&&activeOrg(r.org)&&r.org===p.org&&r.job===p.name&&!!r.person===occupied).length;}
function migrateBefore(r){return r.migrationBefore||r.transferBefore||(original(r)?.org!==r.org?original(r):null);}

cell=function(r,key){
 if(key==='name'&&!r.person)return `<button class="text name-link" data-detail="${esc(r.id)}" title="${esc(r.code)}">${esc(r.code)}</button>${r.deleted?'<small class="stopped-chip">已停用</small>':''}`;
 if(key!=='actions'||sourceView())return originalCell(r,key);
 if(r.person)return originalCell(r,key);
 if(r.deleted)return `<div class="actions"><button class="text" data-restore-hc="${esc(r.id)}">取消停用</button></div>`;
 const moved=migrateBefore(r);
 return `<div class="actions"><button class="text" data-edit="${esc(r.id)}">编辑</button><button class="text" data-copy="${esc(r.id)}">复制</button><button class="text" data-migrate="${esc(r.id)}">迁移</button>${moved?`<button class="text" data-undo-migration="${esc(r.id)}">取消迁移</button>`:''}<button class="text" data-stop-hc="${esc(r.id)}">停用</button>${!original(r)?`<button class="text" data-cancel-hc="${esc(r.id)}">取消新增</button>`:''}</div>`;
};

function groupedRows(rows){
 const scope=scopes(),groups=positions.filter(p=>scope.has(p.org)&&activeOrg(p.org));
 const filtered=Object.values(filters).some(Boolean),seen=new Set();
 const rowHtml=r=>`<tr class="${r.deleted?'hc-stopped-row':''}">${columns.map(([k])=>`<td class="${sticky(k)}">${cell(r,k)}</td>`).join('')}</tr>`;
 const out=[];
 for(const p of groups){
  const members=rows.filter(r=>r.org===p.org&&r.job===p.name);
  if(filtered&&!members.length)continue;
  members.forEach(r=>seen.add(r.id));
  const width=Math.max(260,$('.table-scroll').clientWidth-24);
  out.push(`<tr class="position-group-row"><td colspan="${columns.length}"><div class="position-heading-content" style="width:${width}px"><div class="position-heading-label"><strong title="${esc(p.name)}">${esc(p.name)}</strong></div><span class="position-department" title="${esc(orgPlan.path(p.org))}">${esc(formatOrg(p.org))}</span><div class="position-counts">${p.disabled?'<span class="stopped-chip">停用</span>':`<span>在职 <b>${positionRowCount(p,true)}</b></span><span>空编 <b>${positionRowCount(p,false)}</b></span>`}</div><div class="actions position-actions">${positionActions(p)}</div></div></td></tr>`);
  out.push(members.length?members.map(rowHtml).join(''):`<tr><td colspan="${columns.length}" class="position-empty">${p.disabled?'该职位已停用，可取消停用后继续配置':'该职位暂无员工或编制'}</td></tr>`);
 }
 out.push(...rows.filter(r=>!seen.has(r.id)).map(rowHtml));
 return out.join('');
}

render=function(){
 syncPositionNames();originalRender();
 const source=sourceView(),items=[...selected].map(id=>records.find(r=>r.id===id)).filter(r=>r&&!r.deleted);
 $('#staffing-views').hidden=source;
 $('#view-grouped').classList.toggle('active',staffingView==='grouped');
 $('#view-flat').classList.toggle('active',staffingView==='flat');
 $('#view-grouped').setAttribute('aria-pressed',String(staffingView==='grouped'));
 $('#view-flat').setAttribute('aria-pressed',String(staffingView==='flat'));
 $('#positions').hidden=staffingView==='grouped';
 $('#arrange').hidden=!items.length||items.some(r=>!r.person);
 $('#edit-hc').hidden=!items.length;
 $('#batch-vacancy-tools').hidden=source||!items.length||items.some(r=>r.person);
 if(!source&&staffingView==='grouped'){
  const html=groupedRows(visibleRows());if(html)$('#table-body').innerHTML=html;
 }
};
$('#view-grouped').onclick=()=>{staffingView='grouped';render();};
$('#view-flat').onclick=()=>{staffingView='flat';render();};

openHC=function(ids=[],copy=null){
 originalOpenHC(ids,copy);
 $('#hc-dept').disabled=!!ids.length;
 if(ids.length>1){
  const orgs=new Set(ids.map(id=>records.find(r=>r.id===id)?.org));
  if(orgs.size>1){$('#hc-dialog').close();notify('请按部门分别批量编辑编制；跨部门调整请使用迁移。');}
 }
};

openArrange=function(ids,mode='people'){
 vacancyMigration=mode==='vacancy';
 if(vacancyMigration){
  const targets=(ids?.length?ids:[...selected]).map(id=>records.find(r=>r.id===id));
  if(!targets.length||targets.some(r=>!r||r.deleted||r.person)){notify('请勾选未停用的空编制；在职人员通过人员调整操作。');return;}
 }
 originalOpenArrange(ids);
 if(!$('#arrange-dialog').open)return;
 if(vacancyMigration||transferRows.every(r=>!r.person)){
  $('#arrange-title').textContent=transferRows.length===1?'编制迁移':'批量编制迁移';
  $('#apply-arrange').textContent='确认迁移';
  $('#transfer-summary').textContent=`已选 ${transferRows.length} 个空编制`;
  $('#transfer-note').textContent='选择其他目标部门和目标职位；原编制直接迁移，保留编制职级、海外属性、工作地点及预计到岗时间，不新增编制。';
  $('#arrange-dept').value='';renderMappings();
  $('#transfer-note').textContent='选择其他目标部门和目标职位；原编制直接迁移，保留编制职级、海外属性、工作地点及预计到岗时间，不新增编制。';
 }
};

function undoMigration(id){
 const r=records.find(r=>r.id===id),before=r&&migrateBefore(r);
 if(!before)return;
 if(r.person){notify('该编制已被员工占用，请先取消关联人员调整。');return;}
 const snapshot=structuredClone(before);snapshot.job=resolvePositionName(snapshot.org,snapshot.job);
 records[records.indexOf(r)]=snapshot;selected.delete(id);render();notify('已取消迁移，编制回到原部门');
}
function stopHeadcounts(ids){
 const items=ids.map(id=>records.find(r=>r.id===id));
 if(!items.length||items.some(r=>!r||r.deleted||r.person)){notify('只能停用空编制，请先通过人员调整处理员工。');return;}
 confirm('停用编制',`<p>确认在本次规划中停用 ${items.length} 个空编制？</p><p class="muted">停用后不纳入规划人数，可在原位置取消停用。</p>`,()=>{items.forEach(r=>{r.deleted=true;selected.delete(r.id);});render();notify('编制已停用');});
}
function cancelHeadcount(id){
 const r=records.find(r=>r.id===id);
 if(!r||original(r))return;
 if(r.person||bindingTransfers.some(t=>!t.revoked&&(t.sourceId===id||t.targetId===id))){notify('该编制关联了人员调整，请先取消人员调整。');return;}
 confirm('取消新增编制',`<p>确认取消本次新增的编制“${esc(r.code)}”？</p>`,()=>{records=records.filter(r=>r.id!==id);selected.delete(id);render();notify('已取消新增编制');});
}
$('#batch-migrate-hc').onclick=()=>openArrange([...selected],'vacancy');
$('#batch-stop-hc').onclick=()=>stopHeadcounts([...selected]);

function editPosition(id){
 const p=positions.find(p=>p.id===id);if(!p||p.disabled)return;
 openPosition(p.org);positionEditing=id;
 $('#position-title').textContent='编辑职位';$('#position-dept').disabled=true;
 $('#position-name').value=p.name;$('#position-min').value=p.min;$('#position-max').value=p.max;
}
const originalOpenPosition=openPosition;
openPosition=function(dept=targetDefault(),parent=null){
 positionEditing=null;originalOpenPosition(dept,parent);$('#position-dept').disabled=parent==='hc'&&hcEditing.length>0;
 $('#position-title').textContent='新增职位';
};
$('#position-form').onsubmit=e=>{
 e.preventDefault();const name=$('#position-name').value.trim(),org=$('#position-dept').value,min=$('#position-min').value,max=$('#position-max').value;
 const p=positionEditing?positions.find(p=>p.id===positionEditing):null;
 if(!name){$('#position-error').textContent='请输入职位名称。';return;}
 if(GRADES.indexOf(min)>GRADES.indexOf(max)){$('#position-error').textContent='最高职级不能低于最低职级。';return;}
 if(positions.some(other=>other.id!==p?.id&&other.org===org&&(other.name===name||other.previousNames?.includes(name)))){$('#position-error').textContent='该部门下已存在同名职位。';return;}
 if(p){
  const old=p.name;if(old!==name){p.previousNames=[...new Set([...(p.previousNames||[]),old])];records.filter(r=>r.org===p.org&&r.job===old).forEach(r=>r.job=name);}
  Object.assign(p,{name,min,max});
 }else positions.push({id:'pos-new-'+Date.now(),org,name,min,max});
 $('#position-dialog').close();
 if(positionParent==='hc'){$('#hc-dept').value=org;fillPositions(org,'#hc-position',name);batchTouched.add('position');rangeInfo();}
 render();if($('#position-list').open)renderPositions();notify(p?'职位已更新，具体编制职级及员工任职信息保留':'职位已新增');
};
function handlePositionAction(d){
 const id=d.editPosition||d.stopPosition||d.restorePosition||d.cancelPosition;
 if(!id)return false;const p=positions.find(p=>p.id===id);if(!p)return true;
 if(d.editPosition){editPosition(id);return true;}
 if(d.restorePosition){p.disabled=false;render();if($('#position-list').open)renderPositions();notify('已取消职位停用');return true;}
 const bound=records.filter(r=>!r.deleted&&activeOrg(r.org)&&r.org===p.org&&r.job===p.name);
 if(d.stopPosition){
  if(bound.length){notify('该职位下还有员工或空编制，请先调整人员，并迁移或停用空编制。');return true;}
  confirm('停用职位',`<p>确认在本次规划中停用“${esc(p.name)}”？</p>`,()=>{p.disabled=true;render();if($('#position-list').open)renderPositions();notify('职位已停用');});
 }
 if(d.cancelPosition){
  if(originalPositionIds.has(id))return true;
  if(records.some(r=>r.org===p.org&&r.job===p.name)){notify('该职位仍有关联编制，请先迁移或取消相关新增编制。');return true;}
  confirm('取消新增职位',`<p>确认取消新增“${esc(p.name)}”？</p>`,()=>{positions=positions.filter(p=>p.id!==id);render();if($('#position-list').open)renderPositions();notify('已取消新增职位');});
 }
 return true;
}
$('#table-body').onclick=e=>{
 const button=e.target.closest('button');if(!button)return;const d=button.dataset;
 if(handlePositionAction(d))return;
 if(d.migrate){openArrange([d.migrate],'vacancy');return;}
 if(d.undoMigration){undoMigration(d.undoMigration);return;}
 if(d.stopHc){stopHeadcounts([d.stopHc]);return;}
 if(d.restoreHc){records.find(r=>r.id===d.restoreHc).deleted=false;render();notify('已取消编制停用');return;}
 if(d.cancelHc){cancelHeadcount(d.cancelHc);return;}
 originalTableClick(e);
};
renderPositions=function(){
 const scope=scopes();$('#position-list-body').innerHTML=positions.filter(p=>scope.has(p.org)).map(p=>`<tr><td><span class="cell-text" title="${esc(p.name)}">${esc(p.name)}</span>${scope.size>1?`<small class="muted">${esc(formatOrg(p.org))}</small>`:''}${p.disabled?'<small class="stopped-chip">已停用</small>':''}</td><td>${esc(p.min)} ～ ${esc(p.max)}</td><td>${positionRowCount(p,true)}</td><td>${positionRowCount(p,false)}</td><td><div class="actions">${positionActions(p)}</div></td></tr>`).join('')||'<tr><td colspan="5" class="empty">当前部门暂无职位</td></tr>';
};
$('#position-list-body').onclick=e=>{const b=e.target.closest('button');if(b)handlePositionAction(b.dataset);};

saveDraft=function(){try{localStorage.setItem('hrone-staffing-sketch-v1',JSON.stringify({records,positions,selectedOrg,bindingTransfers,staffingView}));$('#save-status').textContent='草稿已保存在当前浏览器';return true;}catch{notify('当前浏览器未允许保存草稿。');return false;}};
columns.find(c=>c[0]==='actions')[2]=360;
render();

function nextPlanningHcCode(){const used=new Set(records.map(r=>r.code));let i=records.length+1;while(used.has('PLHC'+String(i).padStart(3,'0')))i++;return 'PLHC'+String(i).padStart(3,'0');}

const originalRenderMappings=renderMappings;
renderMappings=function(){originalRenderMappings();if(transferRows.length&&transferRows.every(r=>!r.person))$('#transfer-note').textContent='选择其他目标部门和目标职位；原编制直接迁移，保留编制职级、海外属性、工作地点及预计到岗时间，不新增编制。';};
const originalApplyArrange=$('#apply-arrange').onclick;
$('#apply-arrange').onclick=()=>{originalApplyArrange();if(!$('#arrange-dialog').open&&transferRows.length&&transferRows.every(r=>!r.person))notify('编制已迁移，可在目标部门查看或取消迁移');};

$('#arrange-dept').onchange=()=>renderMappings();
