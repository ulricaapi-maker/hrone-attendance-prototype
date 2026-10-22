/* Local demonstration data; no server writes. */
class OrgPlan {
  constructor(saved) {
    this.baseline = [
      {id:'a',parent:null,name:'二级A组织',code:'A001',owner:'周负责人'},
      {id:'b',parent:'a',name:'业务部A',code:'A00101',owner:'张经理'},
      {id:'p',parent:'b',name:'产品组',code:'A0010101',owner:'王主管'},
      {id:'t',parent:'b',name:'技术组',code:'A0010102',owner:'刘主管'},
      {id:'s',parent:'a',name:'支持部',code:'A00102',owner:'陈经理'},
      {id:'o',parent:'a',name:'原项目组',code:'A00103',owner:'李主管'}
    ];
    this.nodes = saved ? structuredClone(saved) : structuredClone(this.baseline);
    if(typeof normalizeOrgNode==='function'){this.baseline=this.baseline.map(n=>normalizeOrgNode(n,this.baseline));this.nodes=this.nodes.map(n=>normalizeOrgNode(n,this.nodes));}
  }
  get(id) {return this.nodes.find(n=>n.id===id);}
  original(id) {return this.baseline.find(n=>n.id===id);}
  descendants(id) {
    const out=[]; const walk=p=>this.nodes.filter(n=>n.parent===p).forEach(n=>{out.push(n);walk(n.id);});
    walk(id); return out;
  }
  path(id,nodes=this.nodes) {
    const n=nodes.find(x=>x.id===id); return n ? (n.parent?this.path(n.parent,nodes)+' / ':'')+n.name : '—';
  }
  tags(n) {
    if(n.disabled)return ['拟定停用'];
    const old=this.original(n.id); if(!old)return ['新增'];
    const a=[];if(n.name!==old.name)a.push('名称调整');if(n.parent!==old.parent)a.push('调整上级');
    if(n.owner!==old.owner)a.push('负责人调整');
    if(n.parent===old.parent){const current=this.nodes.filter(x=>x.parent===n.parent&&this.original(x.id)?.parent===n.parent).map(x=>x.id);const previous=this.baseline.filter(x=>x.parent===old.parent&&current.includes(x.id)).map(x=>x.id);if(current.indexOf(n.id)!==previous.indexOf(n.id))a.push('顺序调整');}if(typeof orgExtraTags==='function'){a.push(...orgExtraTags(n,old));if(n.sortOrder!==old.sortOrder&&!a.includes('顺序调整'))a.push('顺序调整');}return a;
  }
  save(values,id) {
    const n=id?this.get(id):null;
    if(id&&!n)throw Error('组织不存在，请重新选择。');
    if(n&&!n.parent)throw Error('本期二级组织保持不变。');
    if(n?.disabled)throw Error('请先取消停用，再编辑组织。');
    const name=values.name.trim(),parent=this.get(values.parent);
    if(!name)throw Error('请输入组织名称。');
    if(!parent||parent.disabled)throw Error('请选择未拟定停用的上级组织。');
    if(n&&(parent.id===id||this.descendants(id).some(x=>x.id===parent.id)))throw Error('不能将本组织或其下级设为上级组织。');
    if(this.nodes.some(x=>x.id!==id&&x.parent===parent.id&&x.name===name))throw Error('同一上级下已存在同名组织，请修改名称。');
    const orderChanged=values.details&&(!n||n.sortOrder!==values.details.sortOrder);
    if(n)Object.assign(n,{...(values.details||{}),name,parent:parent.id,owner:values.owner.trim()});
    else this.nodes.push({id:'new-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),...(values.details||{}),parent:parent.id,name,owner:values.owner.trim()});
    if(orderChanged){const siblings=this.nodes.filter(x=>x.parent===parent.id).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0)),queue=siblings.slice();this.nodes=this.nodes.map(x=>x.parent===parent.id?queue.shift():x);}
  }
  syncOrders(parent){this.nodes.filter(x=>x.parent===parent).forEach((x,i)=>x.sortOrder=i+1);}
  validateMove(id,targetId,position) {
    const n=this.get(id),target=this.get(targetId);
    if(!n?.parent)throw Error('本期二级组织保持不变。');
    if(!target)throw Error('请选择目标组织。');
    if(n.disabled||target.disabled)throw Error('拟定停用的组织不能参与拖动，请先取消停用。');
    if(id===targetId||this.descendants(id).some(x=>x.id===targetId))throw Error('不能移动到本组织或其下级。');
    const parent=position==='inside'?target.id:target.parent;
    if(!parent)throw Error('不能调整到二级组织之外。');
    if(this.nodes.some(x=>x.id!==id&&x.parent===parent&&x.name===n.name))throw Error('目标上级下已存在同名组织。');
    return parent;
  }
  move(id,targetId,position) {
    const parent=this.validateMove(id,targetId,position),n=this.get(id),previousParent=n.parent;
    n.parent=parent;this.nodes=this.nodes.filter(x=>x.id!==id);
    if(position==='inside')this.nodes.push(n);
    else {const index=this.nodes.findIndex(x=>x.id===targetId);this.nodes.splice(index+(position==='after'?1:0),0,n);}
    if(typeof normalizeOrgNode==='function'){this.syncOrders(previousParent);this.syncOrders(parent);}
  }
  stop(id) {
    const n=this.get(id);if(!n?.parent)throw Error('本期二级组织保持不变。');
    if(n.disabled)throw Error('该组织已拟定停用。');
    const token='stop-'+id+'-'+Date.now();
    [n,...this.descendants(id)].filter(x=>!x.disabled).forEach(x=>{x.disabled=true;x.stopGroup=token;});
  }
  restore(id) {
    const n=this.get(id);if(!n?.disabled)return;
    const parent=this.get(n.parent);if(parent?.disabled)throw Error('请先取消上级组织的停用。');
    const token=n.stopGroup;[n,...this.descendants(id)].filter(x=>x.stopGroup===token).forEach(x=>{delete x.disabled;delete x.stopGroup;});
  }
  removeNew(id) {
    if(this.original(id))throw Error('原有组织不能取消新增。');
    if(this.descendants(id).length)throw Error('该组织下还有下级组织，请先调整下级归属或取消下级新增。');
    this.nodes=this.nodes.filter(n=>n.id!==id);
  }
}
if(typeof module!=='undefined')module.exports=OrgPlan;
