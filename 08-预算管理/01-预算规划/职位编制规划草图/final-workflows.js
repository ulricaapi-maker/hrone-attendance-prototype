/* Approved local planning interactions. No server writes. */
const finalFields = {
 position: [
  ['establishDate','设立日期','date'],['order','顺序号','number'],
  ['sequence','职序',['专业序列','管理序列']],['family','职族',['业务族','技术族','职能族']],
  ['category','职类',['业务支持类','技术研发类','职能管理类']],
  ['costClass','成本分类',['营销','职能','交付类']],['collar','领色',['白领','蓝领','灰领']]
 ],
 hc: [['abc','编制ABC分类',['A','B','C']],['center','一级成本中心',['示例业务成本中心','示例职能成本中心']],
      ['office','编制办公地点','text'],['remark','备注','text']]
};
function extraFields(kind) {
 const grid=$('#'+(kind==='position'?'position':'hc')+'-form .form-grid');
 for(const [key,label,type] of finalFields[kind]){
  const item=document.createElement('label');
  item.innerHTML=`${label}${key==='remark'?'':' <em>*</em>'}${Array.isArray(type)?`<select id="${kind}-${key}"><option value="">请选择</option>${type.map(v=>`<option>${esc(v)}</option>`).join('')}</select>`:`<input id="${kind}-${key}" type="${type}" ${type==='number'?'min="0" max="100000"':''}>`}`;
  grid.appendChild(item);
 }
 if(kind==='hc')for(const [key,label] of [['collar','领色'],['costClass','成本分类']]){
  const item=document.createElement('label');item.innerHTML=`${label}<input id="hc-${key}" readonly>`;grid.appendChild(item);
 }
}
extraFields('position');extraFields('hc');
const hcFieldGrid=$('#hc-form .form-grid');for(const id of ['dept','position','grade','abc','collar','overseas','center','quantity','costClass','place','office','arrival','remark'])hcFieldGrid.appendChild($('#hc-'+id).closest('label'));
$('#hc-dept').closest('label').firstChild.textContent='部门 ';
$('#hc-remark').outerHTML='<textarea id="hc-remark" maxlength="20000" rows="3"></textarea>';
for(const key of ['place','office']){const field=$('#hc-'+key),values=[...new Set(['深圳','上海','北京',...records.map(r=>r[key]||r.place).filter(Boolean)])];field.outerHTML='<select id="hc-'+key+'"><option value="">请选择</option>'+values.map(value=>'<option>'+esc(value)+'</option>').join('')+'</select>';}
$('#hc-add-position').hidden=true;
$('#position-dialog').classList.remove('small-dialog');
const positionCodeLabel=document.createElement('label');positionCodeLabel.innerHTML='编码<input id="position-code" readonly value="保存后自动生成">';$('#position-form .form-grid').appendChild(positionCodeLabel);
// Match the verified HRONE field names, order and two information groups.
for(const [id,label] of [['position-name','名称'],['position-dept','部门']])$('#'+id).closest('label').firstChild.textContent=label+' ';
const positionOriginalGrid=$('#position-form .form-grid');
for(const [title,ids] of [['基本信息',['name','code','dept','establishDate','order']],['职务体系',['sequence','family','category','min','max','costClass','collar']]]){
 const section=document.createElement('section');section.className='position-field-section';const heading=document.createElement('h3');heading.textContent=title;const grid=document.createElement('div');grid.className='form-grid';section.append(heading,grid);for(const key of ids)grid.appendChild($('#position-'+key).closest('label'));positionOriginalGrid.before(section);
}
positionOriginalGrid.remove();

positions.forEach((p,i)=>Object.assign(p,{code:p.code||'POS'+String(i+1).padStart(4,'0'),establishDate:p.establishDate||'2027-01-01',order:p.order??i+1,sequence:p.sequence||'专业序列',family:p.family||'业务族',category:p.category||'业务支持类',costClass:p.costClass||'职能',collar:p.collar||'白领'}));
records.forEach(r=>Object.assign(r,{abc:r.abc||'B',center:r.center||'示例业务成本中心',office:r.office||r.place,remark:r.remark||'',arrival:r.arrival?.endsWith('月')?`2027-${r.arrival.slice(0,-1).padStart(2,'0')}-01`:r.arrival||''}));
let adjustmentHistory=draft?.adjustmentHistory||[],positionContext=null,stopState=null;
$('#stop-position-dialog').addEventListener('close',()=>{if(!$('#stop-position-dialog').open)stopState=null;});
const clone=v=>structuredClone(v);
const snapshot=()=>({records:clone(records),positions:clone(positions),bindings:clone(bindingTransfers)});
function changes(before,after){const old=new Map(before.map(r=>[r.id,r])),now=new Map(after.map(r=>[r.id,r]));return [...new Set([...old.keys(),...now.keys()])].filter(id=>JSON.stringify(old.get(id))!==JSON.stringify(now.get(id))).map(id=>({id,before:old.get(id)||null,after:now.has(id)?clone(now.get(id)):null}));}
function recordAction(label,before){
 const diff={records:changes(before.records,records),positions:changes(before.positions,positions),bindings:changes(before.bindings,bindingTransfers)};
 if(!diff.records.length&&!diff.positions.length)return;
 adjustmentHistory.push({id:'action-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),label,time:new Date().toLocaleString('zh-CN'),...diff});
}
function undoAction(id){
 const action=adjustmentHistory.find(t=>t.id===id&&!t.revoked);if(!action)return;
 for(const [key,collection] of [['records',records],['positions',positions],['bindings',bindingTransfers]]){
  for(const change of action[key]){
   const current=collection.find(r=>r.id===change.id)||null;
   if(JSON.stringify(current)!==JSON.stringify(change.after)){
    notify(`${current?.code||current?.name||'关联记录'}已有后续调整，请先取消后续调整。`);return;
   }
  }
 }
 const restore=(collection,diff)=>{const result=clone(collection);for(const c of diff){const i=result.findIndex(r=>r.id===c.id);if(i>=0)result.splice(i,1);if(c.before)result.push(clone(c.before));}return result;};
 const nextRecords=restore(records,action.records),nextPositions=restore(positions,action.positions);
 const people=nextRecords.filter(r=>r.person&&!r.deleted).map(r=>r.person);
 if(new Set(people).size!==people.length){notify('原编制或员工已有其他占用，请先处理后再取消。');return;}
 if(nextRecords.some(r=>!r.deleted&&!nextPositions.some(p=>!p.disabled&&p.org===r.org&&p.name===r.job))){notify('关联职位已发生变化，无法直接恢复，请先核对后续调整。');return;}
 records=nextRecords;positions=nextPositions;bindingTransfers=restore(bindingTransfers,action.bindings);action.revoked=true;selected.clear();render();renderHistory();notify('已取消调整，人员及编制关系已恢复');
}
function currentRows(){const scope=scopes();return records.filter(r=>scope.has(r.org));}
rowScope=currentRows;
dataValue=function(r,k){
 if(k==='name')return staff(r)?.name||'';
 if(k==='employeeNo')return staff(r)?.no||'';
 if(k==='personGrade')return staff(r)?.grade||'';
 if(k==='overseas')return r.overseas?'是':'否';
 if(k==='org')return formatOrg(r.org);
 if(k==='occupancy')return r.person?'在职':'空编';
 if(k==='collar'||k==='costClass')return positions.find(p=>p.org===r.org&&p.name===r.job)?.[k]||'';
 if(k==='validity')return r.deleted||!activeOrg(r.org)?'停用':'启用';
 return String(r[k]??'');
};
visibleRows=function(){return currentRows().filter(r=>(planningTab==='headcounts'?activeOrg(r.org):r.person&&!r.deleted)&&Object.entries(filters).every(([k,v])=>dataValue(r,k).toLowerCase().includes(v.toLowerCase())));};
headcountColumns.splice(0,headcountColumns.length,['check','',36],['code','编制编码',120],['org','编制部门',170],['name','员工',230],['job','编制职位',240],['grade','编制职级',100],['occupancy','编制在岗状态',130],['abc','编制ABC分类',120],['overseas','是否海外编制',120],['place','编制工作地点',195],['office','编制办公地点',220],['center','一级成本中心',180],['collar','领色',100],['costClass','成本分类',130],['remark','备注',220],['arrival','预计到岗时间',140],['actions','操作',250]);
employeeColumns.find(c=>c[0]==='job')[1]='编制职位';
function planningChangeBadge(r){
 const position=positions.find(p=>p.org===r.org&&p.name===r.job);let label='',kind='';
 if(r.deleted||!activeOrg(r.org)||position?.disabled){label='停用';kind='stopped';}
 else {const base=baseRecords.find(b=>b.id===r.id);if(!base){label='新增';kind='added';}else{const first=adjustmentHistory.flatMap(t=>t.records).find(c=>c.id===r.id&&c.before)?.before,normalize=(key,v)=>key==='arrival'&&typeof v==='string'&&v.endsWith('月')?'2027-'+v.slice(0,-1).padStart(2,'0')+'-01':v;const keys=['org','job','grade','overseas','place','arrival','abc','center','office','remark'];if(keys.some(key=>{const source=base[key]!==undefined?base:first;return source?.[key]!==undefined&&normalize(key,r[key])!==normalize(key,source[key]);})){label='调整';kind='changed';}}}
 return label?`<small class="planning-change-tag ${kind}">${label}</small>`:'';
}
function latestActionFor(r){return adjustmentHistory.slice().reverse().find(t=>!t.revoked&&t.label.includes('人员调整')&&t.records.some(c=>c.after?.person===r.person&&c.id===r.id));}
cell=function(r,key){
 const value=dataValue(r,key);
 if(key==='check')return `<input type="checkbox" data-select="${esc(r.id)}" aria-label="选择${esc(staff(r)?.name||r.code)}" ${selected.has(r.id)?'checked':''} ${r.deleted||planningTab==='headcounts'&&!activeOrg(r.org)?'disabled':''}>`;
 if(key==='code')return `<button class="text name-link" data-detail="${esc(r.id)}">${esc(r.code)}</button>${planningTab==='headcounts'?planningChangeBadge(r):''}`;
 if(key==='name')return r.person?(planningTab==='people'?`<button class="text name-link" data-detail="${esc(r.id)}" title="${esc(value)}">${esc(value)}</button>${latestActionFor(r)?'<small class="planning-change-tag changed">调整</small>':''}`:`<span class="cell-text" title="${esc(value)}">${esc(value)}</span>`):'';
 if(key==='occupancy')return `<span class="occupancy-chip ${r.deleted?'off':r.person?'occupied':'vacant'}">${value}</span>`;
 if(key==='actions'){
  if(planningTab==='people'){
   const action=latestActionFor(r);
   return `<div class="actions"><button class="text" data-adjust="${r.id}">人员调整</button>${action?`<button class="text" data-undo-action="${action.id}">取消调整</button>`:''}</div>`;
  }
  if(!activeOrg(r.org))return '';
  if(r.deleted)return `<button class="text" data-final-restore="${r.id}">撤回停用</button>`;
  const limited=sourceView();
  return `<div class="actions">${!limited&&!r.person?`<button class="text" data-bind-person="${r.id}">绑定人员</button>`:''}${!limited||!r.person?`<button class="text" data-edit="${r.id}">编辑</button>`:''}${!limited?`<button class="text" data-copy="${r.id}">复制</button>`:''}${!r.person?`<button class="text" data-stop-hc="${r.id}">停用</button>`:''}</div>`||'—';
 }
 return `<span class="cell-text" title="${esc(value)}">${esc(value)||'—'}</span>`;
};
// Keep the view switch and summary on the same toolbar as list actions.
$('.toolbar').appendChild($('#headcount-display-tools'));
const renderBeforeFinal=render;
render=function(){
 if(sourceView())planningTab='people';
 renderBeforeFinal();
 const source=sourceView(),items=[...selected].map(id=>records.find(r=>r.id===id)).filter(r=>r&&!r.deleted);
 $('#planning-tabs').hidden=false;$('#headcount-tab').hidden=source;$('#processing-tabs').hidden=true;$('#source-tools').hidden=true;$('#active-tools').hidden=false;
 $('#headcount-display-tools').hidden=planningTab!=='headcounts';$('#staffing-views').hidden=true;
 $('#pending-switch').hidden=true;$('#batch-migrate-hc').hidden=true;
 if(planningTab==='headcounts')$('#row-count').textContent=`共 ${visibleRows().length} 条编制记录`;
 $('#final-position-view').classList.toggle('active',$('#group-headcounts').checked);$('#final-list-view').classList.toggle('active',!$('#group-headcounts').checked);
 $('#final-position-view').setAttribute('aria-pressed',String($('#group-headcounts').checked));$('#final-list-view').setAttribute('aria-pressed',String(!$('#group-headcounts').checked));
 for(const id of ['add-position','add-hc']){$('#'+id).hidden=id==='add-position'||source||planningTab!=='headcounts';$('#'+id).disabled=false;}
 $('#positions').hidden=source||planningTab!=='headcounts';
 $('#arrange').hidden=planningTab!=='people';$('#arrange').disabled=!items.length;
 $('#edit-hc').hidden=planningTab!=='headcounts';$('#edit-hc').disabled=!items.length||items.some(r=>!activeOrg(r.org));
 $('#batch-vacancy-tools').hidden=planningTab!=='headcounts';$('#batch-stop-hc').hidden=planningTab!=='headcounts';$('#batch-stop-hc').disabled=!items.length||items.some(r=>r.person||!activeOrg(r.org));
 $('.toolbar').hidden=false;
 const actual=currentRows().filter(r=>!r.deleted&&activeOrg(r.org));
 $('#occupancy-summary').textContent=`在职 ${actual.filter(r=>r.person).length} · 空编 ${actual.filter(r=>!r.person).length}`;
 $('#headcount-tab').textContent=`编制列表（${currentRows().filter(r=>activeOrg(r.org)).length}）`;
 $('#pending-count').hidden=true;$('#pending-count').textContent='';
 document.querySelectorAll('#stopped-list [data-org]').forEach(b=>{const rows=records.filter(r=>r.org===b.dataset.org&&!r.deleted),badge=b.querySelector('.pending-dot');if(badge)badge.textContent='停用';});
 if(planningTab==='headcounts'&&staffingView==='grouped')$('#table-body').innerHTML=groupedRows(visibleRows());
 const selectable=visibleRows().filter(r=>!r.deleted&&(planningTab==='people'||activeOrg(r.org)));$('#select-all').disabled=!selectable.length;$('#select-all').checked=!!selectable.length&&selectable.every(r=>selected.has(r.id));
 if(planningTab==='headcounts')document.querySelectorAll('#table-body [data-select]').forEach(el=>{const r=records.find(r=>r.id===el.dataset.select);if(r&&!activeOrg(r.org))el.closest('tr').classList.add('hc-stopped-row');});
 if(!visibleRows().length&&!(planningTab==='headcounts'&&staffingView==='grouped'&&positions.some(p=>scopes().has(p.org))))$('#table-body').innerHTML=`<tr><td colspan="${columns.length}" class="empty">${source?'本部门暂无'+(planningTab==='people'?'员工':'有效编制'):'暂无符合条件的记录'}</td></tr>`;
};
$('#final-position-view').onclick=()=>{$('#group-headcounts').checked=true;selected.clear();render();};
$('#final-list-view').onclick=()=>{$('#group-headcounts').checked=false;selected.clear();render();};
positionActions=function(p){if(!activeOrg(p.org))return '';if(p.disabled)return `<button class="text" data-restore-position="${p.id}">取消停用</button>`;const isNew=!originalPositionIds.has(p.id);return `<button class="text" data-edit-position="${p.id}">编辑</button>${isNew?`<button class="text" data-cancel-position="${p.id}">取消新增</button>`:`<button class="text" data-stop-position="${p.id}">停用</button>`}`;};
stopHeadcounts=function(ids){
 const items=ids.map(id=>records.find(r=>r.id===id));
 if(!items.length||items.some(r=>!r||r.deleted||r.person)){notify('请选择有效空编；在职编制需先调整人员。');return;}
 const before=snapshot();items.forEach(r=>{r.deleted=true;selected.delete(r.id);});recordAction('减编',before);render();
};
const oldPositionAction=handlePositionAction;
handlePositionAction=function(d){
 if(d.addPositionHc){const p=positions.find(p=>p.id===d.addPositionHc);openHC();$('#hc-dept').value=p.org;fillPositions(p.org,'#hc-position',p.name);syncHCInherited();return true;}
 if(d.stopPosition){openPositionStop(d.stopPosition);return true;}
 if(d.restorePosition){const action=adjustmentHistory.slice().reverse().find(t=>!t.revoked&&t.label==='停用职位'&&t.positions.some(c=>c.id===d.restorePosition));if(action){undoAction(action.id);return true;}}
 return oldPositionAction(d);
};
$('#table-body').onclick=e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(handlePositionAction(d))return;
 if(d.bindPerson){openBindPerson(d.bindPerson);return;}
 if(d.undoAction){undoAction(d.undoAction);return;}
 if(d.finalRestore){const r=records.find(r=>r.id===d.finalRestore),p=positions.find(p=>p.org===r.org&&p.name===r.job);if(!activeOrg(r.org)||p?.disabled){notify('请先恢复所属部门和职位，再取消编制停用。');return;}const before=snapshot();r.deleted=false;recordAction('取消编制停用',before);render();return;}
 if(d.detail)showDetail(d.detail);
 if(d.adjust)openArrange([d.adjust]);
 if(d.edit)openHC([d.edit]);
 if(d.copy)openHC([],records.find(r=>r.id===d.copy));
 if(d.stopHc)stopHeadcounts([d.stopHc]);
};
const positionListFields=[['name','名称'],['org','部门'],['sequence','职序'],['family','职族'],['category','职类'],['min','最低职级'],['max','最高职级'],['costClass','成本分类'],['collar','领色'],['code','编码']];
let positionListFilters={};
function positionListValue(p,key){return key==='org'?formatOrg(p.org):key==='occupied'?positionRowCount(p,true):key==='vacant'?positionRowCount(p,false):p[key]??'';}
function filteredPositions(){return positions.filter(p=>activeOrg(p.org)&&scopes().has(p.org)&&Object.entries(positionListFilters).every(([key,value])=>String(positionListValue(p,key)).toLowerCase().includes(value.toLowerCase())));}
function exportPlanningCsv(filename,headers,rows){const safe=v=>{let text=String(v??'');if(typeof v==='string'&&/^[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};const csv='\uFEFF'+[headers,...rows].map(row=>row.map(safe).join(',')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download=filename+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderPositionRows(){const list=filteredPositions();
 $('#position-list-body').innerHTML=list.map(p=>'<tr>'+positionListFields.map(([key])=>`<td><span class="cell-text" title="${esc(positionListValue(p,key))}">${esc(positionListValue(p,key))}</span>${key==='name'&&p.disabled?'<small class="stopped-chip">已停用</small>':''}</td>`).join('')+`<td class="position-operation-col"><div class="actions">${positionActions(p)}</div></td></tr>`).join('')||'<tr><td colspan="11" class="empty">暂无符合条件的职位</td></tr>';
}
renderPositions=function(){
 const list=filteredPositions();
 $('#position-list .position-table thead').innerHTML='<tr>'+positionListFields.map(([key,label])=>`<th>${esc(label)}<button class="filter ${positionListFilters[key]?'active':''}" data-position-filter="${key}" aria-label="筛选${label}"></button></th>`).join('')+'<th class="position-operation-col">操作</th></tr>';
 renderPositionRows();
};
const positionFilterPopup=document.createElement('div');positionFilterPopup.id='position-filter-popup';positionFilterPopup.className='position-filter-popup';positionFilterPopup.hidden=true;$('#position-list').appendChild(positionFilterPopup);
$('#position-list .position-table thead').onclick=e=>{const button=e.target.closest('[data-position-filter]');if(!button)return;const key=button.dataset.positionFilter,label=positionListFields.find(c=>c[0]===key)[1];positionFilterPopup.innerHTML=`<form id="position-filter-form"><label>${esc(label)}<input id="position-filter-value" aria-label="${esc(label)}筛选条件" value="${esc(positionListFilters[key]||'')}" placeholder="请输入关键词"></label><div class="buttons"><button type="button" id="position-filter-reset">重置</button><button type="submit">确定</button></div></form>`;const box=button.getBoundingClientRect();positionFilterPopup.style.left=Math.max(12,Math.min(innerWidth-270,box.right-250))+'px';positionFilterPopup.style.top=box.bottom+6+'px';positionFilterPopup.hidden=false;$('#position-filter-form').onsubmit=ev=>{ev.preventDefault();positionListFilters[key]=$('#position-filter-value').value.trim();positionFilterPopup.hidden=true;renderPositions();};$('#position-filter-reset').onclick=()=>{delete positionListFilters[key];positionFilterPopup.hidden=true;renderPositions();};$('#position-filter-value').focus();};
$('#position-list').addEventListener('click',e=>{if(!e.target.closest('#position-filter-popup,[data-position-filter]'))positionFilterPopup.hidden=true;});
const positionExportButton=document.createElement('button');positionExportButton.textContent='导出';positionExportButton.id='export-positions';$('.manager-toolbar').appendChild(positionExportButton);positionExportButton.onclick=()=>exportPlanningCsv('职位管理',positionListFields.map(c=>c[1]),filteredPositions().map(p=>positionListFields.map(([key])=>positionListValue(p,key))));
$('#manager-add-position').onclick=()=>openPosition();
let hcCopying=false,hcBatchEditing=false;
function syncHCInherited(){const p=positions.find(p=>p.org===$('#hc-dept').value&&p.name===$('#hc-position').value);$('#hc-collar').value=p?.collar||'';$('#hc-costClass').value=p?.costClass||'';rangeInfo();}
openHC=function(ids=[],copy=null,batchMode=false){
 if(!ids.length&&!copy&&sourceView()){notify('请在有效部门新增编制。');return;}
 hcCopying=!!copy;hcBatchEditing=batchMode||ids.length>1;originalOpenHC(ids,copy);
 $('#hc-title').textContent=copy?'复制编制':ids.length>1?'批量编辑编制':ids.length?'编辑编制':'新增编制';
 const rows=ids.map(id=>records.find(r=>r.id===id)),r=copy||rows[0];
 $('#hc-dept').disabled=!!rows.length;$('#hc-position').disabled=!!rows.length;$('#hc-dept').closest('label').hidden=hcBatchEditing;$('#hc-position').closest('label').hidden=hcBatchEditing;$('#hc-add-position').hidden=true;
 for(const key of ['collar','costClass'])$('#hc-'+key).closest('label').hidden=hcBatchEditing;
 if(rows.length===1){$('#hc-dept').innerHTML=orgOptions()+(!activeOrg(r.org)?`<option value="${esc(r.org)}">${esc(formatOrg(r.org))}（拟定停用）</option>`:'');$('#hc-dept').value=r.org;fillPositions(r.org,'#hc-position',r.job);}
 for(const [key]of finalFields.hc)$('#hc-'+key).value=r?.[key]||'';
 $('#hc-arrival').disabled=false;$('#hc-arrival').value=r?.arrival||'';$('#hc-arrival').parentElement.querySelector('em').hidden=rows.length===1&&!!r.person;$('#hc-add-position').disabled=!activeOrg($('#hc-dept').value);
 if(!$('#hc-overseas option[value=""]'))$('#hc-overseas').insertAdjacentHTML('afterbegin','<option value="">请选择</option>');
 if(hcBatchEditing){
  for(const field of ['grade','overseas','place','arrival','abc','center','office','remark'])$('#hc-'+field).value='';
  $('#hc-title').textContent=`批量编辑编制（${rows.length}份）`;
 }
 document.querySelectorAll('#hc-form .form-grid em').forEach(el=>el.hidden=hcBatchEditing);
 if(rows.length===1&&r.person)$('#hc-arrival').parentElement.querySelector('em').hidden=true;
 $('#hc-error').textContent='';$('#hc-form').querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));syncHCInherited();$('#hc-range').hidden=true;
};
$('#hc-dept').onchange=()=>{$('#hc-add-position').disabled=!activeOrg($('#hc-dept').value);batchTouched.add('dept');batchTouched.add('position');fillPositions($('#hc-dept').value,'#hc-position');syncHCInherited();};
$('#hc-position').onchange=()=>{batchTouched.add('position');syncHCInherited();};
for(const [key]of finalFields.hc)$('#hc-'+key).addEventListener('input',()=>batchTouched.add(key));
$('#hc-form').onsubmit=e=>{
 e.preventDefault();const rows=hcEditing.map(id=>records.find(r=>r.id===id)),batch=hcBatchEditing;
 const fields={grade:'grade',overseas:'overseas',place:'place',arrival:'arrival',abc:'abc',center:'center',office:'office',remark:'remark'};
 const values={};for(const [field,key]of Object.entries(fields))values[key]=field==='overseas'?$('#hc-'+field).value==='true':$('#hc-'+field).value.trim();
 if(!batch&&$('#hc-overseas').value===''){$('#hc-error').textContent='请选择是否海外编制。';$('#hc-overseas').focus();return;}
 const updates=[...batchTouched].filter(k=>fields[k]&&$('#hc-'+k).value.trim()!=='');
 if(batch&&!updates.length){$('#hc-error').textContent='请先修改需要批量更新的字段。';return;}
 const targets=batch?rows.map(r=>Object.assign(clone(r),Object.fromEntries(updates.map(k=>[fields[k],values[fields[k]]])))):rows.length?[Object.assign(clone(rows[0]),values)]:[{...values,org:$('#hc-dept').value,job:$('#hc-position').value,person:null}];
 for(const r of targets){
  const p=positions.find(p=>!p.disabled&&p.org===r.org&&p.name===r.job);
  if(!activeOrg(r.org)||!p){$('#hc-error').textContent='请选择有效部门及职位。';return;}
  const missing=[['grade','编制职级'],['abc','编制ABC分类'],['center','一级成本中心'],['place','编制工作地点'],['office','编制办公地点'],...(!r.person?[['arrival','预计到岗时间']]:[])].find(([key])=>!r[key]);
  if(missing){const [key,label]=missing;$('#hc-error').textContent='请填写'+label+'。';const input=$('#hc-'+key);input.setAttribute('aria-invalid','true');input.focus();input.scrollIntoView({block:'center',behavior:'smooth'});return;}
  if(r.person&&rows.find(x=>x.id===r.id)?.org!==r.org){$('#hc-error').textContent='在职编制的部门变化，请通过人员调整处理。';return;}
 }
 const quantity=Number($('#hc-quantity').value);
 if(hcIsNew&&(!Number.isInteger(quantity)||quantity<1||quantity>50)){$('#hc-error').textContent='编制数请输入1至50的整数。';return;}
 const before=snapshot();
 if(hcIsNew)for(let i=0;i<quantity;i++)records.push({...clone(targets[0]),id:'new-hc-'+Date.now()+'-'+i,code:nextPlanningHcCode(),person:null});
 else targets.forEach(r=>{records[records.findIndex(x=>x.id===r.id)]=r;});
 recordAction(hcIsNew?(hcCopying?'复制编制':'新增编制'):'编辑编制',before);$('#hc-dialog').close();selected.clear();render();notify(hcIsNew?`已${hcCopying?'复制':'新增'}${quantity}份空编制`:'编制已更新');
};
const openPositionBeforeFinal=openPosition;
openPosition=function(dept=targetDefault(),parent=null){
 positionContext=parent;openPositionBeforeFinal(dept,parent);$('#position-title').textContent='新建职位';$('#position-code').value='' ;$('#position-dept').disabled=parent==='hc'&&$('#hc-dept').disabled;
 for(const key of ['min','max']){$('#position-'+key).insertAdjacentHTML('afterbegin','<option value="">请选择</option>');$('#position-'+key).value='';}
 const today=new Date(),date=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 for(const [key]of finalFields.position)$('#position-'+key).value=key==='establishDate'?date:'';
};
editPosition=function(id){const p=positions.find(p=>p.id===id);if(!p||p.disabled)return;openPosition(p.org);positionEditing=id;$('#position-title').textContent='编辑职位';$('#position-dept').disabled=true;$('#position-name').value=p.name;$('#position-min').value=p.min;$('#position-max').value=p.max;for(const [key]of finalFields.position)$('#position-'+key).value=p[key]??'';$('#position-code').value=p.code||'初始化职位';};
$('#position-form').onsubmit=e=>{
 e.preventDefault();const org=$('#position-dept').value,name=$('#position-name').value.trim(),min=$('#position-min').value,max=$('#position-max').value;
 const previous=positions.find(p=>p.id===positionEditing),p={id:previous?.id||'pos-new-'+Date.now(),code:previous?.code||'PLPOS'+Date.now().toString().slice(-8),org,name,min,max};
 for(const [key]of finalFields.position)p[key]=$('#position-'+key).value.trim();
 const all=positions.concat(stopState?.newPositions||[]);
 if(!activeOrg(org)||!name||finalFields.position.some(([key])=>!p[key])){$('#position-error').textContent='请填写职位名称、所属部门及完整职位属性。';return;}
 if(!Number.isInteger(Number(p.order))||Number(p.order)<0||Number(p.order)>100000){$('#position-error').textContent='顺序号请输入0至100000的整数。';return;}
 if(!GRADES.includes(min)||!GRADES.includes(max)){$('#position-error').textContent='请选择最低职级和最高职级。';return;}
 if(GRADES.indexOf(min)>GRADES.indexOf(max)){$('#position-error').textContent='最高职级不能低于最低职级。';return;}
 if(all.some(x=>x.id!==p.id&&x.org===org&&(x.name===name||x.previousNames?.includes(name)))){$('#position-error').textContent='该部门下已存在同名职位。';return;}
 if(positionContext==='stop'){
  stopState.newPositions.push(p);$('#position-dialog').close();renderStopRows();fillStopBulk();fillSimpleStopTarget(p.id);notify('目标职位已加入本次停用安排，确认停用后一起保存');return;
 }
 const before=snapshot();
 if(previous){const old=previous.name;if(old!==name){previous.previousNames=[...new Set([...(previous.previousNames||[]),old])];records.filter(r=>r.org===org&&r.job===old).forEach(r=>r.job=name);}Object.assign(previous,p);}
 else positions.push(p);
 recordAction(previous?'编辑职位':'新增职位',before);$('#position-dialog').close();
 if(positionContext==='hc'){$('#hc-dept').value=org;fillPositions(org,'#hc-position',name);batchTouched.add('position');syncHCInherited();}
 if(positionContext==='arrange'){renderMappings();}
 render();if($('#position-list').open)renderPositions();notify('职位已保存');
};
// Personnel changes retain the existing carry / target-HC binding engine.
const openArrangeBeforeFinal=openArrange;
openArrange=function(ids){const chosen=(ids?.length?ids:[...selected]).filter(id=>records.find(r=>r.id===id)?.person);openArrangeBeforeFinal(chosen);$('#arrange-title').textContent=chosen.length>1?'批量人员调整':'人员调整';$('#apply-arrange').textContent='确认调整';};
const renderMappingsBeforeFinal=renderMappings;
renderMappings=function(){renderMappingsBeforeFinal();$('#binding-impact').textContent='员工改占目标空编制，原编制留在原部门并释放为空编制。';if(!$('#arrange-new-position')){const b=document.createElement('button');b.id='arrange-new-position';b.className='text';b.type='button';b.textContent='新增目标职位';b.onclick=()=>{const org=$('#arrange-dept').value;if(!activeOrg(org)){notify('请先选择目标部门');return;}openPosition(org,'arrange');};$('#transfer-note').before(b);}$('#arrange-new-position').hidden=bindingMode==='target';};
const applyArrangeBeforeFinal=$('#apply-arrange').onclick;
$('#apply-arrange').onclick=()=>{const before=snapshot();applyArrangeBeforeFinal();if(!$('#arrange-dialog').open){positions.filter(p=>!before.positions.some(old=>old.id===p.id)).forEach(p=>{const source=before.positions.find(old=>old.name===p.name&&old.min===p.min&&old.max===p.max);if(source){const identity={id:p.id,org:p.org,name:p.name};Object.assign(p,clone(source),identity,{code:'PLPOS'+Date.now().toString().slice(-8)});}});recordAction('人员调整',before);notify(bindingMode==='target'?'人员调整完成，原编制已释放为空编制':'人员与原编制已一起调整');}};
function showHistoryValue(r){return r?`${formatOrg(r.org)} / ${r.job} / ${r.grade}${r.deleted?'（停用）':''}${r.person?' · '+(STAFF_DEMO.find(p=>p.id===r.person)?.name||''):''}`:'—';}
function historyField(value){return value===true?'是':value===false?'否':value??'—';}
function renderHistory(){
 const scope=scopes();const history=adjustmentHistory.filter(t=>t.records.some(c=>scope.has(c.before?.org)||scope.has(c.after?.org))||t.positions.some(c=>scope.has(c.before?.org)||scope.has(c.after?.org)));
 $('#history-body').innerHTML=history.slice().reverse().map(t=>`<section class="history-entry"><strong>${esc(t.label)}${t.revoked?' · 已取消':''}</strong><small>${esc(t.time)}</small>${t.records.map(c=>`<div class="history-change"><b>${esc(c.after?.code||c.before?.code)}</b><p>调整前：${esc(showHistoryValue(c.before))}</p><p>调整后：${esc(showHistoryValue(c.after))}</p>${[['abc','编制ABC分类'],['overseas','是否海外编制'],['place','编制工作地点'],['office','编制办公地点'],['center','一级成本中心'],['arrival','预计到岗时间'],['remark','备注'],['plannedEntryDate','计划调入日期'],['plannedExitDate','计划移出日期']].filter(([key])=>c.before?.[key]!==c.after?.[key]).map(([key,label])=>`<p>${label}：${esc(historyField(c.before?.[key]))} → ${esc(historyField(c.after?.[key]))}</p>`).join('')}</div>`).join('')}${!t.records.length?t.positions.map(c=>`<p>${esc(c.after?.name||c.before?.name)}</p>`).join(''):''}${!t.revoked?`<button class="text" data-history-undo="${t.id}">取消本次调整</button>`:''}</section>`).join('')||'<p class="empty">暂无本次会话产生的调整记录</p>';
}
$('#adjustment-history').onclick=()=>{renderHistory();open('history-dialog');};
$('#history-body').onclick=e=>{const id=e.target.closest('[data-history-undo]')?.dataset.historyUndo;if(id)undoAction(id);};
saveDraft=function(){try{localStorage.setItem('hrone-staffing-sketch-v1',JSON.stringify({records,positions,selectedOrg,bindingTransfers,staffingView,adjustmentHistory}));$('#save-status').textContent='草稿已保存在当前浏览器';return true;}catch{notify('当前浏览器无法保存草稿');return false;}};
function stopPositions(org){return positions.concat(stopState?.newPositions||[]).filter(p=>p.org===org&&!p.disabled&&p.id!==stopState?.positionId);}
function stopVacancies(org){const ids=new Set(stopState.rows.map(row=>row.id));return records.filter(r=>r.org===org&&!r.person&&!r.deleted&&!pending(r)&&!ids.has(r.id));}
function stopChoiceOptions(mode,org){return '<option value="">请选择</option>'+(mode==='target'?stopVacancies(org).map(r=>`<option value="${r.id}">${esc(r.code)} · ${esc(r.job)} · ${esc(r.grade)}</option>`):stopPositions(org).map(p=>`<option value="${p.id}">${esc(p.name)}（${esc(p.min)}～${esc(p.max)}）</option>`)).join('');}
function openPositionStop(id){
 const p=positions.find(p=>p.id===id);if(!p||p.disabled||!activeOrg(p.org))return;
 const bound=records.filter(r=>!r.deleted&&r.org===p.org&&r.job===p.name);
 stopState={positionId:id,newPositions:[],detailMode:false,rows:bound.map(r=>({id:r.id,checked:false,mode:r.person?'carry':'stop',dept:'',target:'',released:'stop'}))};
 $('#stop-position-title').textContent='停用职位 · '+p.name;
 $('#stop-summary').textContent=`${formatOrg(p.org)} / ${p.name}：${bound.length}份编制，在职${bound.filter(r=>r.person).length}份，空编${bound.filter(r=>!r.person).length}份。请安排去向后一次确认；取消不保存本次安排。`;
 $('#stop-bulk-dept').innerHTML='<option value="">请选择目标部门</option>'+orgOptions();$('#stop-bulk-mode').value='carry';$('#stop-bulk-dept').value='';$('#stop-error').textContent='';$('#stop-simple-dept').innerHTML='<option value="">请选择目标部门</option>'+orgOptions();$('#stop-simple-vacancies').value='stop';fillSimpleStopTarget();fillStopBulk();setStopDetailMode(false);renderStopRows();open('stop-position-dialog');
}
function renderStopRows(){
 if(!stopState)return;
 $('#stop-rows').innerHTML=stopState.rows.map(row=>{
  const r=records.find(r=>r.id===row.id),options=r.person?[['carry','携带原编制'],['target','使用目标部门编制']]:[['stop','随职位停用'],['move','编辑编制去向']];
  const select=(field,options,disabled=false)=>`<select data-stop-id="${row.id}" data-stop-field="${field}" aria-label="${esc(r.code)}${{mode:'处理方式',dept:'目标部门',target:'目标职位或编制',released:'原空编去向'}[field]}" ${disabled?'disabled':''}>${options}</select>`;
  return `<tr><td><input type="checkbox" data-stop-id="${row.id}" data-stop-field="checked" aria-label="选择停用安排${esc(r.code)}" ${row.checked?'checked':''}></td><td><strong>${esc(r.code)}</strong><span class="cell-text" title="${esc(staff(r)?.name||'空编制')}">${esc(staff(r)?.name||'空编制')}</span><small>${esc(r.grade)}</small></td><td>${select('mode',options.map(([value,label])=>`<option value="${value}">${label}</option>`).join(''))}</td><td>${select('dept','<option value="">请选择</option>'+orgOptions(),row.mode==='stop')}</td><td>${select('target',stopChoiceOptions(row.mode,row.dept),row.mode==='stop'||!row.dept)}</td><td>${row.mode==='target'?select('released','<option value="stop">停用原编制</option><option value="move">原编制改到目标部门同职位</option>'):'<span class="muted">'+('—')+'</span>'}</td></tr>`;
 }).join('')||'<tr><td colspan="6" class="empty">该职位下没有有效编制，可直接确认停用</td></tr>';
 for(const row of stopState.rows)for(const field of ['mode','dept','target','released']){const element=$(`#stop-rows [data-stop-id="${row.id}"][data-stop-field="${field}"]`);if(element)element.value=row[field];}
 $('#stop-selected-count').textContent=`已选 ${stopState.rows.filter(r=>r.checked).length} 条`;
 $('#stop-select-all').checked=!!stopState.rows.length&&stopState.rows.every(r=>r.checked);
 const showReleased=stopState.rows.some(row=>row.mode==='target');document.querySelectorAll('.stop-table tr').forEach(tr=>{if(tr.children.length===6)tr.lastElementChild.hidden=!showReleased;});
}
$('#stop-rows').onchange=e=>{if(!stopState||!$('#stop-position-dialog').open)return;const {stopId,stopField}=e.target.dataset;if(!stopId)return;const row=stopState.rows.find(r=>r.id===stopId);row[stopField]=stopField==='checked'?e.target.checked:e.target.value;if(['mode','dept'].includes(stopField))row.target='';$('#stop-error').textContent='';renderStopRows();};
$('#stop-select-all').onchange=e=>{if(!stopState)return;stopState.rows.forEach(r=>r.checked=e.target.checked);renderStopRows();};
function fillStopBulk(){const mode=$('#stop-bulk-mode').value;$('#stop-bulk-target').innerHTML=stopChoiceOptions(mode,$('#stop-bulk-dept').value);$('#stop-bulk-dept').disabled=mode==='stop';$('#stop-bulk-target').disabled=mode==='stop';}
$('#stop-bulk-dept').onchange=fillStopBulk;$('#stop-bulk-mode').onchange=fillStopBulk;
$('#stop-apply-bulk').onclick=()=>{
 if(!stopState)return;const selectedRows=stopState.rows.filter(r=>r.checked),mode=$('#stop-bulk-mode').value,dept=$('#stop-bulk-dept').value,target=$('#stop-bulk-target').value;
 if(!selectedRows.length){$('#stop-error').textContent='请先勾选需要批量设置的记录。';return;}
 if(selectedRows.some(row=>!!records.find(r=>r.id===row.id).person!==['carry','target'].includes(mode))){$('#stop-error').textContent='人员和空编制请分别勾选，选择适用的处理方式。';return;}
 if(mode!=='stop'&&(!dept||!target)){$('#stop-error').textContent='请选择目标部门及目标职位或编制。';return;}
 if(mode==='target'&&selectedRows.length>1){$('#stop-error').textContent='每位员工需占用不同编制，请逐行选择目标空编制。';return;}
 selectedRows.forEach(row=>Object.assign(row,{mode,dept,target}));$('#stop-error').textContent='';renderStopRows();
};
$('#stop-new-position').onclick=()=>{const org=$('#stop-bulk-dept').value;if(!activeOrg(org)){notify('请先在批量设置区域选择目标部门');return;}openPosition(org,'stop');};
$('#confirm-position-stop').onclick=()=>{
 if(!stopState)return;if(!stopState.detailMode){const dept=$('#stop-simple-dept').value,target=$('#stop-simple-target').value,vacancies=$('#stop-simple-vacancies').value;stopState.rows.forEach(row=>Object.assign(row,{mode:records.find(r=>r.id===row.id).person?'carry':vacancies==='move'?'move':'stop',dept,target}));}const p=positions.find(p=>p.id===stopState.positionId),ids=new Set(stopState.rows.map(row=>row.id)),current=records.filter(r=>!r.deleted&&r.org===p.org&&r.job===p.name);
 const fail=message=>{$('#stop-error').textContent=message;};
 if(current.length!==ids.size||current.some(r=>!ids.has(r.id)))return fail('职位下编制已变化，请关闭后重新打开停用安排。');
 const used=new Set(),allPositions=positions.concat(stopState.newPositions);
 for(const row of stopState.rows){
  const r=records.find(r=>r.id===row.id);
  if(row.mode==='stop'){if(r.person)return fail('在职编制不能直接停用，请先安排员工。');continue;}
  if(!activeOrg(row.dept))return fail(`${r.code}请选择有效目标部门。`);
  if(row.mode==='target'){
   const target=stopVacancies(row.dept).find(r=>r.id===row.target);
   if(!target||used.has(target.id))return fail(`${r.code}请选择未重复使用的有效空编制。`);used.add(target.id);
  }else{const target=allPositions.find(p=>p.id===row.target&&!p.disabled&&p.org===row.dept&&p.id!==stopState.positionId);if(!target)return fail(`${r.code}请选择其他有效目标职位。`);}
 }
 const before=snapshot();
 positions.push(...clone(stopState.newPositions));
 for(const row of stopState.rows){
  const r=records.find(r=>r.id===row.id);
  if(row.mode==='stop'){r.deleted=true;continue;}
  if(row.mode==='target'){
   const target=records.find(r=>r.id===row.target);target.person=r.person;r.person=null;
   if(row.released==='stop')r.deleted=true;else Object.assign(r,{org:target.org,job:target.job});
  }else{const target=positions.find(p=>p.id===row.target);Object.assign(r,{org:target.org,job:target.name});}
 }
 p.disabled=true;recordAction('停用职位',before);$('#stop-position-dialog').close();selected.clear();render();if($('#position-list').open)renderPositions();notify('职位及关联人员、编制安排已统一保存');stopState=null;
};
// Details keep actual appointment separate from planned headcount attributes.
showDetail=function(id){
 const r=records.find(r=>r.id===id);if(!r)return;const person=staff(r),p=positions.find(p=>p.org===r.org&&p.name===r.job);
 $('#detail-title').textContent=planningTab==='people'&&person?person.name:r.code;
 let body=`<section class="detail-section"><h3>编制信息</h3>${info([['编制编码',r.code],['编制部门',orgPlan.path(r.org),true],['编制职位',r.job,true],['编制职级',r.grade],['编制ABC分类',r.abc],['是否海外编制',r.overseas?'是':'否'],['一级成本中心',r.center],['编制工作地点',r.place,true],['编制办公地点',r.office,true],['预计到岗时间',r.arrival],['领色',p?.collar],['成本分类',p?.costClass],['备注',r.remark,true]])}</section>`;
 if(person)body+=`<section class="detail-section"><h3>绑定人员信息</h3>${info([['姓名',person.name],['工号',person.no],['任职部门',orgPlan.path(person.org,orgPlan.baseline)],['任职职位',person.job],['任职职级',person.grade],['计划调入日期',r.plannedEntryDate],['计划移出日期',r.plannedExitDate]])}</section>`;
 $('#detail-body').innerHTML=body;open('detail');
};
render();

function fillSimpleStopTarget(value){
 const select=$('#stop-simple-target'),previous=value||select.value;select.innerHTML=stopChoiceOptions('carry',$('#stop-simple-dept').value);select.value=previous;select.disabled=!$('#stop-simple-dept').value;
}
function setStopDetailMode(detail){
 stopState.detailMode=detail;$('#stop-simple').hidden=detail;$('#stop-details').hidden=!detail;$('#stop-detail-toggle').textContent=detail?'返回整体调整':'分别调整';
 if(!detail){const occupied=stopState.rows.some(row=>records.find(r=>r.id===row.id).person),empty=stopState.rows.some(row=>!records.find(r=>r.id===row.id).person);$('#stop-simple-destination').hidden=!occupied&&(!empty||$('#stop-simple-vacancies').value==='stop');$('#stop-simple-destination h3').textContent=occupied?'在职员工及其编制':'空编调整去向';$('#stop-simple-empty').hidden=!empty;$('#stop-simple').hidden=!stopState.rows.length;}
}
$('#stop-simple-dept').onchange=()=>fillSimpleStopTarget();
$('#stop-simple-new-position').onclick=()=>{const org=$('#stop-simple-dept').value;if(!activeOrg(org)){notify('请先选择目标部门');return;}openPosition(org,'stop');};
$('#stop-detail-toggle').onclick=()=>{if(!stopState)return;if(!stopState.detailMode){const dept=$('#stop-simple-dept').value,target=$('#stop-simple-target').value,vacancies=$('#stop-simple-vacancies').value;stopState.rows.forEach(row=>Object.assign(row,{mode:records.find(r=>r.id===row.id).person?'carry':vacancies==='move'?'move':'stop',dept,target}));}setStopDetailMode(!stopState.detailMode);renderStopRows();};

$('#stop-simple-vacancies').onchange=()=>{if(stopState)setStopDetailMode(false);};

// Binding from a vacancy is the target-headcount path of personnel adjustment.
const confirmBindBeforeFinal=$('#confirm-bind-person').onclick;
$('#confirm-bind-person').onclick=()=>{
 const before=snapshot(),wasOpen=$('#bind-person-dialog').open;
 confirmBindBeforeFinal();
 if(wasOpen&&!$('#bind-person-dialog').open)recordAction('人员调整（绑定人员）',before);
};

for(const kind of ['hc','position']){const error=$('#'+kind+'-error'),footer=$('#'+kind+'-form .modal-footer');footer.prepend(error);$('#'+kind+'-form').addEventListener('input',e=>{if(e.target.matches('[aria-invalid]'))e.target.removeAttribute('aria-invalid');error.textContent='';});}

const selectOrgConfirmed=e=>{const b=e.target.closest('[data-org]');if(b)planningTab=activeOrg(b.dataset.org)?'headcounts':'people';selectDepartment(e);};$('#org-tree').onclick=selectOrgConfirmed;$('#stopped-list').onclick=selectOrgConfirmed;

$('#edit-hc').onclick=()=>{const ids=[...selected].filter(id=>{const r=records.find(r=>r.id===id);return r&&!r.deleted&&activeOrg(r.org);});if(ids.length)openHC(ids,null,true);};
if(sourceView())planningTab='people';
