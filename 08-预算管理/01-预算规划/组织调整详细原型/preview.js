'use strict';
let detailsOpen=false;
let previewMode='list',chartState={scale:1,x:0,y:0},chartBounds={w:0,h:0};
function detailHtml(){
 const n=plan.get(selectedId),old=plan.original(selectedId);if(!n)return '';
 if(typeof orgFullDetail==='function')return `<div class="detail-header"><h3>${esc(n.name)}</h3><button class="close" id="close-node-detail" aria-label="收起组织详情">×</button></div>${previewMode==='chart'?tagHtml(n,true)+orgChangeSummary(n,old):''}${orgFullDetail(n)}`;
 if(previewMode==='list')return `<div class="detail-header"><h3>${esc(n.name)}</h3><button class="close" id="close-node-detail" aria-label="收起组织详情">×</button></div><dl><dt>组织层级</dt><dd>${esc(plan.path(n.parent))}</dd><dt>负责人</dt><dd>${esc(n.owner)||'—'}</dd></dl>`;
 const changes=[];
 if(!old)changes.push('<dt>新增组织</dt><dd>本次规划新增</dd>');
 else {
  if(n.name!==old.name)changes.push(`<dt>组织名称</dt><dd>${esc(old.name)} → ${esc(n.name)}</dd>`);
  if(n.parent!==old.parent)changes.push(`<dt>上级调整前</dt><dd>${esc(plan.path(old.parent,plan.baseline))}</dd><dt>上级调整后</dt><dd>${esc(plan.path(n.parent))}</dd>`);
  if(n.owner!==old.owner)changes.push(`<dt>负责人调整</dt><dd>${esc(old.owner)||'未设置'} → ${esc(n.owner)||'未设置'}</dd>`);
  if(plan.tags(n).includes('顺序调整'))changes.push('<dt>展示顺序</dt><dd>已调整同一上级下的组织顺序</dd>');
 }
 return `<div class="detail-header"><h3>${esc(n.name)}</h3><button class="close" id="close-node-detail" aria-label="收起组织详情">×</button></div>${plan.tags(n).length?tagHtml(n,true):'<span class="muted">未调整</span>'}<dl><dt>组织层级</dt><dd>${esc(plan.path(n.parent))}</dd><dt>负责人</dt><dd>${esc(n.owner)||'—'}</dd>${changes.join('')}</dl>`;
}
function visibleChildren(n){return plan.nodes.filter(x=>x.parent===n.id&&($('#show-stopped').checked||!x.disabled));}
function renderPreview(){
 const wasOpen=$('.preview-body').classList.contains('details-open');
 if(selectedId&&(!plan.get(selectedId)||(plan.get(selectedId).disabled&&!$('#show-stopped').checked))){selectedId=null;detailsOpen=false;}
 $('#list-view').setAttribute('aria-pressed',previewMode==='list');$('#chart-view').setAttribute('aria-pressed',previewMode==='chart');
 $('#list-view').classList.toggle('selected',previewMode==='list');$('#chart-view').classList.toggle('selected',previewMode==='chart');
 $('#change-detail').innerHTML=detailHtml();$('#change-detail').hidden=!detailsOpen;$('.preview-body').classList.toggle('details-open',detailsOpen);if($('#close-node-detail'))$('#close-node-detail').onclick=()=>{detailsOpen=false;renderPreview();};
 if(previewMode==='chart'){renderChart();if(wasOpen!==detailsOpen)fitChart();return;}
 const rows=[];walk(plan.nodes,(n,depth)=>{
  if(n.disabled&&!$('#show-stopped').checked)return false;
  const kids=visibleChildren(n).length;
  rows.push(`<tr class="${n.id===selectedId?'preview-selected':''} ${n.disabled?'preview-stopped':''}"><td><div class="org-cell" style="padding-left:${depth*23}px"><button class="tree-toggle ${kids?'':'blank'} ${previewCollapsed.has(n.id)?'':'open'}" data-preview-toggle="${esc(n.id)}" aria-label="${previewCollapsed.has(n.id)?'展开':'收起'}${esc(n.name)}"></button><button class="text" data-select="${esc(n.id)}">${esc(n.name)}</button></div></td><td>${esc(n.owner)||'—'}</td></tr>`);
  return !previewCollapsed.has(n.id);
 });
 $('#preview-tree').classList.remove('chart-mode');
 $('#preview-tree').innerHTML=`<table class="preview-list"><thead><tr><th>组织名称</th><th>部门负责人</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
function renderChart(){
 const root=plan.get('a'),positions=[],edges=[];const widthMap=new Map();
 function measure(n){const kids=previewCollapsed.has(n.id)?[]:visibleChildren(n);const width=kids.length?Math.max(220,kids.reduce((s,k)=>s+measure(k),0)):220;widthMap.set(n.id,width);return width;}
 const total=measure(root);
 function place(n,left,depth){const w=widthMap.get(n.id),cx=left+w/2;positions.push({n,x:cx-98,y:depth*160+30});
  let start=left;const kids=previewCollapsed.has(n.id)?[]:visibleChildren(n);
  for(const kid of kids){const childCx=start+widthMap.get(kid.id)/2;edges.push(`M ${cx} ${depth*160+134} V ${depth*160+162} H ${childCx} V ${(depth+1)*160+30}`);place(kid,start,depth+1);start+=widthMap.get(kid.id);}
 }
 place(root,20,0);chartBounds={w:total+40,h:Math.max(...positions.map(x=>x.y))+128};
 const nodeHtml=positions.map(({n,x,y})=>`<div class="chart-node ${n.id===selectedId?'selected':''} ${n.disabled?'is-stopped':''}" style="left:${x}px;top:${y}px"><button class="chart-select" data-select="${esc(n.id)}"><strong>${esc(n.name)}</strong><span class="chart-owner">${esc(n.owner)||'未设置负责人'}</span><span class="chart-node-tags" title="${esc(plan.tags(n).join('、'))}">${tagHtml(n)}</span></button>${visibleChildren(n).length?`<button class="chart-toggle" data-preview-toggle="${esc(n.id)}" aria-label="${previewCollapsed.has(n.id)?'展开':'收起'}${esc(n.name)}">${previewCollapsed.has(n.id)?'+':'−'}</button>`:''}</div>`).join('');
 $('#preview-tree').classList.add('chart-mode');
 $('#preview-tree').innerHTML=`<div class="chart-controls"><label>定位组织 <select id="chart-locate"><option value="">请选择组织</option>${positions.map(({n})=>`<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('')}</select></label><div class="button-group"><button id="zoom-out" aria-label="缩小架构图">−</button><span id="zoom-value"></span><button id="zoom-in" aria-label="放大架构图">＋</button><button id="chart-fit">适应画布</button></div></div><div id="chart-viewport" class="chart-viewport" aria-label="组织架构图，可拖动画布或使用缩放按钮"><div id="chart-stage" style="width:${chartBounds.w}px;height:${chartBounds.h}px"><svg class="chart-lines" width="${chartBounds.w}" height="${chartBounds.h}" aria-hidden="true">${edges.map(p=>`<path d="${p}"/>`).join('')}</svg>${nodeHtml}</div></div>`;
 applyChartTransform();
 $('#zoom-in').onclick=()=>zoomChart(1.2);$('#zoom-out').onclick=()=>zoomChart(1/1.2);$('#chart-fit').onclick=fitChart;
 $('#chart-locate').onchange=e=>{const p=positions.find(x=>x.n.id===e.target.value);if(!p)return;selectedId=p.n.id;detailsOpen=true;$('#change-detail').innerHTML=detailHtml();$('#change-detail').hidden=false;$('.preview-body').classList.add('details-open');$('#close-node-detail').onclick=()=>{detailsOpen=false;renderPreview();};document.querySelectorAll('.chart-node').forEach(node=>node.classList.toggle('selected',node.querySelector('[data-select]').dataset.select===selectedId));const v=$('#chart-viewport');chartState.x=v.clientWidth/2-(p.x+98)*chartState.scale;chartState.y=v.clientHeight/2-(p.y+52)*chartState.scale;applyChartTransform();};
 const v=$('#chart-viewport');let pan=null;
 v.onpointerdown=e=>{if(e.target.closest('button'))return;pan={x:e.clientX,y:e.clientY,sx:chartState.x,sy:chartState.y};v.setPointerCapture(e.pointerId);v.classList.add('panning');};
 v.onpointermove=e=>{if(pan){chartState.x=pan.sx+e.clientX-pan.x;chartState.y=pan.sy+e.clientY-pan.y;applyChartTransform();}};
 v.onpointerup=v.onpointercancel=()=>{pan=null;v.classList.remove('panning');};
 v.onwheel=e=>{e.preventDefault();zoomChart(e.deltaY<0?1.1:1/1.1);};
}
function applyChartTransform(){const stage=$('#chart-stage');if(!stage)return;stage.style.transform=`translate(${chartState.x}px,${chartState.y}px) scale(${chartState.scale})`;$('#zoom-value').textContent=Math.round(chartState.scale*100)+'%';}
function zoomChart(factor){const v=$('#chart-viewport');const previous=chartState.scale;const next=Math.max(.25,Math.min(2,previous*factor));chartState.x=v.clientWidth/2-(v.clientWidth/2-chartState.x)*next/previous;chartState.y=v.clientHeight/2-(v.clientHeight/2-chartState.y)*next/previous;chartState.scale=next;applyChartTransform();}
function fitChart(){const v=$('#chart-viewport');if(!v)return;chartState.scale=Math.max(.25,Math.min(1,(v.clientWidth-30)/chartBounds.w,(v.clientHeight-30)/chartBounds.h));chartState.x=(v.clientWidth-chartBounds.w*chartState.scale)/2;chartState.y=(v.clientHeight-chartBounds.h*chartState.scale)/2;applyChartTransform();}
$('#preview').onclick=()=>{detailsOpen=false;selectedId=null;previewCollapsed.clear();open('preview-dialog');renderPreview();if(previewMode==='chart')fitChart();};
$('#list-view').onclick=()=>{previewMode='list';renderPreview();};
$('#chart-view').onclick=()=>{previewMode='chart';renderPreview();fitChart();};
$('#show-stopped').onchange=()=>{renderPreview();if(previewMode==='chart')fitChart();};
$('#preview-expand').onclick=()=>{previewCollapsed.clear();renderPreview();if(previewMode==='chart')fitChart();};
$('#preview-collapse').onclick=()=>{previewCollapsed=new Set(plan.nodes.filter(x=>x.parent).map(x=>x.id));renderPreview();if(previewMode==='chart')fitChart();};
$('#preview-tree').onclick=e=>{const toggle=e.target.closest('[data-preview-toggle]');if(toggle){const id=toggle.dataset.previewToggle;previewCollapsed.has(id)?previewCollapsed.delete(id):previewCollapsed.add(id);renderPreview();return;}const node=e.target.closest('[data-select]');if(node){selectedId=node.dataset.select;detailsOpen=true;renderPreview();}};
