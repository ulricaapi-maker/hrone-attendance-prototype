/* Copy position attributes into a new position; never copy employees or headcounts. */
const copyPositionButton=document.createElement('button');copyPositionButton.id='copy-existing-position';copyPositionButton.className='primary';copyPositionButton.textContent='复制已有职位';$('#manager-add-position').after(copyPositionButton);
const copyPositionDialog=document.createElement('dialog');copyPositionDialog.id='copy-position-dialog';copyPositionDialog.setAttribute('aria-labelledby','copy-position-title');copyPositionDialog.innerHTML=`<div class="modal-header"><h2 id="copy-position-title">复制已有职位</h2><button class="close" data-close="copy-position-dialog" aria-label="关闭职位选择">×</button></div><div class="modal-body"><div class="copy-position-scroll"><table><thead id="copy-position-head"></thead><tbody id="copy-position-rows"></tbody></table></div></div><div class="modal-footer"><button data-close="copy-position-dialog">取消</button><button id="confirm-copy-position" class="primary" disabled>下一步</button></div>`;document.body.appendChild(copyPositionDialog);
let copySourcePosition=null,copyPositionFilters={};
const copyPositionFields=[['name','名称'],['org','部门'],['sequence','职序'],['min','最低职级'],['max','最高职级']];
const copyFilterPopup=document.createElement('div');copyFilterPopup.id='copy-position-filter-popup';copyFilterPopup.className='position-filter-popup';copyFilterPopup.hidden=true;copyPositionDialog.appendChild(copyFilterPopup);
function copyPositionValue(p,key){return key==='org'?formatOrg(p.org):p[key]||'';}
function renderCopyPositions(){
 const list=positions.filter(p=>!p.disabled&&activeOrg(p.org)&&Object.entries(copyPositionFilters).every(([key,value])=>String(copyPositionValue(p,key)).toLowerCase().includes(value.toLowerCase())));
 if(!list.some(p=>p.id===copySourcePosition))copySourcePosition=null;
 $('#copy-position-head').innerHTML='<tr><th></th>'+copyPositionFields.map(([key,label])=>`<th>${esc(label)}<button class="filter ${copyPositionFilters[key]?'active':''}" data-copy-filter="${key}" aria-label="筛选${label}"></button></th>`).join('')+'</tr>';
 $('#copy-position-rows').innerHTML=list.map(p=>`<tr><td><input type="radio" name="copy-position" data-copy-position="${esc(p.id)}" aria-label="选择${esc(formatOrg(p.org))}的${esc(p.name)}" ${copySourcePosition===p.id?'checked':''}></td>${copyPositionFields.map(([key])=>`<td><span title="${esc(copyPositionValue(p,key))}">${esc(copyPositionValue(p,key))}</span></td>`).join('')}</tr>`).join('')||'<tr><td colspan="6" class="empty">暂无符合条件的职位</td></tr>';
 $('#confirm-copy-position').disabled=!copySourcePosition;
}
copyPositionButton.onclick=()=>{copySourcePosition=null;copyPositionFilters={};copyFilterPopup.hidden=true;renderCopyPositions();copyPositionDialog.showModal();};
$('#copy-position-rows').onchange=e=>{const id=e.target.dataset.copyPosition;if(id){copySourcePosition=id;renderCopyPositions();}};
$('#copy-position-head').onclick=e=>{
 const button=e.target.closest('[data-copy-filter]');if(!button)return;
 const key=button.dataset.copyFilter,label=copyPositionFields.find(field=>field[0]===key)[1];
 copyFilterPopup.innerHTML=`<form id="copy-filter-form"><label>${esc(label)}<input id="copy-filter-value" aria-label="${esc(label)}筛选条件" value="${esc(copyPositionFilters[key]||'')}" placeholder="请输入关键词"></label><div class="buttons"><button type="button" id="copy-filter-reset">重置</button><button type="submit" class="primary">确定</button></div></form>`;
 const box=button.getBoundingClientRect();copyFilterPopup.style.left=Math.max(12,Math.min(innerWidth-270,box.right-250))+'px';copyFilterPopup.style.top=Math.min(box.bottom+6,innerHeight-180)+'px';copyFilterPopup.hidden=false;
 $('#copy-filter-form').onsubmit=event=>{event.preventDefault();const value=$('#copy-filter-value').value.trim();if(value)copyPositionFilters[key]=value;else delete copyPositionFilters[key];copyFilterPopup.hidden=true;renderCopyPositions();};
 $('#copy-filter-reset').onclick=()=>{delete copyPositionFilters[key];copyFilterPopup.hidden=true;renderCopyPositions();};$('#copy-filter-value').focus();
};
copyPositionDialog.addEventListener('click',e=>{if(!e.target.closest('#copy-position-filter-popup,[data-copy-filter]'))copyFilterPopup.hidden=true;});
copyPositionDialog.addEventListener('close',()=>copyFilterPopup.hidden=true);
$('#confirm-copy-position').onclick=()=>{const source=positions.find(p=>p.id===copySourcePosition&&!p.disabled&&activeOrg(p.org));if(!source)return;copyPositionDialog.close();openPosition(activeOrg(selectedOrg)?selectedOrg:source.org);positionEditing=null;$('#position-title').textContent='复制职位';$('#position-name').value=source.name;$('#position-min').value=source.min;$('#position-max').value=source.max;for(const key of ['sequence','family','category','costClass','collar'])$('#position-'+key).value=source[key]||'';$('#position-order').value=String(Math.max(0,...positions.filter(p=>p.org===$('#position-dept').value).map(p=>Number(p.order)||0))+1);$('#position-code').value='';};
