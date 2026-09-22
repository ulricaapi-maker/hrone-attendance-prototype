/* HR-only attribution updates. Prototype changes stay in this tab's session storage. */
'use strict';
let moreAnchor=null,moreAnchorPosition=null,importDraft=null,importReadVersion=0;
function adjustmentReason(r){return mode!=='hr'?'仅 HR 可调整归属日期':!r?'未找到加班记录':policy(r).变更;}
function withdrawalReason(r){
 if(!r)return '未找到加班记录';
 if(isSelf&&r.no!==employees[selfEmployee].no)return '只能撤回本人的申请';
 if(r.sealed)return '考勤已封存，不可操作';
 return r.status==='审批中'?'':'仅审批中的单据可撤回';
}
function resubmissionReason(r){
 if(!r)return '未找到加班记录';
 if(isSelf&&r.no!==employees[selfEmployee].no)return '只能重新提交本人的申请';
 if(r.sealed)return '考勤已封存，不可操作';
 if(r.punchStatus==='审批中')return '已有补卡申请正在审批';
 return ['已撤回','已驳回'].includes(r.status)?'':'仅已撤回、已驳回的单据可重新提交';
}
function overtimeDetails(r){
 return (r.groups?.length?r.groups:[null]).map((g,index)=>({
  id:g?.detailId||`${r.id}-${index+1}`,recordId:r.id,index,name:r.name,no:r.no,
  start:g?`${g.date} ${g.start}`:r.start,
  end:g?`${g.endDay==='next'?nextDay(g.date):g.date} ${g.end}`:r.end,
  date:g?g.vesting||'':r.vestingDate||''
 }));
}
function closeMoreMenu(restore=false){$('#rowMoreMenu')?.remove();if(moreAnchor){moreAnchor.setAttribute('aria-expanded','false');if(restore&&moreAnchor.isConnected)moreAnchor.focus();}moreAnchor=null;moreAnchorPosition=null;}
function openMoreMenu(button){
 if(moreAnchor===button){closeMoreMenu(true);return;}closeMoreMenu();const r=records.find(x=>x.id===button.dataset.id);if(!r)return;
 moreAnchor=button;button.setAttribute('aria-expanded','true');const menu=document.createElement('div');menu.id='rowMoreMenu';menu.className='row-more-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','更多操作');
 const entries=[['撤销',policy(r).撤销],['撤回',withdrawalReason(r)],['重新提交',resubmissionReason(r)],...(mode==='hr'?[['调整归属日期',adjustmentReason(r)]]:[])];
 menu.innerHTML=entries.map(([name,reason])=>`<span title="${esc(reason)}"><button type="button" role="menuitem" class="btn-text" data-action="${name}" data-id="${esc(r.id)}" ${reason?'disabled':''}>${name}</button></span>`).join('');
 document.body.append(menu);const box=button.getBoundingClientRect(),width=menu.offsetWidth||164,height=menu.offsetHeight||88;
 moreAnchorPosition={top:box.top,left:box.left};
 menu.style.left=Math.max(8,Math.min(box.right-width,innerWidth-width-8))+'px';menu.style.top=Math.max(8,box.bottom+height+8>innerHeight?box.top-height-6:box.bottom+6)+'px';
 menu.querySelector('button:not(:disabled)')?.focus();
}
document.addEventListener('click',event=>{
 const more=event.target.closest('[data-more]');if(more){openMoreMenu(more);return;}
 const action=event.target.closest('#rowMoreMenu [data-action]');
 if(action&&!action.disabled&&action.dataset.action==='调整归属日期'){const r=records.find(x=>x.id===action.dataset.id);closeMoreMenu(true);openVestingAdjustment(r);return;}
 if(action&&!action.disabled&&action.dataset.action==='撤回'){const r=records.find(x=>x.id===action.dataset.id);closeMoreMenu(true);openWithdrawal(r);return;}
 if(action&&!action.disabled&&action.dataset.action==='重新提交'){const r=records.find(x=>x.id===action.dataset.id);closeMoreMenu(true);openResubmission(r);return;}
 if(!event.target.closest('#rowMoreMenu')||action&&!action.disabled)closeMoreMenu();
});
document.addEventListener('keydown',event=>{
 const menu=$('#rowMoreMenu');if(!menu)return;
 if(event.key==='Escape'){event.preventDefault();closeMoreMenu(true);}
 if(event.key==='Tab')closeMoreMenu();
 if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
  event.preventDefault();const buttons=[...menu.querySelectorAll('button:not(:disabled)')];if(!buttons.length)return;
  const current=buttons.indexOf(document.activeElement),index=event.key==='Home'?0:event.key==='End'?buttons.length-1:(current+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[index].focus();
 }
});
window.addEventListener('resize',()=>closeMoreMenu());
document.addEventListener('scroll',()=>{
 if(!moreAnchor||!moreAnchorPosition)return;
 const box=moreAnchor.getBoundingClientRect();
 // Ignore a queued scroll event from before opening; close only if the anchor moved.
 if(Math.abs(box.top-moreAnchorPosition.top)>1||Math.abs(box.left-moreAnchorPosition.left)>1)closeMoreMenu();
},true);
function validVestingDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number(value.slice(0,4))>0&&!Number.isNaN(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
function readCurrentOvertime(){try{const saved=JSON.parse(sessionStorage.getItem(storageKey));return Array.isArray(saved)?saved:records;}catch{return records;}}
function openWithdrawal(r){
 const reason=withdrawalReason(r);if(reason){toast(reason);return;}
 const expected=JSON.stringify(r),showDetail=!$('#detailPage').hidden;
 modal('撤回申请',`<p class="history-employee">${esc(r.name)} · ${esc(r.no)}</p><p>确认撤回当前加班${r.type==='申请'?'申请':esc(r.type)+'申请'}？</p><p class="withdraw-explanation">撤回后，当前单据的审批状态变为“已撤回”。</p><p id="withdrawError" class="import-error" role="alert"></p>`,`<button class="btn btn-default" id="cancelWithdraw">取消</button><button class="btn btn-primary" id="confirmWithdraw">确认撤回</button>`);
 $('#cancelWithdraw').onclick=closeModal;
 $('#confirmWithdraw').onclick=()=>{
  const next=structuredClone(readCurrentOvertime()),current=next.find(x=>x.id===r.id);
  if(withdrawalReason(current)||JSON.stringify(current)!==expected){$('#withdrawError').textContent='单据状态或内容已变化，当前不可撤回，请返回列表重新确认。';$('#confirmWithdraw').disabled=true;return;}
  current.status='已撤回';
  if(current.history?.length)current.history[0].status='已撤回';else current.history=[snapshot(current)];
  try{sessionStorage.setItem(storageKey,JSON.stringify(next));records=next;closeModal();render();if(showDetail)detail(current);toast('申请已撤回');}
  catch{$('#withdrawError').textContent='保存失败，请重试';}
 };
}
function openResubmission(r){
 const reason=resubmissionReason(r);if(reason){toast(reason);return;}
 const expected=JSON.stringify(r),showDetail=!$('#detailPage').hidden;
 modal('重新提交',`<div class="resubmit-confirmation"><p class="history-employee">${esc(r.name)} · ${esc(r.no)}</p><p>确认按当前单据内容重新提交审批？</p><p class="withdraw-explanation">加班时间、时长和归属日期保持不变。</p><p id="resubmitError" class="import-error" role="alert"></p></div>`,`<button class="btn btn-default" id="cancelResubmit">取消</button><button class="btn btn-primary" id="confirmResubmit">确认重新提交</button>`);
 $('#cancelResubmit').onclick=closeModal;
 $('#confirmResubmit').onclick=()=>{
  const next=structuredClone(readCurrentOvertime()),current=next.find(x=>x.id===r.id);
  if(resubmissionReason(current)||JSON.stringify(current)!==expected){$('#resubmitError').textContent='单据状态或内容已变化，请返回列表重新确认。';$('#confirmResubmit').disabled=true;return;}
  const history=current.history?.length?structuredClone(current.history):[snapshot(current)];
  current.status='审批中';current.submitted=new Date().toLocaleString('sv-SE').slice(0,16);
  current.history=[snapshot(current),...history];
  try{sessionStorage.setItem(storageKey,JSON.stringify(next));records=next;closeModal();render();if(showDetail)detail(current);toast('申请已重新提交');}
  catch{$('#resubmitError').textContent='保存失败，请重试';}
 };
}
function saveAttributions(changes){
 const next=structuredClone(readCurrentOvertime());
 for(const change of changes){const r=next.find(x=>x.id===change.recordId),d=r&&overtimeDetails(r).find(x=>x.id===change.id);if(!r||adjustmentReason(r)||!d||d.date!==change.oldDate||!validVestingDate(change.newDate))throw Error('记录已变化，请重新打开后操作');}
 for(const change of changes){const r=next.find(x=>x.id===change.recordId),d=overtimeDetails(r).find(x=>x.id===change.id);if(r.groups?.length){r.groups[d.index].vesting=change.newDate;r.groups[d.index].detailId=d.id;r.vestingDate=r.groups[0].vesting;}else r.vestingDate=change.newDate;}
 sessionStorage.setItem(storageKey,JSON.stringify(next));records=next;render();
 if(!$('#detailPage').hidden&&detailRecord){const current=records.find(r=>r.id===detailRecord.id);detail(current);}
}
function openVestingAdjustment(r){
 if(adjustmentReason(r)){toast(adjustmentReason(r));return;}
 const details=overtimeDetails(r),field=d=>`<label><span><i class="required">*</i>新归属日期</span><input type="date" data-vesting-input="${esc(d.id)}" value="${esc(d.date)}" required><span class="error" data-vesting-error="${esc(d.id)}" role="alert"></span></label>`;
 const hours=`<div class="vesting-info"><span>加班时长（h）</span><output data-overtime-hours>${esc(r.requestHours??r.hours??'—')}</output></div>`;
 const form=details.length===1?`<div class="vesting-summary"><div class="vesting-info"><span>加班开始时间</span><b>${esc(details[0].start)}</b></div><div class="vesting-info"><span>加班结束时间</span><b>${esc(details[0].end)}</b></div>${hours}</div><div class="operation-form vesting-date-fields"><label><span>原归属日期</span><input value="${esc(details[0].date)}" readonly></label>${field(details[0])}</div>`:`<div class="vesting-summary multiple-summary">${hours}</div><div class="history-scroll"><table class="attribution-table"><thead><tr><th>加班明细编号</th><th>加班起止时间</th><th>原归属日期</th><th>新归属日期</th></tr></thead><tbody>${details.map(d=>`<tr><td>${esc(d.id)}</td><td>${esc(d.start)}<br>～ ${esc(d.end)}</td><td>${esc(d.date)}</td><td class="operation-form">${field(d)}</td></tr>`).join('')}</tbody></table></div>`;
 modal('调整加班归属日期',`<div class="vesting-adjustment${details.length>1?' is-multiple':''}"><p class="history-employee">${esc(r.name)} · ${esc(r.no)}</p>${form}<p class="import-error" id="vestingError" role="alert"></p></div>`,`<button class="btn btn-default" id="cancelVesting">取消</button><button class="btn btn-primary" id="saveVesting">保存</button>`);
 $('#cancelVesting').onclick=closeModal;
 $('#saveVesting').onclick=()=>{
  let invalid=false;const changes=details.map(d=>{const input=[...document.querySelectorAll('[data-vesting-input]')].find(x=>x.dataset.vestingInput===d.id),error=input.parentElement.querySelector('.error');error.textContent=validVestingDate(input.value)?'':input.value?'请输入有效日期':'必填项不能为空';input.setAttribute('aria-invalid',String(Boolean(error.textContent)));if(error.textContent)invalid=true;return {...d,oldDate:d.date,newDate:input.value};});
  if(invalid){$('#dialogBody [aria-invalid="true"]')?.focus();return;}
  try{saveAttributions(changes);closeModal();toast('加班归属日期已更新');}catch(error){$('#vestingError').textContent=error.message;}
 };
}
function csvCell(value){return '"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';}
function vestingTemplate(){
 const headers=['加班明细编号','工号','姓名','加班开始时间','加班结束时间','原归属日期','新归属日期'];
 return '\ufeff'+[headers,...filtered.filter(r=>!adjustmentReason(r)).flatMap(r=>overtimeDetails(r).map(d=>[d.id,d.no,d.name,d.start,d.end,d.date,'']))].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
function downloadVestingTemplate(){
 const url=URL.createObjectURL(new Blob([vestingTemplate()],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='加班归属日期更新模板.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function parseImportCsv(text){
 // RFC 4180-style quoted fields, UTF-8 BOM, Excel CRLF and embedded newlines.
 text=String(text).replace(/^\ufeff/,'');const rows=[];let row=[],cell='',quoted=false,afterQuote=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;afterQuote=true;}}else cell+=c;continue;}
  if(afterQuote&&c!==','&&c!=='\n'&&c!=='\r')throw Error('CSV 格式错误，请使用下载的模板');
  if(c==='"'){if(cell)throw Error('CSV 引号格式错误');quoted=true;}
  else if(c===','){row.push(cell.trim());cell='';afterQuote=false;}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';afterQuote=false;}
  else cell+=c;
 }
 if(quoted)throw Error('CSV 引号未闭合');row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
function openVestingImport(){
 if(mode!=='hr')return;importDraft=null;importReadVersion++;
 modal('导入更新加班归属日期',`<div class="import-instructions"><p>下载当前查询结果中可调整的加班明细，填写“新归属日期”后上传。</p><p>每段加班一行，保留明细编号和原归属日期；新归属日期留空的行不更新。</p></div><button class="btn btn-default" id="downloadVestingTemplate">下载更新模板</button><label class="import-upload"><span>上传文件</span><input id="vestingImportFile" type="file" accept=".csv,text/csv"><small class="muted">CSV（UTF-8），可用 Excel 打开和编辑；日期格式 YYYY-MM-DD。</small></label><p id="importFileError" class="import-error" role="alert"></p><div id="importPreview" aria-live="polite"></div>`,`<button class="btn btn-default" id="cancelVestingImport">取消</button><button class="btn btn-primary" id="confirmVestingImport" disabled>确认更新</button>`);
 $('#downloadVestingTemplate').onclick=downloadVestingTemplate;$('#cancelVestingImport').onclick=()=>{importReadVersion++;closeModal();};
 $('#vestingImportFile').onchange=async event=>{
  importDraft=null;$('#confirmVestingImport').disabled=true;$('#importPreview').innerHTML='';$('#importFileError').textContent='';const file=event.target.files[0],ticket=++importReadVersion,control=event.target;if(!file)return;
  if(!file.name.toLowerCase().endsWith('.csv')){$('#importFileError').textContent='请上传 CSV 文件';return;}
  if(file.size>2*1024*1024){$('#importFileError').textContent='文件过大，请拆分为不超过 2 MB 的 CSV 文件';return;}
  try{const text=await file.text();if(ticket!==importReadVersion||!control.isConnected||$('#listOverlay').hidden)return;previewVestingImport(text);}catch{$('#importFileError').textContent='文件读取失败，请重新选择文件';}
 };
 $('#confirmVestingImport').onclick=()=>{
  if(!importDraft?.length)return;
  try{const count=importDraft.length;saveAttributions(importDraft);importDraft=null;$('#dialogBody').innerHTML=`<div class="import-result"><span class="status pass">更新完成</span><p>已更新 ${count} 条加班归属日期</p></div>`;$('#dialogFooter').innerHTML='<button class="btn btn-primary" id="finishVestingImport">完成</button>';$('#finishVestingImport').onclick=closeModal;}
  catch(error){$('#importFileError').textContent=error.message;$('#confirmVestingImport').disabled=true;importDraft=null;}
 };
}
function previewVestingImport(text){
 importDraft=null;$('#confirmVestingImport').disabled=true;$('#importPreview').innerHTML='';$('#importFileError').textContent='';
 try{
  const rows=parseImportCsv(text),headers=rows.shift()||[],required=['加班明细编号','原归属日期','新归属日期'];if(required.some(h=>headers.filter(x=>x===h).length!==1))throw Error('模板缺少字段或表头重复：加班明细编号、原归属日期、新归属日期');
  const current=readCurrentOvertime(),lookup=new Map(current.flatMap(r=>overtimeDetails(r).map(d=>[d.id,{r,d}]))),seen=new Map();let skipped=0;
  const candidates=rows.map((row,index)=>{
   const value=name=>row[headers.indexOf(name)]||'',newDate=value('新归属日期');if(!newDate){skipped++;return null;}
   const id=value('加班明细编号'),oldDate=value('原归属日期'),found=lookup.get(id);let error='';
   if(row.length!==headers.length)error='列数与模板不一致';else if(!found)error='加班明细编号不存在';else if(adjustmentReason(found.r))error=adjustmentReason(found.r);else if(!validVestingDate(newDate))error='新归属日期不是有效日期';else if(oldDate!==found.d.date)error='原归属日期与当前记录不一致，请重新下载模板';else if(headers.includes('工号')&&value('工号')!==found.r.no)error='工号与加班明细不一致';
   const item={id,recordId:found?.r.id,oldDate,newDate,row:index+2,name:found?.r.name||'—',no:found?.r.no||'—',start:found?.d.start||'—',end:found?.d.end||'—',error};
   if(seen.has(id)){item.error='加班明细编号重复';seen.get(id).error='加班明细编号重复';}else seen.set(id,item);return item;
  }).filter(Boolean);
  if(!candidates.length)throw Error('没有待更新数据，请填写至少一行新归属日期');const errors=candidates.filter(x=>x.error).length;
  $('#importPreview').innerHTML=`<p class="import-summary">待更新 ${candidates.length} 条 · 校验通过 ${candidates.length-errors} 条 · 错误 ${errors} 条${skipped?' · 跳过未填写 '+skipped+' 条':''}</p><div class="history-scroll"><table class="import-table"><thead><tr><th>行号</th><th>加班明细编号</th><th>员工</th><th>加班起止时间</th><th>原归属日期</th><th>新归属日期</th><th>校验结果</th></tr></thead><tbody>${candidates.map(x=>`<tr><td>${x.row}</td><td>${esc(x.id)}</td><td>${esc(x.name)}<br><span class="muted">${esc(x.no)}</span></td><td>${esc(x.start)}<br>～ ${esc(x.end)}</td><td>${esc(x.oldDate)}</td><td>${esc(x.newDate)}</td><td class="${x.error?'import-error':''}">${x.error?esc(x.error):'<span class="status pass">通过</span>'}</td></tr>`).join('')}</tbody></table></div>${errors?'<p class="import-error">请修正错误后重新上传，本次尚未更新任何记录。</p>':''}`;
  if(!errors){importDraft=candidates;$('#confirmVestingImport').disabled=false;}
 }catch(error){$('#importFileError').textContent=error.message;}
}
if(mode==='hr'){
 const button=document.createElement('button');button.id='importVesting';button.className='btn btn-default';button.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/></svg>导入更新归属日期';$('#export').before(button);button.onclick=openVestingImport;
}
