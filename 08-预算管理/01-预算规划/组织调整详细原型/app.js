'use strict';
const $=s=>document.querySelector(s), key='hrone-org-plan-demo-v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved=null;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
let plan=new OrgPlan(saved?.nodes), collapsed=new Set(), previewCollapsed=new Set(), filters={name:'',owner:''};
let editId=null,selectedId='a',confirmCallback=null,toastTimer,filterKey=null;
let persisted=JSON.stringify(plan.nodes);
const action=(label,op,id)=>`<button class="text" data-op="${op}" data-id="${esc(id)}">${label}</button>`;
const tagHtml=(n,all=false)=>plan.tags(n).filter(tag=>all||tag!=='顺序调整').map(tag=>`<span class="tag ${tag==='新增'?'tag-new':tag==='拟定停用'?'tag-stopped':'tag-change'}">${tag}</span>`).join('');
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3200);}
function open(id){closeFilter();const dlg=document.getElementById(id);if(!dlg.open)dlg.showModal();}
function walk(nodes,callback,parent=null,depth=0){nodes.filter(n=>n.parent===parent).forEach(n=>{if(callback(n,depth)!==false)walk(nodes,callback,n.id,depth+1);});}
function render(){
 const searching=Object.values(filters).some(Boolean), visible=new Set(),matches=new Set();
 if(searching)plan.nodes.forEach(n=>{if(Object.entries(filters).every(([k,v])=>String(n[k]||'').toLowerCase().includes(v.toLowerCase()))){matches.add(n.id);let curr=n;while(curr){visible.add(curr.id);curr=plan.get(curr.parent);}}});
 const rows=[];
 walk(plan.nodes,(n,depth)=>{
  if(searching&&!visible.has(n.id))return false;
  const hasChildren=plan.nodes.some(x=>x.parent===n.id);
  let ops='';
  if(!n.parent)ops=action('新增下级','add',n.id);
  else if(n.disabled)ops=action('取消停用','restore',n.id);
  else ops=action('编辑','edit',n.id)+action('新增下级','add',n.id)+action(plan.original(n.id)?'停用':'取消新增',plan.original(n.id)?'stop':'remove',n.id);
  rows.push(`<tr data-row="${esc(n.id)}" class="${!n.parent?'root-row':''} ${hasChildren?'branch-row':''} ${n.disabled?'stopped-row':!plan.original(n.id)?'added-row':''} ${searching&&!matches.has(n.id)?'context-row':''}"><td class="tree-cell"><div class="org-cell" style="padding-left:${depth*24}px">${n.parent&&!n.disabled?`<button class="drag-handle" data-drag="${esc(n.id)}" aria-label="拖动${esc(n.name)}" title="拖动排序或调整上级；方向键可同级排序">⠿</button>`:'<span class="drag-spacer"></span>'}<button class="tree-toggle ${hasChildren?'':'blank'} ${!collapsed.has(n.id)||searching?'open':''}" data-op="toggle" data-id="${esc(n.id)}" aria-label="${collapsed.has(n.id)?'展开':'收起'}${esc(n.name)}" ${hasChildren?`aria-expanded="${!collapsed.has(n.id)||searching}"`:'tabindex="-1"'}></button><span class="org-label">${esc(n.name)}</span>${tagHtml(n)}</div></td><td title="${esc(n.parent?plan.path(n.parent):'—')}">${esc(n.parent?plan.get(n.parent)?.name:'—')}</td><td>${esc(orgLevelName(n.id))}</td><td>${esc(n.roles?.[ORG_OWNER_ROLE]||n.owner)||'—'}</td><td><div class="actions">${ops}</div></td></tr>`);
  return searching||!collapsed.has(n.id);
 });
 $('#org-rows').innerHTML=rows.join('')||'<tr><td colspan="5" class="empty">没有符合条件的组织</td></tr>';
 $('#table-info').textContent=searching?`匹配 ${matches.size} 个组织，保留上级路径`:`共 ${plan.nodes.length} 个组织`;
 document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('applied',!!filters[b.dataset.filter]));
 $('#save-time').textContent=JSON.stringify(plan.nodes)!==persisted?'有未保存的调整':saved?.time?`草稿保存于 ${saved.time}`:'';
}
function closeFilter(){$('#filter-popover').hidden=true;filterKey=null;}
function filterPopover(button){
 const field=button.dataset.filter;if(filterKey===field&&!$('#filter-popover').hidden){closeFilter();return;}
 const labels={name:'组织名称',code:'组织编码',owner:'部门负责人'};
 const popup=$('#filter-popover');filterKey=field;
 popup.innerHTML=`<form id="filter-form"><label>${labels[field]}<input id="filter-value" aria-label="${labels[field]}筛选条件" value="${esc(filters[field])}" placeholder="请输入关键词" autocomplete="off"></label><div class="button-group"><button type="button" id="filter-clear">重置</button><button type="submit" class="primary">确定</button></div></form>`;
 const r=button.getBoundingClientRect();popup.style.left=Math.max(8,Math.min(r.right-260,innerWidth-268))+'px';popup.style.top=Math.min(r.bottom+8,innerHeight-170)+'px';popup.hidden=false;$('#filter-value').focus();
 $('#filter-form').onsubmit=e=>{e.preventDefault();filters[field]=$('#filter-value').value.trim();closeFilter();render();};
 $('#filter-clear').onclick=()=>{filters[field]='';closeFilter();render();};
}
function edit(id,parent){
 editId=id;const n=id?plan.get(id):null;
 $('#editor-title').textContent=n?'编辑组织':'新增下级';
 $('#org-name').value=n?.name||'';
 const excluded=n?new Set([n.id,...plan.descendants(n.id).map(x=>x.id)]):new Set();
 const opts=[];walk(plan.nodes,x=>{if(!x.disabled&&!excluded.has(x.id))opts.push(`<option value="${esc(x.id)}">${esc(plan.path(x.id))}</option>`);});
 $('#org-parent').innerHTML=opts.join('');$('#org-parent').value=n?.parent||parent;
 orgOrderTouched=false;fillOrgFields(n);$('#editor-error').textContent='';open('editor');$('#org-name').focus();
}
function confirmAction(title,body,label,fn){$('#confirm-title').textContent=title;$('#confirm-body').innerHTML=body;$('#confirm-action').textContent=label;$('#confirm-action').hidden=false;confirmCallback=fn;open('confirm');}
function handleAction(op,id){
 const n=plan.get(id);if(!n)return;
 if(op==='toggle'){collapsed.has(id)?collapsed.delete(id):collapsed.add(id);render();}
 if(op==='add')edit(null,id);
 if(op==='edit')edit(id);
 if(op==='stop'){
  const affected=[n,...plan.descendants(id)].filter(x=>!x.disabled);
  confirmAction('停用组织',`<p>确认将“${esc(n.name)}”设为拟定停用？</p>${affected.length>1?`<p>以下 ${affected.length} 个组织将一并拟定停用：</p><div class="affected">${affected.map(x=>esc(plan.path(x.id))).join('<br>')}</div>`:''}<p class="muted">如需保留下级组织，请先调整其上级。编制随组织停用；第二步仅需安排人员。本次操作仅影响本次规划。</p>`,'确认停用',()=>{plan.stop(id);render();toast('已设为拟定停用');});
 }
 if(op==='restore'){
  try{plan.restore(id);render();toast('已取消停用');}catch(e){toast(e.message);}
 }
 if(op==='remove'){
  if(plan.descendants(id).length){confirmAction('无法取消新增','<p>该组织下还有下级组织，请先调整下级归属或取消下级新增。</p>','知道了',()=>{});return;}
  confirmAction('取消新增',`<p>确认取消新增“${esc(n.name)}”？</p><p class="muted">该组织将从本次规划中移除。</p>`,'确认取消新增',()=>{plan.removeNew(id);render();toast('已取消新增');});
 }
}
$('#org-rows').addEventListener('click',e=>{const b=e.target.closest('[data-op]');if(b)handleAction(b.dataset.op,b.dataset.id);});
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>filterPopover(b));
document.addEventListener('click',e=>{if(!e.target.closest('#filter-popover,[data-filter]'))closeFilter();const b=e.target.closest('[data-close]');if(b)document.getElementById(b.dataset.close).close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFilter();});
$('#confirm-action').onclick=()=>{try{confirmCallback?.();$('#confirm').close();}catch(e){toast(e.message);}};
$('#org-form').onsubmit=e=>{
 e.preventDefault();
 try{const old=editId?plan.get(editId).parent:null;const parent=$('#org-parent').value;const details=readOrgFields(editId?plan.get(editId):null);if(!Number.isInteger(details.sortOrder)||details.sortOrder<0||details.sortOrder>100000)throw Error('排序码请输入0至100000的整数。');plan.save({name:$('#org-name').value,parent,owner:details.roles[ORG_OWNER_ROLE]||'',details},editId);collapsed.delete(parent);if(old)collapsed.delete(old);$('#editor').close();render();toast(editId?'组织已更新':'已新增组织');}
 catch(error){$('#editor-error').textContent=error.message;}
};
$('#expand').onclick=()=>{collapsed.clear();render();};
$('#collapse').onclick=()=>{collapsed=new Set(plan.nodes.filter(x=>x.parent).map(x=>x.id));render();};
function persist(){
 const now=new Date();const time=now.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
 try{localStorage.setItem(key,JSON.stringify({nodes:plan.nodes,time}));saved={time};persisted=JSON.stringify(plan.nodes);render();return true;}catch{toast('浏览器未允许保存，请保留当前页面。');return false;}
}
$('#draft').onclick=()=>{if(persist())toast('草稿已保存在当前浏览器');};
$('#next').onclick=()=>{
 if(!persist())return;
 location.assign('../职位编制规划草图/index.html');
};
$('#reset').onclick=()=>confirmAction('恢复示例','<p>将清除当前浏览器保存的演示草稿，恢复初始化架构。</p>','确认恢复',()=>{try{localStorage.removeItem(key);}catch{}plan=new OrgPlan();saved=null;persisted=JSON.stringify(plan.nodes);collapsed.clear();filters={name:'',owner:''};render();toast('已恢复示例');});
window.addEventListener('beforeunload',e=>{if(JSON.stringify(plan.nodes)!==persisted){e.preventDefault();e.returnValue='';}});
render();

let orgOrderTouched=false;$('#org-sort').oninput=()=>orgOrderTouched=true;$('#org-parent').onchange=()=>{updateOrgLevel();if(!editId&&!orgOrderTouched)$('#org-sort').value=Math.max(0,...plan.nodes.filter(n=>n.parent===$('#org-parent').value).map(n=>n.sortOrder||0))+1;};
$('#org-virtual').onchange=()=>document.querySelectorAll('[data-role-required]').forEach(el=>{const r=orgRoles().find(r=>r.key===el.dataset.roleRequired);el.innerHTML=formalBadge(r.fieldRequired==='1'&&$('#org-virtual').value!=='true');});
$('#toggle-languages').onclick=()=>{const panel=$('#org-language-panel');panel.hidden=!panel.hidden;$('#toggle-languages').setAttribute('aria-expanded',String(!panel.hidden));};

$('#import-org').onclick=()=>toast('导入功能待完善');

// Install the requested presentation sample once per browser, without replacing existing plans.
(function installCustomerOperationsExample(){
 const marker='hrone-org-demo-customer-ops-v1';let installed=false;try{installed=localStorage.getItem(marker)==='1';}catch{}
 if(installed)return;
 if(!plan.nodes.some(n=>n.name==='客户运营部')){
  const node={id:'demo-customer-operations',parent:'a',name:'客户运营部',owner:'陈经理',establishDate:'2027-01-01',isVirtualOrg:false,sortOrder:Math.max(0,...plan.nodes.filter(n=>n.parent==='a').map(n=>n.sortOrder||0))+1,primaryCostCenter:'示例成本中心A-100%',costClassification:'职能',roles:{RM00001:'陈经理',RM00002:'李HRBP',RM00071:'周HRBP负责人'}};
  plan.nodes.push(normalizeOrgNode(node,plan.nodes));
  if(!persist())return;
 }
 try{localStorage.setItem(marker,'1');}catch{}
 render();
})();
