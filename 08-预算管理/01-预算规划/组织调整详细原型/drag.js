'use strict';
let dragging=null,dragGhost=null;
function clearDrag(){document.querySelectorAll('.drop-before,.drop-after,.drop-inside').forEach(r=>r.classList.remove('drop-before','drop-after','drop-inside'));dragGhost?.remove();dragGhost=null;dragging=null;document.body.classList.remove('dragging');}
function dropMove(source,target,position){
 try{
  const n=plan.get(source),oldParent=n.parent,parent=plan.validateMove(source,target,position);
  const commit=()=>{plan.move(source,target,position);collapsed.delete(parent);render();toast(parent===oldParent?'组织位置已调整':'组织上级已调整');};
  if(parent!==n.parent){const old=plan.path(n.parent);confirmAction('调整组织上级',`<p>将“${esc(n.name)}”及其下级一起移动？</p><div class="affected">原上级：${esc(old)}<br>目标上级：${esc(plan.path(parent))}</div>`,'确认移动',commit);}
  else commit();
 }catch(e){toast(e.message);}
}
$('#org-rows').addEventListener('pointerdown',e=>{
 const h=e.target.closest('[data-drag]');if(!h||e.button!==0)return;
 if(Object.values(filters).some(Boolean)){toast('请先清除表头筛选，再拖动组织。');return;}
 const n=plan.get(h.dataset.drag);dragging={id:n.id,startX:e.clientX,startY:e.clientY,active:false,target:null,position:null,error:null};h.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove',e=>{
 if(!dragging)return;
 if(!dragging.active&&Math.hypot(e.clientX-dragging.startX,e.clientY-dragging.startY)<7)return;
 e.preventDefault();
 if(!dragging.active){dragging.active=true;document.body.classList.add('dragging');dragGhost=document.createElement('div');dragGhost.className='drag-ghost';document.body.appendChild(dragGhost);}
 const source=plan.get(dragging.id),row=document.elementFromPoint(e.clientX,e.clientY)?.closest('#org-rows tr[data-row]');
 document.querySelectorAll('.drop-before,.drop-after,.drop-inside').forEach(r=>r.classList.remove('drop-before','drop-after','drop-inside'));
 dragging.target=null;dragging.error=null;
 let label='拖到行间调整顺序，拖到组织上调整上级';
 if(row){const target=plan.get(row.dataset.row),r=row.getBoundingClientRect(),ratio=(e.clientY-r.top)/r.height;
  const position=ratio<.26?'before':ratio>.74?'after':'inside';
  try{plan.validateMove(source.id,target.id,position);dragging.target=target.id;dragging.position=position;row.classList.add('drop-'+position);label=position==='inside'?`放入“${target.name}”下`:`放到“${target.name}”${position==='before'?'之前':'之后'}`;}
  catch(error){dragging.error=error.message;label=error.message;}
 }
 dragGhost.textContent=source.name+' · '+label;dragGhost.style.left=Math.max(8,Math.min(e.clientX+16,innerWidth-330))+'px';dragGhost.style.top=Math.max(8,Math.min(e.clientY+15,innerHeight-70))+'px';dragGhost.classList.toggle('invalid',!!dragging.error);
 if(e.clientY>innerHeight-100)window.scrollBy(0,10);if(e.clientY<120)window.scrollBy(0,-10);
},{passive:false});
document.addEventListener('pointerup',()=>{if(!dragging)return;const state={...dragging};clearDrag();if(state.active&&state.target)dropMove(state.id,state.target,state.position);else if(state.active&&state.error)toast(state.error);});
document.addEventListener('pointercancel',clearDrag);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dragging){clearDrag();return;}const h=e.target.closest?.('[data-drag]');if(!h||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(Object.values(filters).some(Boolean)){toast('请先清除表头筛选，再调整顺序。');return;}const n=plan.get(h.dataset.drag),siblings=plan.nodes.filter(x=>x.parent===n.parent),index=siblings.findIndex(x=>x.id===n.id),target=siblings[index+(e.key==='ArrowUp'?-1:1)];if(target)dropMove(n.id,target.id,e.key==='ArrowUp'?'before':'after');});
