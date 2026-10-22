/* Configuration snapshot checked against the test system on 2026-10-19.
 * Local prototype only: no requests or writes to the HR system.
 * Production fields come from the organization matrix dynamic-column service.
 */
const ORG_OWNER_ROLE='RM00001';
const ORG_ROLE_FIELDS=[
 {key:'RM00074',title:'测试变更',fieldRequired:'0',sort:1,status:1},
 {key:'RM00001',title:'部门负责人',fieldRequired:'0',sort:2,status:1},
 {key:'RM00002',title:'HRBP',fieldRequired:'1',sort:3,status:1},
 {key:'RM00071',title:'HRBP负责人',fieldRequired:'1',sort:4,status:1}
];
const ORG_LANGUAGES=[['it-IT','意大利语'],['nl-NL','荷兰语'],['zh-CN','简体中文'],['en-US','English'],['cs-CZ','Čeština'],['pl-PL','Polski'],['fr-FR','Français']];
const ORG_PEOPLE=['周负责人（E1001）','张经理（E1002）','王主管（E1003）','刘主管（E1004）','陈经理（E1005）','李主管（E1006）'];
const ORG_DETAIL_KEYS=['establishDate','changeDate','isVirtualOrg','mappingGroupCode','primaryCostCenter','costClassification','sortOrder','roles','multiLanguageNames'];
function orgRoles(){return ORG_ROLE_FIELDS.filter(r=>r.status===1).slice().sort((a,b)=>a.sort-b.sort);}
function normalizeOrgNode(n,nodes){return {...n,establishDate:n.establishDate||'',changeDate:n.changeDate||'',isVirtualOrg:!!n.isVirtualOrg,mappingGroupCode:n.mappingGroupCode||'',primaryCostCenter:n.primaryCostCenter||'',costClassification:n.costClassification||'',sortOrder:n.sortOrder??nodes.filter(x=>x.parent===n.parent).findIndex(x=>x.id===n.id)+1,roles:{[ORG_OWNER_ROLE]:n.owner||'',...(n.roles||{})},multiLanguageNames:{...(n.multiLanguageNames||{})}};}
function orgLevelName(id){let n=plan.get(id),level=2,seen=new Set();while(n?.parent&&!seen.has(n.id)){seen.add(n.id);level++;n=plan.get(n.parent);}return ['','','二级组织','三级组织','四级组织','五级组织','六级组织','七级组织','八级组织'][level]||`${level}级组织`;}
function formalBadge(required){return required?'<small class="formal-required" title="正式组织必填，规划阶段可先保存后补齐">正式必填</small>':'';}
function fillOrgFields(n){
 const old=n&&plan.original(n.id);
 $('#org-code-field').hidden=!old;$('#org-code').value=n?.code||'';
 $('#org-establish-date').value=n?.establishDate||'';$('#org-establish-date').readOnly=!!old;
 $('#org-change-date-field').hidden=!old;$('#org-change-date').value=n?.changeDate||'';
 $('#org-sort').value=n?.sortOrder??plan.nodes.filter(x=>x.parent===$('#org-parent').value).length+1;
 $('#org-virtual').value=n?.isVirtualOrg?'true':'false';$('#org-mapping-code').value=n?.mappingGroupCode||'';
 $('#org-cost-class').value=n?.costClassification||'';
 $('#org-cost-center').value=n?.primaryCostCenter||'';
 $('#org-role-fields').innerHTML=orgRoles().map(r=>`<label><span>${esc(r.title)}<span data-role-required="${esc(r.key)}">${formalBadge(r.fieldRequired==='1'&&!n?.isVirtualOrg)}</span></span><input type="search" id="role-${esc(r.key)}" data-org-role="${esc(r.key)}" aria-label="${esc(r.title)}" list="org-people" placeholder="通过工号 / 姓名搜索" value="${esc(n?.roles?.[r.key]??(r.key===ORG_OWNER_ROLE?n?.owner:'')??'')}" autocomplete="off"></label>`).join('');
 $('#org-people').innerHTML=ORG_PEOPLE.map(v=>`<option value="${esc(v)}">`).join('');
 $('#org-language-fields').innerHTML=ORG_LANGUAGES.filter(([key])=>key!=='zh-CN').map(([key,title])=>`<label>${esc(title)}<input data-org-language="${esc(key)}" aria-label="组织名称 ${esc(title)}" value="${esc(n?.multiLanguageNames?.[key]||'')}" maxlength="100"></label>`).join('');
 $('#org-language-panel').hidden=true;$('#toggle-languages').setAttribute('aria-expanded','false');updateOrgLevel();
}
function updateOrgLevel(){const p=$('#org-parent').value;const label=orgLevelName(p);const names=['二级组织','三级组织','四级组织','五级组织','六级组织','七级组织','八级组织'];$('#org-level').value=names[names.indexOf(label)+1]||'超出八级组织';}
function readOrgFields(n){const roles={...(n?.roles||{})};document.querySelectorAll('[data-org-role]').forEach(el=>roles[el.dataset.orgRole]=el.value.trim());const multiLanguageNames={...(n?.multiLanguageNames||{}),'zh-CN':$('#org-name').value.trim()};document.querySelectorAll('[data-org-language]').forEach(el=>multiLanguageNames[el.dataset.orgLanguage]=el.value.trim());return {establishDate:$('#org-establish-date').value,changeDate:$('#org-change-date').value,isVirtualOrg:$('#org-virtual').value==='true',sortOrder:Number($('#org-sort').value),mappingGroupCode:$('#org-mapping-code').value.trim(),costClassification:$('#org-cost-class').value,primaryCostCenter:$('#org-cost-center').value.trim(),roles,multiLanguageNames};}
function orgExtraTags(n,old){if(!old)return [];const tags=[];if(orgRoles().some(r=>r.key!==ORG_OWNER_ROLE&&(n.roles?.[r.key]||'')!==(old.roles?.[r.key]||'')))tags.push('角色调整');if(['primaryCostCenter','costClassification'].some(k=>(n[k]||'')!==(old[k]||'')))tags.push('成本信息调整');if(JSON.stringify(Object.fromEntries(Object.entries(n.multiLanguageNames||{}).filter(([k,v])=>k!=='zh-CN'&&v)))!==JSON.stringify(Object.fromEntries(Object.entries(old.multiLanguageNames||{}).filter(([k,v])=>k!=='zh-CN'&&v))))tags.push('多语言调整');if(['establishDate','changeDate','isVirtualOrg','mappingGroupCode'].some(k=>(n[k]||'')!==(old[k]||'')))tags.push('基本信息调整');return tags;}
function orgFullDetail(n){const fields=[['上级组织',plan.path(n.parent)],['组织层级',orgLevelName(n.id)],['编码',n.code||'正式新增时生成'],['设立日期',n.establishDate],['变动生效日期',n.changeDate],['排序码',n.sortOrder],['是否虚拟组织',n.isVirtualOrg?'是':'否'],['拓网组织编码',n.mappingGroupCode]];const section=(title,items)=>`<section class="org-detail-section"><h4>${title}</h4><dl>${items.map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value??'')||'—'}</dd>`).join('')}</dl></section>`;return section('基本信息',fields)+section('组织角色',orgRoles().map(r=>[r.title,n.roles?.[r.key]||(r.key===ORG_OWNER_ROLE?n.owner:'')]))+section('成本信息',[['一级成本中心',n.primaryCostCenter],['财务用-成本分类',n.costClassification]])+(Object.values(n.multiLanguageNames||{}).some(Boolean)?section('多语言名称',ORG_LANGUAGES.map(([key,title])=>[title,key==='zh-CN'?n.name:n.multiLanguageNames?.[key]])):'');}

function orgChangeSummary(n,old){if(!old)return '';const changes=[];const add=(label,before,after)=>{if(String(before??'')!==String(after??''))changes.push([label,`${before||'—'} → ${after||'—'}`]);};add('名称',old.name,n.name);if(old.parent!==n.parent)changes.push(['上级组织',`${plan.path(old.parent,plan.baseline)} → ${plan.path(n.parent)}`]);orgRoles().forEach(r=>add(r.title,old.roles?.[r.key],n.roles?.[r.key]));add('一级成本中心',old.primaryCostCenter,n.primaryCostCenter);add('财务用-成本分类',old.costClassification,n.costClassification);if(plan.tags(n).includes('顺序调整'))changes.push(['展示顺序','已调整同一上级下的组织顺序']);return changes.length?`<section class="org-detail-section"><h4>调整前后</h4><dl>${changes.map(([key,value])=>`<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join('')}</dl></section>`:'';}
