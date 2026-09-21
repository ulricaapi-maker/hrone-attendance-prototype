(function(){
 'use strict';
 const $=s=>document.querySelector(s),cases=['normal','rest-multiple','multi-dates'].map(id=>OvertimeCalculationCases.find(c=>c.id===id)),view=OvertimeCalculationView;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const families=[
  {title:'无扣减',rule:'填写时长与加班时长相同，下方不增加重复说明。',ids:['normal']},
  {title:'有扣减',rule:'填写时长与加班时长并列对照，下方列出扣减区间和时长。以多段休息为例；完整、部分休息复用此样式。',ids:['rest-multiple']},
  {title:'多组加班',rule:'每组独立查看，只展示所点组的明细。整单仅显示合计时长，不提供合计明细入口。',ids:['multi-dates']}
 ];
 const familyOf=c=>cases.indexOf(c);
 function fromHash(){const id=location.hash.slice(1),direct=cases.findIndex(c=>c.id===id);if(direct>=0)return direct;if(['rest-full','rest-left','rest-right','rest-overlap'].includes(id))return 1;if(id.startsWith('multi-'))return 2;return 0;}
 const pop=$('#scenePopover');let current=0,anchor=null;
 const valid=g=>g.resultMinutes>0&&!g.error;
 function close(restore=false){if(anchor){anchor.setAttribute('aria-expanded','false');if(restore)anchor.focus({preventScroll:true});}pop.hidden=true;anchor=null;}
 function position(){if(!anchor)return;const r=anchor.getBoundingClientRect(),pad=12,gap=10;if(r.bottom<0||r.top>innerHeight){close();return;}pop.style.maxHeight=(innerHeight-24)+'px';const box=pop.getBoundingClientRect();const below=innerHeight-r.bottom-gap-pad,above=r.top-gap-pad;const topSide=above>=box.height||(below<box.height&&above>below);pop.style.maxHeight=Math.max(100,topSide?above:below)+'px';const h=pop.getBoundingClientRect().height;const left=Math.max(pad,Math.min(r.right-box.width+24,innerWidth-box.width-pad));pop.style.left=left+'px';pop.style.top=Math.max(pad,Math.min(topSide?r.top-gap-h:r.bottom+gap,innerHeight-h-pad))+'px';pop.dataset.placement=topSide?'above':'below';pop.style.setProperty('--arrow-left',Math.max(20,Math.min(box.width-20,r.left+r.width/2-left))+'px');}
 function open(button,index){if(anchor===button){close(true);return;}close();const g=cases[current].groups[index];if(!valid(g))return;anchor=button;button.setAttribute('aria-expanded','true');pop.innerHTML=`<header class="popover-heading"><h3 id="scenePopoverTitle">加班计算明细</h3><button class="close" type="button" aria-label="关闭加班计算明细">×</button></header><div class="popover-content">${view.detail(g)}</div>`;pop.hidden=false;position();pop.querySelector('button').onclick=()=>close(true);}
 function nav(){const selected=familyOf(cases[current]);$('#caseNav').innerHTML=families.map((f,i)=>`<button type="button" data-family="${i}" aria-current="${i===selected}"><span>${String(i+1).padStart(2,'0')}</span>${esc(f.title)}</button>`).join('');$('#caseCount').textContent='3种样式 · 1条异常规则';}

 const field=(label,html)=>`<div class="scene-field"><span>${label}</span>${html}</div>`;
 const value=(v,placeholder='—')=>`<input readonly tabindex="-1" value="${esc(v||'')}" placeholder="${placeholder}">`;
 function render(index){close();current=index;const c=cases[index],fi=familyOf(c),f=families[fi];history.replaceState(null,'','#'+c.id);nav();$('#category').textContent=`${fi+1} / ${families.length} 类`;$('#caseTitle').textContent=f.title;$('#caseSetup').textContent=f.rule;$('#previous').disabled=fi===0;$('#next').disabled=fi===families.length-1;
  $('#exampleSetup').textContent=c.setup;
  $('#stage').innerHTML='<h3>加班申请</h3>'+c.groups.map((g,i)=>`<section class="scene-group">${c.groups.length>1?`<div class="scene-group-header">加班 ${i+1}</div>`:''}<div class="scene-fields">${field('加班日期',value(g.date,'请选择日期'))}${field('加班类型',value(g.type))}${field('开始时间',`<div class="time-field"><span class="time-day">当日</span><input readonly tabindex="-1" value="${g.start||''}" placeholder="请选择时间"></div>`)}${field('结束时间',`<div class="time-field"><span class="time-day">${g.endDay||(g.end==='00:00'?'次日':'当日')}</span><input readonly tabindex="-1" value="${g.end||''}" placeholder="请选择时间" aria-invalid="${Boolean(g.error)}"></div>${g.error?`<div class="scene-error">${esc(g.error)}</div>`:''}`)}${c.id==='missing-vesting'||c.id==='overseas-date'?field('加班归属日期',value(g.vesting,'请选择日期')):''}${field('加班时长',`<div class="duration-control"><output class="readonly duration-value">${g.resultMinutes===null?'—':view.hours(g.resultMinutes)}</output><button type="button" class="btn-text" data-detail="${i}" aria-expanded="false" aria-haspopup="dialog" aria-controls="scenePopover" ${valid(g)?'':'disabled'}>查看明细</button></div>`)}</div></section>`).join('')+(c.groups.length>1?`<div class="scene-total">合计加班时长 <strong>${c.groups.some(g=>g.resultMinutes===null)?'—':view.hours(c.groups.reduce((n,g)=>n+g.resultMinutes,0))}</strong></div>`:'')+(c.groups.some(g=>g.error)?'<div class="scene-blocked">请调整以上加班时间后再提交。</div>':'');
  $('#caseFootnote').textContent=c.assumption?'本例只确认日期字段的展示关系，计算前提见上方说明。':c.groups.some(g=>g.error)?'错误场景不打开计算明细；调整为有效时间后再查看。':c.groups.length>1?'点击各组“查看明细”，浮层只展示所点组，不展示其他组或每日汇总。':'点击“查看明细”可打开／关闭浮层，点击外部或按Esc收起。';

 }
 $('#caseNav').onclick=e=>{const b=e.target.closest('[data-family]');if(b)render(cases.findIndex(c=>c.id===families[Number(b.dataset.family)].ids[0]));};$('#stage').onclick=e=>{const b=e.target.closest('[data-detail]');if(b&&!b.disabled)open(b,Number(b.dataset.detail));};$('#previous').onclick=()=>render(cases.findIndex(c=>c.id===families[Math.max(0,familyOf(cases[current])-1)].ids[0]));$('#next').onclick=()=>render(cases.findIndex(c=>c.id===families[Math.min(families.length-1,familyOf(cases[current])+1)].ids[0]));

 document.addEventListener('pointerdown',e=>{if(anchor&&!pop.contains(e.target)&&!anchor.contains(e.target))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close(true);});window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
 window.addEventListener('hashchange',()=>render(fromHash()));render(fromHash());
})();
