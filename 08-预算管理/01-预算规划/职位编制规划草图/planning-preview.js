/* Read-only view of the current in-memory planning result. */
const previewButton=document.createElement('button');previewButton.id='preview-plan';previewButton.textContent='预览规划结果';$('.dept-heading').appendChild(previewButton);
const resultDialog=document.createElement('dialog');resultDialog.id='planning-result';resultDialog.setAttribute('aria-labelledby','result-title');resultDialog.innerHTML=`<div class="result-top"><div><h2 id="result-title">规划结果预览</h2><span>二级A组织</span></div><button id="close-planning-result">返回调整</button></div><div class="result-layout"><aside class="result-aside"><h3>规划组织架构</h3><div id="result-org-tree"></div></aside><section class="result-workspace"><div class="result-heading"><div><h3 id="result-scope"></h3><p id="result-path"></p></div><div class="result-counts" id="result-counts"></div></div><div class="result-tools"><span>职位与编制配置</span><label id="result-children-label"><input type="checkbox" id="result-children">包含下级组织</label><button id="export-planning-result">导出</button></div><div class="result-scroll"><table id="result-table"><colgroup id="result-cols"></colgroup><thead id="result-head"></thead><tbody id="result-body"></tbody></table></div><div class="result-bottom" id="result-total"></div></section></div>`;document.body.appendChild(resultDialog);
let resultOrg=null;
const resultRoot=()=>orgPlan.nodes.find(n=>n.parent==null)?.id||'a';
function validResultPosition(p){return !p.disabled&&activeOrg(p.org);}
function resultScope(){return new Set([resultOrg,...(resultOrg===resultRoot()||$('#result-children').checked?orgPlan.descendants(resultOrg).filter(n=>activeOrg(n.id)).map(n=>n.id):[])]);}
function renderPlanningResult(){
 const root=resultRoot(),scope=resultScope(),validPositions=positions.filter(p=>scope.has(p.org)&&validResultPosition(p));
 const rows=records.filter(r=>!r.deleted&&scope.has(r.org)&&activeOrg(r.org)&&validPositions.some(p=>p.org===r.org&&p.name===r.job));
 const selectedNode=orgPlan.get(resultOrg),tree=[],orgOrder=[];
 function walk(parent,depth){orgPlan.nodes.filter(n=>n.parent===parent).filter(n=>activeOrg(n.id)).forEach(n=>{orgOrder.push(n.id);tree.push(`<button class="result-org ${n.id===resultOrg?'active':''}" data-result-org="${esc(n.id)}" style="padding-left:${18+depth*18}px" title="${esc(orgPlan.path(n.id))}">${esc(n.name)}${n.id===root?'<small>全部</small>':''}</button>`);walk(n.id,depth+1);});}
 walk(null,0);validPositions.sort((a,b)=>orgOrder.indexOf(a.org)-orgOrder.indexOf(b.org));$('#result-org-tree').innerHTML=tree.join('');
 $('#result-scope').textContent=resultOrg===root?'全部组织':selectedNode?.name||'';$('#result-path').textContent=resultOrg===root?orgPlan.get(root)?.name:orgPlan.path(resultOrg);
 $('#result-children-label').hidden=resultOrg===root;
 const occupied=rows.filter(r=>r.person).length;$('#result-counts').innerHTML=[['规划编制',rows.length],['在职',occupied],['空编',rows.length-occupied]].map(([label,count])=>`<div><span>${label}</span><b>${count}</b></div>`).join('');
 const cols=headcountColumns.filter(([key])=>!['check','actions','validity'].includes(key));
 $('#result-cols').innerHTML=cols.map(([key,label,width])=>`<col style="width:${width}px">`).join('');$('#result-table').style.width=cols.reduce((sum,c)=>sum+c[2],0)+'px';
 $('#result-head').innerHTML='<tr>'+cols.map(([key,label])=>`<th>${esc(label)}</th>`).join('')+'</tr>';
 const html=rows.map(r=>'<tr>'+cols.map(([key])=>{const value=key==='name'?(staff(r)?.name||''):dataValue(r,key);return `<td><span class="${!r.person&&key==='name'?'vacant-label':''}" title="${esc(value)}">${key==='name'?esc(value):esc(value)||'—'}</span></td>`;}).join('')+'</tr>').join('');
 $('#result-body').innerHTML=html||`<tr><td colspan="${cols.length}" class="empty">当前范围暂无职位与编制配置</td></tr>`;$('#result-total').textContent=`${validPositions.length} 个职位 · ${rows.length} 份编制`;
}
previewButton.onclick=()=>{resultOrg=activeOrg(selectedOrg)?selectedOrg:resultRoot();$('#result-children').checked=resultOrg===resultRoot()||$('#include-children').checked;renderPlanningResult();resultDialog.showModal();};
$('#result-org-tree').onclick=e=>{const id=e.target.closest('[data-result-org]')?.dataset.resultOrg;if(id){resultOrg=id;$('#result-children').checked=id===resultRoot();renderPlanningResult();$('.result-scroll').scrollTop=0;$('.result-scroll').scrollLeft=0;}};
$('#result-children').onchange=renderPlanningResult;
$('#close-planning-result').onclick=()=>resultDialog.close();

$('#export-planning-result').onclick=()=>{const scope=resultScope(),rows=records.filter(r=>!r.deleted&&scope.has(r.org)&&activeOrg(r.org)&&positions.some(p=>p.org===r.org&&p.name===r.job&&validResultPosition(p))),cols=headcountColumns.filter(([key])=>!['check','actions','validity'].includes(key));exportPlanningCsv('规划结果-'+formatOrg(resultOrg),cols.map(c=>c[1]),rows.map(r=>cols.map(([key])=>dataValue(r,key))));};
