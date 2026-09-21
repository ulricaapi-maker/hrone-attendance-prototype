/* Mobile records use the same filters and eligibility as PC, with the leave-record layout. */
if(isMobile){
 const filters=document.createElement('section');filters.className='mobile-record-filters';filters.setAttribute('aria-label','筛选加班记录');
 filters.innerHTML=`<select id="mobileFilterKind" aria-label="加班类型">${$('#filterKind').innerHTML}</select><select id="mobileFilterStatus" aria-label="审批状态">${$('#filterStatus').innerHTML}</select><div class="range-query"><button type="button" class="date-range-trigger" data-range-start="filterDateStart" data-range-end="filterDateEnd" aria-expanded="false" aria-label="选择加班日期范围"><span class="mobile-date-label">加班日期</span><span data-range-start-label hidden></span><span data-range-end-label hidden></span></button></div>`;
 $('.search-bar').after(filters);
 for(const [mobileId,pcId,label]of[['mobileFilterKind','filterKind','加班类型'],['mobileFilterStatus','filterStatus','审批状态']]){const select=$('#'+mobileId);select.options[0].textContent=label;select.onchange=()=>{$('#'+pcId).value=select.value;select.classList.toggle('selected',Boolean(select.value));page=1;render();};}
 const trigger=filters.querySelector('.date-range-trigger');
 function applyMobileRange(e){if(!e.target.closest('[data-range-confirm],[data-range-clear]'))return;const start=$('#filterDateStart').value,end=$('#filterDateEnd').value;trigger.classList.toggle('selected',Boolean(start||end));trigger.title=start||end?`${start||'不限'} ～ ${end||'不限'}`:'加班日期';page=1;render();}
 trigger.onclick=e=>{e.stopPropagation();openRangePicker(trigger);activeRangePicker?.popover.addEventListener('click',applyMobileRange);};
}
