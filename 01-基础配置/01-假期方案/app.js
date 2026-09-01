var leaves=[
  {key:"annual",name:"年假",unit:"小时",min:"1",max:"",calc:"考勤日",roundBase:"0.5",round:"向上取整",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"comp",name:"调休假",unit:"小时",min:"1",max:"",calc:"考勤日",roundBase:"0.5",round:"向上取整",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"personal",name:"事假",unit:"小时",min:"1",max:"",calc:"考勤日",roundBase:"0.5",round:"向上取整",daily:"8",prerequisite:"无",strong:"—",paid:"否",state:"启用"},
  {key:"sick",name:"病假",unit:"小时",min:"1",max:"",calc:"考勤日",roundBase:"0.5",round:"向上取整",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"marriage",name:"婚假",unit:"天",min:"1",max:"",calc:"考勤日",roundBase:"—",round:"—",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"prenatal",name:"产检假",unit:"天",min:"1",max:"",calc:"考勤日",roundBase:"—",round:"—",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"maternity",name:"产假",unit:"天",min:"1",max:"",calc:"考勤日",roundBase:"—",round:"—",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"miscarriage",name:"流产假",unit:"天",min:"1",max:"",calc:"考勤日",roundBase:"—",round:"—",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"difficult",name:"难产假",unit:"天",min:"1",max:"",calc:"考勤日",roundBase:"—",round:"—",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"breastfeeding",name:"哺乳假",unit:"小时",min:"1",max:"",calc:"考勤日",roundBase:"0.5",round:"向上取整",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"paternity",name:"陪产假",unit:"天",min:"1",max:"",calc:"考勤日",roundBase:"—",round:"—",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"bereavement",name:"丧假",unit:"天",min:"1",max:"",calc:"考勤日",roundBase:"—",round:"—",daily:"8",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"womensDay",name:"三八妇女节假",unit:"小时",min:"4",max:"4",calc:"考勤日",roundBase:"4",round:"向上取整",daily:"4",prerequisite:"无",strong:"—",paid:"是",state:"启用"},
  {key:"welfare",name:"福利假",unit:"小时",min:"1",max:"",calc:"考勤日",roundBase:"0.5",round:"向上取整",daily:"8",prerequisite:"无",strong:"—",paid:"否",state:"启用"}
];
leaves.forEach(function(leave){leave.balanceLimit=leave.balanceLimit||(["annual","comp"].indexOf(leave.key)>-1?"是":"否");});

var plans=[
  {id:"cn-main",name:"中国区假期方案",names:{zh_CN:"中国区假期方案",en_US:"China Leave Plan"},version:"00041",region:"中国区",personnel:["正式员工"],employee:["营销","职能","操作"],state:"启用",creator:"肖维",created:"2026-06-17 14:23",updater:"肖维",updated:"2026-07-24 18:25"},
  {id:"fr-main",name:"法国区假期方案",names:{zh_CN:"法国区假期方案",en_US:"France Leave Plan"},version:"00014",region:"法国区",personnel:["正式员工","外包员工"],employee:["营销","职能"],state:"启用",creator:"吴振兴",created:"2026-06-11 16:45",updater:"吴振兴",updated:"2026-07-18 10:16"},
  {id:"ca-legacy",name:"加拿大区历史方案",names:{zh_CN:"加拿大区历史方案",en_US:"Canada Legacy Leave Plan"},version:"00003",region:"加拿大区",personnel:["正式员工"],employee:["操作"],state:"停用",creator:"陈南",created:"2026-06-03 09:20",updater:"陈南",updated:"2026-07-08 14:05",activationIssues:[{target:"basic",order:0,message:"适用范围与已启用方案“中国区假期方案”冲突，请调整后再启用。"},{target:"leave",order:0,message:"婚假可休时长公式检查未通过，请调整后再启用。"},{target:"annual",order:0,message:"年假配置存在未完成的必填项，请补充后再启用。"}]}
];
var editingPlanId="";
var editingPlanIsNew=false;
var editingPlanCopySource="";
var viewingHistoricalVersion="";
var planFormDirty=false;
var editingPlanNames={zh_CN:"",en_US:""};
var pendingConfirmAction=null;
var currentFilteredPlans=[];
var fieldCatalog=[
  {group:"员工信息",field:"员工信息·性别",values:["女","男"],note:"取员工最新性别。"},
  {group:"员工信息",field:"员工信息·婚姻状况",values:["已婚","未婚","离异","丧偶"],note:"取员工最新婚姻状况。"},
  {group:"员工信息",field:"员工信息·出生日期",note:"取员工最新出生日期。"},
  {group:"员工信息",field:"员工信息·年龄",note:"取员工最新年龄。"},
  {group:"任职信息",field:"任职信息·用工形式",values:["全日制","非全日制","劳务"],note:"取休假开始日有效任职记录中的用工形式。"},
  {group:"任职信息",field:"任职信息·员工类型一级",values:["内部员工","外部人员"],note:"取休假开始日有效任职记录中的员工类型一级。"},
  {group:"任职信息",field:"任职信息·员工类型二级",values:["营销","职能","操作"],note:"取休假开始日有效任职记录中的员工类型二级。"},
  {group:"组织任职",field:"组织任职·主任职部门",note:"取休假开始日有效任职记录中的主任职部门。"},
  {group:"组织任职",field:"组织任职·主任职职位",note:"取休假开始日有效任职记录中的主任职职位。"},
  {group:"任职信息",field:"任职信息·工作地点",values:["上海","深圳","北京","广州","其他地点"],note:"取休假开始日有效任职记录中的工作地点。"},
  {group:"任职信息",field:"任职信息·工作地区",values:["上海","深圳","北京","广州","其他地区"],note:"取休假开始日有效任职记录中的工作地区。"},
  {group:"任职信息",field:"任职信息·入职日期",note:"取休假开始日有效任职记录中的入职日期。"},
  {group:"任职信息",field:"任职信息·转正日期",note:"取休假开始日有效任职记录中的转正日期。"},
  {group:"任职信息",field:"任职信息·人员状态",values:["正式","试用"],note:"取休假开始日有效任职记录中的人员状态。"},
  {group:"休假申请",field:"休假申请·休假类型",note:"取本次规则调用的休假类型。"},
  {group:"休假申请",field:"休假申请·休假开始日期",note:"取本次规则调用的休假开始日期。"},
  {group:"休假申请",field:"休假申请·休假结束日期",note:"取本次规则调用的休假结束日期。"},
  {group:"休假申请",field:"休假申请·预产期",note:"取本次规则调用的预产期。"},
  {group:"休假申请",field:"休假申请·孕周",note:"由员工分别填写周数和余天，规则按“X周Y天”比较；余天只能为0至6。"},
  {group:"休假申请",field:"休假申请·去世亲属身份",values:["配偶","父母","子女","祖父母／外祖父母","其他亲属"],note:"取本次规则调用的去世亲属身份。"},
  {group:"系统计算",field:"系统计算·当年3月8日是否为周六或周日",values:["否","是"],note:"按自然星期判断当年3月8日是否为周六或周日；调休补班不改变结果。"}
];

var annualFieldCatalog=[];

var dateReferenceOptions=["休假开始日期","休假结束日期","预产期","原休假单开始日期","当年3月8日","当年3月31日"];
var annualEligibilityFields=["任职信息·用工形式","任职信息·员工类型一级","任职信息·员工类型二级","组织任职·主任职部门","组织任职·主任职职位","任职信息·工作地点","任职信息·工作地区","任职信息·入职日期","任职信息·转正日期","任职信息·人员状态"];
var entitlementModeMeta={
  "按可用余额控制":{label:"按可用额度控制",description:"为该假别发放并使用额度。余额为0或不足时是否阻止提交，由基本信息中的“余额限制”决定。"},
  "按总可休时长控制":{label:"按政策条件确定可休时长",description:"根据地区、孕周、亲属关系等条件确定可休时长。常用于婚假、产假、流产假、陪产假和丧假。"},
  "按周期限制使用":{label:"按周期设置可休上限",description:"按工作日、自然月等周期限制可休时长或申请次数。常用于产检假和哺乳假。"},
  "不限制可休总时长":{label:"不设置累计上限",description:"不限制员工累计可休总量，只校验本次申请。常用于事假、未启用额度管理的病假或福利假。"}
};
var entitlementModes=Object.keys(entitlementModeMeta);
var crossYearRuleEnabled=false;
var annualEligibilityEnabled=false;
var quotaConfigEnabled={comp:true,sick:true};

function defaultRule(){return {
  entitlementMode:"不限制可休总时长",durationMode:"规则表",durationRules:[],durationFormula:"",durationFormulaCheckStatus:"未检测",
  formulaCycle:"自然月",formulaLimitType:"累计时长",formulaSingleDuration:"1",formulaSingleUnit:"天",
  applicationFields:[],conditionEnabled:false,conditionMode:"常规条件",conditionLogic:"同时满足全部条件（且）",conditionFormula:"",conditionFormulaCheckStatus:"未检测",conditions:[],
  leaveDateEnabled:false,leaveDateRules:[],
  usageMode:"允许分次休完",continuousLeave:"否",intervalEnabled:false,intervalValue:"",intervalUnit:"自然日",frequencyEnabled:false,frequencyCycle:"自然月",frequencyLimit:"",
  attachmentEnabled:false,attachmentRules:[],policyEnabled:false,policyNotice:""
};}
function rule(overrides){return Object.assign(defaultRule(),overrides||{});}
function condition(field,operator,value){return {field:field,operator:operator,value:value};}
function durationRule(conditions,duration,options){return Object.assign({
  name:"",scopeType:(conditions&&conditions.length)?"conditional":"all",conditionMode:"常规条件",conditionFormula:"",conditionSummary:"",logic:"同时满足全部条件（且）",conditions:conditions||[],duration:duration||"",unit:"小时",kind:"total",
  cycle:"自然月",limitType:"累计时长",maxTimes:"",singleDuration:"",resultMode:"直接填写",formula:""
},options||{});}

var unifiedRules={
  annual:rule({entitlementMode:"按可用余额控制",conditionEnabled:false,conditions:[],policyEnabled:true,policyNotice:"请在可用年假余额和有效期范围内提交申请。"}),
  comp:rule({entitlementMode:"按可用余额控制",policyEnabled:true,policyNotice:"系统优先使用即将到期的调休余额。"}),
  personal:rule({entitlementMode:"不限制可休总时长",policyEnabled:true,policyNotice:"事假将按照适用的考勤和薪资规则处理。"}),
  sick:rule({entitlementMode:"不限制可休总时长",conditionEnabled:true,conditions:[condition("任职信息·人员状态","等于","正式")],attachmentEnabled:true,attachmentRules:[{basis:"本次申请时长",operator:"大于",value:"1",materials:["诊断证明","病历","医疗费用单据"]}],policyEnabled:true,policyNotice:"请按要求提供医疗材料，具体病假政策以员工适用规则为准。"}),
  marriage:rule({entitlementMode:"按总可休时长控制",durationRules:[durationRule([condition("任职信息·工作地区","等于","上海")],"3",{name:"上海",unit:"天"}),durationRule([condition("任职信息·工作地区","等于","深圳")],"5",{name:"深圳",unit:"天"})],conditionEnabled:true,conditionLogic:"同时满足全部条件（且）",conditions:[condition("员工信息·婚姻状况","等于","已婚")],usageMode:"必须一次性休完",continuousLeave:"是",attachmentEnabled:true,attachmentRules:[{basis:"所有申请",operator:"",value:"",materials:["结婚证明"]}],policyEnabled:true,policyNotice:"婚假天数按工作地区规则执行；结婚登记日期由审批人根据结婚证明核验。"}),
  prenatal:rule({entitlementMode:"按周期限制使用",durationRules:[durationRule([condition("休假申请·孕周","小于","29周0天")],"",{name:"孕周不满29周",kind:"periodic",cycle:"自然月",limitType:"申请次数＋单次时长",maxTimes:"1",singleDuration:"1",unit:"天"}),durationRule([condition("休假申请·孕周","大于等于","29周0天")],"",{name:"孕周达到29周",kind:"periodic",cycle:"自然月",limitType:"申请次数＋单次时长",maxTimes:"2",singleDuration:"1",unit:"天"})],conditionEnabled:true,conditions:[condition("员工信息·性别","等于","女")],attachmentEnabled:true,attachmentRules:[{basis:"所有申请",operator:"",value:"",materials:["产检证明"]}],policyEnabled:true,policyNotice:"29周前每个自然月最多申请1次，第29周起每个自然月最多申请2次；每次最多可休1天。"}),
  maternity:rule({entitlementMode:"按总可休时长控制",durationRules:[durationRule([condition("任职信息·工作地区","等于","上海")],"98",{name:"上海",unit:"天"})],conditionEnabled:true,conditions:[condition("员工信息·性别","等于","女")],usageMode:"必须一次性休完",continuousLeave:"是",attachmentEnabled:true,attachmentRules:[{basis:"所有申请",operator:"",value:"",materials:["生育证明","出生证明"]}],policyEnabled:true,policyNotice:"产假天数和申请时间按员工工作地区政策执行。"}),
  miscarriage:rule({entitlementMode:"按总可休时长控制",durationMode:"统一公式",durationFormula:"如果 孕周达到(16,0) 那么 42 否则 15",durationFormulaCheckStatus:"通过",durationRules:[],conditionEnabled:true,conditionLogic:"同时满足全部条件（且）",conditions:[condition("员工信息·性别","等于","女"),condition("员工信息·婚姻状况","等于","已婚")],usageMode:"必须一次性休完",continuousLeave:"是",attachmentEnabled:true,attachmentRules:[{basis:"所有申请",operator:"",value:"",materials:["流产证明","诊断证明"]}],policyEnabled:true,policyNotice:"孕期不满4个月可休15天，孕期已满4个月可休42天；流产事实由审批人根据医疗材料核验。"}),
  difficult:rule({entitlementMode:"按总可休时长控制",durationRules:[durationRule([condition("任职信息·工作地区","等于","上海")],"15",{name:"上海难产假",kind:"total",unit:"天"})],usageMode:"必须一次性休完",continuousLeave:"是",attachmentEnabled:true,attachmentRules:[{basis:"所有申请",operator:"",value:"",materials:["难产证明"]}],policyEnabled:true,policyNotice:"难产事实由审批人根据难产证明核验；如需关联产假单，由休假申请单统一控制。"}),
  breastfeeding:rule({entitlementMode:"按周期限制使用",durationRules:[durationRule([],"1",{name:"每个工作日哺乳时间",kind:"periodic",cycle:"工作日",limitType:"累计时长",unit:"小时",resultMode:"直接填写"})],conditionEnabled:true,conditions:[condition("员工信息·性别","等于","女")],policyEnabled:true,policyNotice:"员工申请时选择上班前或上班后，系统据此确定休假时段。"}),
  paternity:rule({entitlementMode:"按总可休时长控制",durationRules:[durationRule([condition("任职信息·工作地区","等于","上海")],"15",{name:"上海",unit:"天"})],conditionEnabled:true,conditions:[condition("员工信息·性别","等于","男")],usageMode:"必须一次性休完",continuousLeave:"是",attachmentEnabled:true,attachmentRules:[{basis:"所有申请",operator:"",value:"",materials:["出生证明"]}],policyEnabled:true,policyNotice:"陪产假天数和申请期限按员工工作地区政策执行。"}),
  bereavement:rule({entitlementMode:"按总可休时长控制",durationRules:[durationRule([condition("休假申请·去世亲属身份","等于","配偶"),condition("休假申请·去世亲属身份","等于","父母"),condition("休假申请·去世亲属身份","等于","子女")],"3",{name:"配偶、父母或子女",logic:"满足任一条件（或）",unit:"天"})],usageMode:"必须一次性休完",continuousLeave:"是",attachmentEnabled:true,attachmentRules:[{basis:"所有申请",operator:"",value:"",materials:["死亡证明","亲属关系证明"]}],policyEnabled:true,policyNotice:"请在申请单选择去世亲属身份，可休时长按公司政策执行。"}),
  womensDay:rule({entitlementMode:"按周期限制使用",durationRules:[durationRule([condition("员工信息·性别","等于","女"),condition("系统计算·当年3月8日是否为周六或周日","等于","否")],"",{name:"女性员工每年一次",kind:"periodic",cycle:"自然年",limitType:"申请次数＋单次时长",maxTimes:"1",singleDuration:"4",unit:"小时"})],leaveDateEnabled:true,leaveDateRules:[{target:"休假开始日期",relation:"不得早于",reference:"当年3月8日",offset:"0",unit:"自然日"},{target:"休假结束日期",relation:"不得晚于",reference:"当年3月31日",offset:"0",unit:"自然日"}],policyEnabled:true,policyNotice:"当年3月8日不是星期六或星期日时，符合条件的女性员工可在3月8日至3月31日申请1次三八妇女节假，每次4小时；如3月8日为星期六或星期日（含调休补班），当年不享受。"}),
  welfare:rule({entitlementMode:"不限制可休总时长",policyEnabled:true,policyNotice:"福利假按公司现行政策执行。"})
};

var boundary={
  annual:{title:"年假配置",text:"维护年假额度的生成、发放、有效期、结转和结算规则。",chips:["生成规则","发放频率","有效期","结转","结算"]},
  comp:{title:"调休假配置",text:"维护加班转调休、转换比例、有效期、扣减顺序和结算规则。",chips:["加班转换","转换比例","有效期","扣减顺序","结算"]},
  sick:{title:"病假配置",text:"仅在病假采用余额控制时，维护额度生成方式、有效期和结算规则。",chips:["固定额度","规则计算","考勤折算","手动导入","有效期"]}
};
var editingLeaveKey="";
var activeDurationRuleEditor=null;
var activeLeaveRuleDraft=null;
var leaveFormDirty=false;
var durationRuleEditorDirty=false;
var activeFormulaConfig=null;

var leaveFilterConfig={
  name:{id:"leaveFilterName",label:"休假类型",type:"text",placeholder:"输入休假类型"},
  unit:{id:"leaveFilterUnit",label:"计量单位",options:["全部","小时","天"]},
  min:{id:"leaveFilterMin",label:"单次最小时长不低于",type:"number",placeholder:"请输入数值"},
  max:{id:"leaveFilterMax",label:"单次最大时长不高于",type:"number",placeholder:"请输入数值"},
  calc:{id:"leaveFilterCalc",label:"时长计算方式",options:["全部","考勤日","自然日"]},
  daily:{id:"leaveFilterDaily",label:"日最大时长不高于",type:"number",placeholder:"小时"},
  roundBase:{id:"leaveFilterRoundBase",label:"舍位基数",options:["全部","0.5","1","4","不适用"]},
  round:{id:"leaveFilterRound",label:"舍位方式",options:["全部","向上取整","四舍五入","向下取整","不适用"]},
  control:{id:"leaveFilterControl",label:"控制方式",options:["全部","按可用额度控制","按政策条件确定可休时长","按周期设置可休上限","不设置累计上限"]},
  paid:{id:"leaveFilterPaid",label:"是否带薪",options:["全部","是","否"]}
};

function findField(field){return fieldCatalog.concat(annualFieldCatalog).find(function(x){return x.field===field;});}
function optionListHtml(values,current){return values.filter(function(x,i,a){return x!=null&&a.indexOf(x)===i;}).map(function(x){return '<option'+(x===current?' selected':'')+'>'+x+'</option>';}).join("");}
function arrayValue(value){if(Array.isArray(value)){return value;}if(!value||value==="无"){return [];}return String(value).split("、");}
function directChoiceControlHtml(item){var choices=(item.options||[]).filter(function(x){return x!=null;}).map(function(x){return typeof x==="object"?{value:String(x.value),label:String(x.label)}:{value:String(x),label:String(x)};}),current=item.value==null?"":String(item.value),id=item.id||("directChoice"+Math.random().toString(36).slice(2)),disabled=!!item.disabled,classes="direct-choice-group"+(item.compactChoice?" compact":"")+(disabled?" is-disabled":"");return '<input type="hidden" id="'+id+'" value="'+current+'"><div class="'+classes+'" role="radiogroup" data-value-target="'+id+'">'+choices.map(function(choice){var active=choice.value===current;return '<label class="direct-radio-option'+(active?' active':'')+'"><input class="direct-choice-input" type="radio" name="direct-'+id+'" value="'+choice.value+'"'+(active?' checked':'')+(disabled?' disabled':'')+'><span>'+choice.label+'</span></label>';}).join("")+'</div>';}
function editableControl(item){var disabled=item.disabled?" disabled":"",id=item.id?' id="'+item.id+'"':"",note=item.note?'<div class="field-note">'+item.note+'</div>':'';if(item.options&&item.direct){return directChoiceControlHtml(item)+note;}if(item.options){return '<select class="form-select"'+id+disabled+'>'+optionListHtml(item.options,item.value)+'</select>'+note;}var input='<input class="form-input" type="'+(item.type||"text")+'"'+(item.min!=null?' min="'+item.min+'"':'')+id+' value="'+(item.value==null?'':item.value)+'"'+disabled+'>';return (item.suffix?'<div class="input-with-suffix">'+input+'<span class="input-suffix">'+item.suffix+'</span></div>':input)+note;}
function businessFieldsHtml(items){return '<div class="business-field-grid">'+items.map(function(x){var tip=x.tip?' <span class="hint" data-tip="'+x.tip+'">?</span>':'',actionTip=x.actionTipId?' <button type="button" class="hint hint-action" id="'+x.actionTipId+'" data-tip="'+(x.actionTipText||"点击查看说明")+'" aria-label="'+(x.actionTipLabel||"查看说明")+'">?</button>':'',tag=x.actionTipId?"div":"label";return '<'+tag+' class="business-field"><span class="form-label">'+(x.required?'<span class="required">*</span>':'')+x.label+tip+actionTip+'</span>'+editableControl(x)+'</'+tag+'>';}).join("")+'</div>';}
function businessSectionHtml(title,desc,body,action,extraClass){return '<section class="business-section'+(extraClass?' '+extraClass:'')+'"><div class="business-section-head"><div><div class="business-section-title">'+title+'</div>'+(desc?'<div class="business-section-desc">'+desc+'</div>':'')+'</div>'+(action||'')+'</div><div class="business-section-body">'+body+'</div></section>';}
function checkboxGroupHtml(id,options,selected){var values=arrayValue(selected);return '<div class="checkbox-group" id="'+id+'">'+options.map(function(option){return '<label class="checkbox-option"><input type="checkbox" value="'+option+'"'+(values.indexOf(option)>-1?' checked':'')+'><span>'+option+'</span></label>';}).join("")+'</div>';}
function moduleActionHtml(target,enabled,label){return '<div class="toggle-form-row"><button type="button" class="switch-toggle module-toggle '+(enabled?'on':'')+'" data-target="'+target+'" aria-pressed="'+enabled+'"></button><span class="switch-text">'+label+'</span></div>';}
function configModeSwitchHtml(name,current,standardLabel){return '<div class="mode-switch config-mode-switch" data-mode="'+name+'"><button type="button" class="mode-option config-mode-option '+(current===standardLabel?'active':'')+'" data-value="'+standardLabel+'">'+standardLabel+'</button><button type="button" class="mode-option config-mode-option '+(current==="公式配置"?'active':'')+'" data-value="公式配置">高级公式</button></div>';}

function entitlementModeLabel(mode){return entitlementModeMeta[mode]?entitlementModeMeta[mode].label:mode;}
function entitlementModeDescription(mode){return entitlementModeMeta[mode]?entitlementModeMeta[mode].description:"";}
function usageSummary(rule){var parts=[];if(rule.usageMode==="必须一次性休完"){parts.push("必须一次申请完");}if(rule.intervalEnabled){parts.push("同类休假至少间隔"+(rule.intervalValue||"—")+(rule.intervalUnit||"自然日"));}return parts.length?parts.join("；"):"可分次申请";}
function renderLeaves(){
  var name=(document.getElementById("leaveFilterName")||{}).value||"",unit=(document.getElementById("leaveFilterUnit")||{}).value||"全部",calc=(document.getElementById("leaveFilterCalc")||{}).value||"全部",control=(document.getElementById("leaveFilterControl")||{}).value||"全部",paid=(document.getElementById("leaveFilterPaid")||{}).value||"全部",minFilter=(document.getElementById("leaveFilterMin")||{}).value||"",maxFilter=(document.getElementById("leaveFilterMax")||{}).value||"",dailyFilter=(document.getElementById("leaveFilterDaily")||{}).value||"",roundBase=(document.getElementById("leaveFilterRoundBase")||{}).value||"全部",round=(document.getElementById("leaveFilterRound")||{}).value||"全部";
  var rows=leaves.filter(function(x){var r=unifiedRules[x.key]||defaultRule(),controlLabel=entitlementModeLabel(r.entitlementMode),baseLabel=x.unit==="天"?"不适用":x.roundBase,roundLabel=x.unit==="天"?"不适用":x.round;return (!name||x.name.indexOf(name)>-1)&&(unit==="全部"||x.unit===unit)&&(calc==="全部"||x.calc===calc)&&(control==="全部"||controlLabel===control)&&(paid==="全部"||x.paid===paid)&&(!minFilter||Number(x.min)>=Number(minFilter))&&(!maxFilter||(x.max&&Number(x.max)<=Number(maxFilter)))&&(!dailyFilter||Number(x.daily)<=Number(dailyFilter))&&(roundBase==="全部"||baseLabel===roundBase)&&(round==="全部"||roundLabel===round);});
  document.getElementById("leaveRows").innerHTML=rows.length?rows.map(function(x){var r=unifiedRules[x.key]||defaultRule(),roundBaseText=x.unit==="天"?"—":x.roundBase+' 小时',roundText=x.unit==="天"?"—":x.round;return '<tr><td><b>'+x.name+'</b></td><td>'+x.unit+'</td><td>'+x.min+' 小时</td><td>'+(x.max?x.max+' 小时':'不限制')+'</td><td>'+x.calc+'</td><td>'+x.daily+' 小时</td><td>'+roundBaseText+'</td><td>'+roundText+'</td><td><span class="control-pill">'+entitlementModeLabel(r.entitlementMode)+'</span></td><td>'+x.paid+'</td><td><div class="row-actions"><button class="btn-text edit-leave" data-key="'+x.key+'">编辑</button><button class="btn-text delete-action delete-leave" data-key="'+x.key+'" data-name="'+x.name+'">删除</button></div></td></tr>';}).join(""):'<tr><td class="table-empty" colspan="11">没有符合条件的休假配置</td></tr>';
  document.querySelectorAll(".edit-leave").forEach(function(btn){btn.onclick=function(){openLeaveForm(btn.dataset.key);};});
  document.querySelectorAll(".delete-leave").forEach(function(btn){btn.onclick=function(){var referencedBy=leaves.filter(function(item){return item.key!==btn.dataset.key&&arrayValue(item.prerequisite).indexOf(btn.dataset.name)>-1;}).map(function(item){return item.name;});if(referencedBy.length){showPlanPageBanner("当前休假类型已被“"+referencedBy.join("、")+"”设置为前置假，请解除引用后再删除");return;}hidePlanPageBanner();openConfirm("删除休假配置","请确认是否删除？",function(){leaves=leaves.filter(function(x){return x.key!==btn.dataset.key;});renderLeaves();planFormDirty=true;showToast("删除成功");});};});
  refreshLeaveFilterIndicators();
}
function currentLeaveFilterValue(key){var config=leaveFilterConfig[key],el=config&&document.getElementById(config.id);return el?String(el.value||""):"";}
function leaveFilterIsActive(key){var value=currentLeaveFilterValue(key);return value!==""&&value!=="全部";}
function refreshLeaveFilterIndicators(){document.querySelectorAll(".table-filter-trigger").forEach(function(btn){btn.classList.toggle("active",leaveFilterIsActive(btn.dataset.filter));});}
function positionFloatingPopover(popover,anchor){var rect=anchor.getBoundingClientRect(),left=Math.min(rect.left,window.innerWidth-popover.offsetWidth-14),top=rect.bottom+6;if(top+popover.offsetHeight>window.innerHeight-12){top=Math.max(12,rect.top-popover.offsetHeight-6);}popover.style.left=Math.max(12,left)+"px";popover.style.top=top+"px";}
function closeLeaveFilterPopover(){document.getElementById("leaveFilterPopover").classList.remove("show");}
function openLeaveFilterPopover(key,anchor){var config=leaveFilterConfig[key],store=document.getElementById(config.id),popover=document.getElementById("leaveFilterPopover"),control=config.options?'<select class="form-select" id="activeLeaveFilterValue">'+optionListHtml(config.options,store.value||"全部")+'</select>':'<input class="form-input" id="activeLeaveFilterValue" type="'+(config.type||"text")+'" value="'+(store.value||"")+'" placeholder="'+(config.placeholder||"请输入")+'">';popover.dataset.filter=key;popover.innerHTML='<div class="filter-popover-title">'+config.label+'</div>'+control+'<div class="filter-popover-actions"><button class="btn" id="clearActiveLeaveFilter">清除</button><button class="btn btn-primary" id="applyActiveLeaveFilter">确定</button></div>';popover.classList.add("show");positionFloatingPopover(popover,anchor);document.getElementById("applyActiveLeaveFilter").onclick=function(){store.value=document.getElementById("activeLeaveFilterValue").value;closeLeaveFilterPopover();renderLeaves();};document.getElementById("clearActiveLeaveFilter").onclick=function(){store.value=config.options?"全部":"";closeLeaveFilterPopover();renderLeaves();};var input=document.getElementById("activeLeaveFilterValue");if(input&&input.tagName==="INPUT"){input.focus();input.onkeydown=function(e){if(e.key==="Enter"){document.getElementById("applyActiveLeaveFilter").click();}};}}
function resetAllLeaveFilters(){Object.keys(leaveFilterConfig).forEach(function(key){var config=leaveFilterConfig[key],el=document.getElementById(config.id);el.value=config.options?"全部":"";});closeLeaveFilterPopover();renderLeaves();}
function formatList(values){return (values||[]).length?(values||[]).join("、"):"—";}
function planNames(plan){var names=plan&&plan.names?plan.names:{};return {zh_CN:String(names.zh_CN||plan&&plan.name||""),en_US:String(names.en_US||"")};}
function planDisplayName(plan){var names=planNames(plan);return names.zh_CN||names.en_US||"—";}
function planNameMatches(plan,keyword){if(!keyword){return true;}var names=planNames(plan);return Object.keys(names).some(function(key){return names[key].indexOf(keyword)>-1;});}
function planRegionValues(plan){if(plan&&Array.isArray(plan.regions)&&plan.regions.length){return plan.regions.slice();}return plan&&plan.region?String(plan.region).split(/[、,，]/).filter(Boolean):[];}
function planScopeValues(plan){if(plan&&Array.isArray(plan.applyScopes)&&plan.applyScopes.length){return plan.applyScopes.map(function(scope){return scope==="人员类型"?"用工形式":scope;});}var scopes=[];if(plan&&plan.personnel&&plan.personnel.length){scopes.push("用工形式");}if(plan&&plan.employee&&plan.employee.length){scopes.push("员工类型");}return scopes.length?scopes:["用工形式"];}
function syncPlanScopeFields(clearHidden){
  var scopes=selectedCheckboxValues("planApplyScopes"),personnelItem=document.getElementById("planPersonnelItem"),employeeItem=document.getElementById("planEmployeeItem"),showPersonnel=scopes.indexOf("用工形式")>-1,showEmployee=scopes.indexOf("员工类型")>-1;
  personnelItem.classList.toggle("scope-hidden",!showPersonnel);employeeItem.classList.toggle("scope-hidden",!showEmployee);
  if(clearHidden&&!showPersonnel){setCheckboxValues("planPersonnelTypes",[]);}
  if(clearHidden&&!showEmployee){setCheckboxValues("planEmployeeTypes",[]);}
}
function formulaActivationIssues(){var issues=[];leaves.forEach(function(leave){var r=unifiedRules[leave.key]||defaultRule();if(r.durationMode==="统一公式"&&String(r.durationFormula||"").trim()&&normalizedFormulaStatus(r.durationFormula,r.durationFormulaCheckStatus)!=="通过"){issues.push(leave.name+"的可休时长公式未通过检查");}if(r.conditionEnabled&&r.conditionMode==="公式配置"&&String(r.conditionFormula||"").trim()&&normalizedFormulaStatus(r.conditionFormula,r.conditionFormulaCheckStatus)!=="通过"){issues.push(leave.name+"的资格公式未通过检查");}});return issues;}
var activationTargetOrder={basic:0,leave:1,annual:2,comp:3,sick:4};
function activationIssuesForPlan(plan){var issues=(plan.activationIssues||[]).map(function(issue){return Object.assign({},issue);});formulaActivationIssues().forEach(function(message,index){if(!issues.some(function(issue){return issue.message===message;})){issues.push({target:"leave",order:100+index,message:message});}});return issues.sort(function(a,b){return (activationTargetOrder[a.target]||0)-(activationTargetOrder[b.target]||0)||(a.order||0)-(b.order||0);});}
function activationIssuesHtml(issues){if(issues.length===1){return '<div class="activation-validation-single">'+escapeRuleHtml(issues[0].message)+'</div>';}return '<div class="activation-validation-summary">共 '+issues.length+' 项校验未通过，请修改后再启用。</div><ol class="validation-list">'+issues.map(function(issue){return '<li>'+escapeRuleHtml(issue.message)+'</li>';}).join("")+'</ol>';}
function locateActivationIssue(issue){var target=issue&&issue.target;if(target&&target!=="basic"&&activationTargetOrder[target]!=null){switchTab(target);var panel=document.getElementById("panel-"+target);if(panel){panel.scrollIntoView({block:"start"});}return;}switchTab("leave");window.scrollTo(0,0);}
function showPlanActivationIssues(plan,issues){var ordered=(issues||[]).slice().sort(function(a,b){return (activationTargetOrder[a.target]||0)-(activationTargetOrder[b.target]||0)||(a.order||0)-(b.order||0);}),first=ordered[0];openConfirm("假期方案启用失败",activationIssuesHtml(ordered),function(){openPlanEditor(plan.id,false);locateActivationIssue(first);},{confirmText:"去修改",cancelText:"取消",variant:"activation-validation"});}
function renderPlans(){
  var name=document.getElementById("planFilterName").value.trim(),region=document.getElementById("planFilterRegion").value,personnel=document.getElementById("planFilterPersonnel").value,employee=document.getElementById("planFilterEmployee").value,state=document.getElementById("planFilterState").value;
  var rows=plans.filter(function(p){return planNameMatches(p,name)&&(region==="全部"||planRegionValues(p).indexOf(region)>-1)&&(personnel==="全部"||p.personnel.indexOf(personnel)>-1)&&(employee==="全部"||p.employee.indexOf(employee)>-1)&&(state==="全部"||p.state===state);}).sort(function(a,b){return String(b.updated).localeCompare(String(a.updated))||String(b.created).localeCompare(String(a.created));});currentFilteredPlans=rows.slice();
  document.getElementById("planCount").textContent="共 "+rows.length+" 条";document.getElementById("paginationTotal").textContent="共 "+rows.length+" 条";
  document.getElementById("planRows").innerHTML=rows.length?rows.map(function(p){var edit=p.state==="启用"?'<button class="btn-text edit-plan" data-id="'+p.id+'">编辑</button>':'';return '<tr><td><b>'+planDisplayName(p)+'</b></td><td><button class="version-link" data-id="'+p.id+'">'+p.version+'</button></td><td>'+p.region+'</td><td>'+formatList(p.personnel)+'</td><td>'+formatList(p.employee)+'</td><td><span class="status '+(p.state==="停用"?'disabled':'')+'">'+p.state+'</span></td><td>'+p.creator+'</td><td>'+p.created+'</td><td>'+p.updater+'</td><td>'+p.updated+'</td><td><div class="row-actions">'+edit+'<button class="btn-text copy-plan" data-id="'+p.id+'">复制</button><button class="btn-text toggle-plan" data-id="'+p.id+'">'+(p.state==="启用"?"停用":"启用")+'</button></div></td></tr>';}).join(""):'<tr><td class="table-empty" colspan="11">没有符合条件的假期方案</td></tr>';
  document.querySelectorAll(".edit-plan").forEach(function(btn){btn.onclick=function(){openPlanEditor(btn.dataset.id,false);};});
  document.querySelectorAll(".copy-plan").forEach(function(btn){btn.onclick=function(){openPlanEditor("",true,btn.dataset.id);};});
  document.querySelectorAll(".toggle-plan").forEach(function(btn){btn.onclick=function(){var plan=plans.find(function(p){return p.id===btn.dataset.id;});if(plan.state==="启用"){openConfirm("停用假期方案","停用后，该方案不再匹配新的员工和业务日期。<div class=\"confirm-note\">历史申请、审批中的单据和已生成额度保持不变；停用前需确认受影响员工仍可匹配其他启用方案。</div>",function(){plan.state="停用";plan.updated="2026-07-25 10:00";renderPlans();showToast("方案已停用");});}else{var activationIssues=activationIssuesForPlan(plan);if(activationIssues.length){showPlanActivationIssues(plan,activationIssues);return;}openConfirm("启用假期方案","启用前需确认方案信息完整、适用员工不与其他启用方案重复，且年假、调休假、病假额度规则已配置。",function(){plan.state="启用";plan.updated="2026-07-25 10:00";renderPlans();showToast("方案已启用");});}};});
  document.querySelectorAll(".version-link").forEach(function(btn){btn.onclick=function(e){e.stopPropagation();openVersionHistory(btn.dataset.id,btn);};});
}
function showView(name){document.getElementById("planListView").classList.toggle("active",name==="list");document.getElementById("planEditView").classList.toggle("active",name==="edit");document.getElementById("attachmentListView").classList.toggle("active",name==="attachments");document.getElementById("navPlans").classList.toggle("active",name!=="attachments");document.getElementById("attachmentTypesMenu").classList.toggle("active",name==="attachments");var editLabel=viewingHistoricalVersion?"查看历史版本":editingPlanIsNew?"新增":"编辑";document.getElementById("breadcrumb").innerHTML=name==="attachments"?'考勤管理 / 基础设置 / <span>附件类型</span>':name==="list"?'考勤管理 / 基础设置 / <span>假期方案</span>':'考勤管理 / 基础设置 / 假期方案 / <span>'+editLabel+'</span>';window.scrollTo(0,0);}
function selectedCheckboxValues(id){return Array.from(document.querySelectorAll("#"+id+' input[type="checkbox"]:checked')).map(function(x){return x.value;});}
function closeEnumMultiSelects(except){document.querySelectorAll(".enum-multiselect.open").forEach(function(box){if(box===except){return;}box.classList.remove("open");var menu=box.querySelector(".enum-select-menu"),trigger=box.querySelector(".enum-select-trigger");if(menu){menu.hidden=true;}if(trigger){trigger.setAttribute("aria-expanded","false");}});}
function updateEnumMultiSelect(id){var box=document.getElementById(id);if(!box){return;}var values=selectedCheckboxValues(id),label=box.querySelector(".enum-select-value");if(!label){return;}label.textContent=!values.length?"请选择":values.length<=2?values.join("、"):"已选择"+values.length+"项";label.classList.toggle("placeholder",!values.length);}
function bindEnumMultiSelect(id){var box=document.getElementById(id);if(!box){return;}var trigger=box.querySelector(".enum-select-trigger"),menu=box.querySelector(".enum-select-menu");trigger.onclick=function(e){e.stopPropagation();var willOpen=!box.classList.contains("open");closeEnumMultiSelects(box);box.classList.toggle("open",willOpen);menu.hidden=!willOpen;trigger.setAttribute("aria-expanded",String(willOpen));};menu.onclick=function(e){e.stopPropagation();};box.querySelectorAll('input[type="checkbox"]').forEach(function(input){input.onchange=function(){updateEnumMultiSelect(id);if(id==="planApplyScopes"){syncPlanScopeFields(true);}planFormDirty=true;};});updateEnumMultiSelect(id);}
function setCheckboxValues(id,values){document.querySelectorAll("#"+id+' input[type="checkbox"]').forEach(function(x){x.checked=(values||[]).indexOf(x.value)>-1;});updateEnumMultiSelect(id);}
function setPlanEditorReadonly(version){
  viewingHistoricalVersion=version||"";
  var view=document.getElementById("planEditView"),save=document.getElementById("savePlan"),cancel=document.getElementById("cancelPlanEdit");
  view.classList.toggle("history-readonly",!!viewingHistoricalVersion);
  save.hidden=!!viewingHistoricalVersion;
  save.style.display=viewingHistoricalVersion?"none":"";
  cancel.textContent=viewingHistoricalVersion?"返回":"取消";
}
function openPlanEditor(id,isNew,copySourceId,historyVersion){
  editingPlanId=id||"";editingPlanIsNew=!!isNew;editingPlanCopySource=copySourceId||"";setPlanEditorReadonly(historyVersion||"");
  var source=copySourceId?plans.find(function(x){return x.id===copySourceId;}):null;
  if(isNew&&!source){annualEligibilityEnabled=false;crossYearRuleEnabled=false;renderBoundary("annual");}
  var p=isNew?(source?JSON.parse(JSON.stringify(source)):{name:"",names:{zh_CN:"",en_US:""},version:"保存后生成",region:"中国区",regions:["中国区"],applyScopes:["用工形式"],personnel:["正式员工"],employee:[],state:"启用"}):plans.find(function(x){return x.id===id;});
  if(source){p.name="";p.names={zh_CN:"",en_US:""};p.version="保存后生成";p.state="启用";}
  editingPlanNames=planNames(p);
  var repair=!isNew&&!viewingHistoricalVersion&&p.state==="停用",title=viewingHistoricalVersion?planDisplayName(p)+" · 历史版本":isNew?"新增假期方案":planDisplayName(p);
  var mode=viewingHistoricalVersion?"查看历史版本":isNew?"新增假期方案":repair?"修复假期方案":"编辑假期方案";
  var meta=viewingHistoricalVersion?'<span>方案版本：'+viewingHistoricalVersion+'</span><span>只读</span>':source?'<span>已复制“'+planDisplayName(source)+'”的配置，请重新填写方案名称；保存后生成新方案并启用</span>':isNew?'<span>首次保存后生成版本并启用</span>':'<span>方案版本：'+p.version+'</span><span>状态：'+p.state+'</span>'+(repair?'<span>保存后仍保持停用</span>':'');
  document.getElementById("planEditorTitle").textContent=title;document.getElementById("editorModeText").textContent=mode;
  document.getElementById("planEditorMeta").innerHTML=meta;document.getElementById("planName").value=editingPlanNames.zh_CN;document.getElementById("planVersionDisplay").textContent=viewingHistoricalVersion||p.version;setCheckboxValues("planRegions",planRegionValues(p));setCheckboxValues("planApplyScopes",planScopeValues(p));setCheckboxValues("planPersonnelTypes",p.personnel);setCheckboxValues("planEmployeeTypes",p.employee);syncPlanScopeFields(false);closeEnumMultiSelects();planFormDirty=false;showView("edit");
}
function collectPlanForm(){editingPlanNames.zh_CN=document.getElementById("planName").value.trim();var regions=selectedCheckboxValues("planRegions"),applyScopes=selectedCheckboxValues("planApplyScopes");return {name:editingPlanNames.zh_CN,names:Object.assign({},editingPlanNames),region:regions.join("、"),regions:regions,applyScopes:applyScopes,personnel:applyScopes.indexOf("用工形式")>-1?selectedCheckboxValues("planPersonnelTypes"):[],employee:applyScopes.indexOf("员工类型")>-1?selectedCheckboxValues("planEmployeeTypes"):[]};}
function validatePlanForm(form){var issues=[];if(!form.name){issues.push("请填写方案名称");}if(!form.regions.length){issues.push("请至少选择一个划分区域");}if(!form.applyScopes.length){issues.push("请至少选择一种适用范围匹配方式");}if(form.applyScopes.indexOf("用工形式")>-1&&!form.personnel.length){issues.push("请选择用工形式");}if(form.applyScopes.indexOf("员工类型")>-1&&!form.employee.length){issues.push("请选择员工类型");}if(annualEligibilityEnabled&&!collectConditionSet(document.querySelector(".annual-eligibility-condition-list")).length){issues.push("已启用额度获得条件，请至少添加一条完整条件");}return issues;}
function showPlanValidationIssues(title,issues){var body='<div class="notice">共'+issues.length+'项未通过，请修改后重试。</div><ol class="validation-list">'+issues.map(function(issue){return "<li>"+issue+"</li>";}).join("")+"</ol>";openConfirm(title,body,null);}
function savePlan(){
  var form=collectPlanForm(),issues=validatePlanForm(form).concat(formulaActivationIssues());if(issues.length){showPlanValidationIssues("假期方案暂不能保存",issues);return;}
  if(editingPlanIsNew){var plan={id:"plan-"+Date.now(),name:form.name,names:form.names,version:"00001",region:form.region,regions:form.regions,applyScopes:form.applyScopes,personnel:form.personnel,employee:form.employee,state:"启用",creator:"当前用户",created:"2026-07-25 10:00",updater:"当前用户",updated:"2026-07-25 10:00"};plans.unshift(plan);editingPlanId=plan.id;editingPlanIsNew=false;showToast(editingPlanCopySource?"复制成功":"新增成功");editingPlanCopySource="";}
  else{var current=plans.find(function(x){return x.id===editingPlanId;}),next=String(parseInt(current.version,10)+1).padStart(5,"0");Object.assign(current,form,{version:next,state:current.state,updater:"当前用户",updated:"2026-07-25 10:00"});showToast("保存成功");}
  planFormDirty=false;renderPlans();setTimeout(function(){showView("list");},450);
}
function cancelPlanEditor(){if(viewingHistoricalVersion){setPlanEditorReadonly("");showView("list");return;}if(planFormDirty&&!window.confirm("当前修改尚未保存，确定离开吗？")){return;}editingPlanCopySource="";showView("list");}
function openPlanLanguageEditor(){
  editingPlanNames.zh_CN=document.getElementById("planName").value.trim();
  document.getElementById("planNameZhCn").value=editingPlanNames.zh_CN;
  document.getElementById("planNameEnUs").value=editingPlanNames.en_US||"";
  var readonly=!!viewingHistoricalVersion;
  document.getElementById("planNameZhCn").disabled=readonly;
  document.getElementById("planNameEnUs").disabled=readonly;
  document.getElementById("savePlanLanguage").hidden=readonly;
  document.getElementById("cancelPlanLanguage").textContent=readonly?"关闭":"取消";
  document.getElementById("planLanguageMask").classList.add("show");
}
function closePlanLanguageEditor(){document.getElementById("planLanguageMask").classList.remove("show");}
function savePlanLanguageEditor(){
  var zh=document.getElementById("planNameZhCn").value.trim(),en=document.getElementById("planNameEnUs").value.trim();
  if(!zh){showToast("请填写简体中文方案名称");return;}
  editingPlanNames={zh_CN:zh,en_US:en};
  document.getElementById("planName").value=zh;
  planFormDirty=true;
  closePlanLanguageEditor();
  showToast("多语言名称已更新");
}
function openConfirm(title,body,action,options){options=options||{};document.getElementById("confirmTitle").textContent=title;document.getElementById("confirmBody").innerHTML=body;document.getElementById("confirmAction").textContent=options.confirmText||"确定";document.getElementById("cancelConfirm").textContent=options.cancelText||"取消";document.getElementById("confirmDialog").classList.toggle("activation-validation-dialog",options.variant==="activation-validation");pendingConfirmAction=action;document.getElementById("confirmMask").classList.add("show");}
function closeConfirm(){document.getElementById("confirmMask").classList.remove("show");document.getElementById("confirmDialog").classList.remove("activation-validation-dialog");document.getElementById("confirmAction").textContent="确定";document.getElementById("cancelConfirm").textContent="取消";pendingConfirmAction=null;}
function closeVersionPopover(){document.getElementById("versionPopover").classList.remove("show");}
function openVersionHistory(id,anchor){var p=plans.find(function(x){return x.id===id;}),latest=parseInt(p.version,10),versions=[];for(var i=0;i<Math.min(5,latest);i++){versions.push(String(latest-i).padStart(5,"0"));}var popover=document.getElementById("versionPopover");popover.innerHTML='<div class="version-popover-head"><span>'+planDisplayName(p)+' · 历史版本</span><button class="close" id="closeVersionPopover">×</button></div><div class="table-wrap"><table><thead><tr><th>序号</th><th>方案版本</th><th>最近修改人</th><th>最近修改时间</th></tr></thead><tbody>'+versions.map(function(v,index){return '<tr><td>'+(index+1)+'</td><td><button class="version-link history-version" data-version="'+v+'">'+v+'</button></td><td>'+(index===0?p.updater:p.creator)+'</td><td>'+(index===0?p.updated:p.created)+'</td></tr>';}).join("")+'</tbody></table></div><div class="pagination"><span>共'+versions.length+'条</span><span class="page-current">1</span><span>20条/页</span></div>';popover.classList.add("show");positionFloatingPopover(popover,anchor);document.getElementById("closeVersionPopover").onclick=closeVersionPopover;popover.querySelectorAll(".history-version").forEach(function(btn){btn.onclick=function(){var version=btn.dataset.version;closeVersionPopover();openPlanEditor(id,false,"",version);showToast("正在查看历史版本"+version);};});}
function annualFrameworkHtml(){return '<div class="annual-framework"><div class="annual-framework-note"><b>与休假配置的边界：</b>休假配置决定员工怎样申请、申请多久；本页只维护年假额度怎样生成、以什么单位记账以及怎样结转和结算。</div><div class="annual-scope"><span class="annual-stage-tag current">沿用方案头</span><div><div class="annual-scope-title">方案适用范围</div><div class="annual-scope-text">先按方案范围命中员工；下面的人员状态只决定是否给命中员工生成年假额度。</div></div></div><section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">额度生成口径</div><div class="annual-config-desc">承接 OEHR 原有最小单位、天转小时和进位字段，但改成明确的额度业务名称。</div></div><div class="annual-config-body"><div class="business-field-grid"><label class="business-field annual-status-field"><span class="form-label"><span class="required">*</span>哪些人员状态生成额度 <span class="hint" data-tip="这里只控制年假额度生成，不代替休假申请资格。">?</span></span>'+checkboxGroupHtml("annualGenerateStatus",["正式","试用"],["正式","试用"])+'</label><label class="business-field"><span class="form-label"><span class="required">*</span>政策额度单位 <span class="hint" data-tip="年假政策最初按天还是按小时给额度，例如每年5天。">?</span></span><select class="form-select" id="annualGrantUnit"><option selected>天</option><option>小时</option></select></label><label class="business-field"><span class="form-label"><span class="required">*</span>额度账户单位 <span class="hint" data-tip="员工年假余额最终按天还是按小时保存和扣减。">?</span></span><select class="form-select" id="annualBalanceUnit"><option selected>小时</option><option>天</option></select></label></div><div class="annual-conversion-box" id="annualConversionBox"><div class="annual-conversion-row"><span class="required">*</span><b>1天额度折合</b><input class="form-input" id="annualDayHours" value="8"><span class="annual-unit-tag">小时</span><span class="hint" data-tip="只用于把政策天数额度转换成小时余额，不代表员工当天班次一定是8小时。">?</span></div><div class="field-note">示例：政策额度5天，1天折合8小时，系统生成40小时余额。不同班次员工如何扣减仍需结合企业政策确认。</div></div><div class="business-field-grid" style="margin-top:14px"><label class="business-field"><span class="form-label"><span class="required">*</span>额度结果保留小数位 <span class="hint" data-tip="只处理额度生成结果，不处理本次休假申请时长。">?</span></span><select class="form-select"><option>0位</option><option>1位</option><option selected>2位</option></select></label><label class="business-field"><span class="form-label"><span class="required">*</span>额度生成进位方式 <span class="hint" data-tip="决定折算后的额度向上、向下还是四舍五入。">?</span></span><select class="form-select"><option>向上取整</option><option selected>四舍五入</option><option>向下取整</option></select></label></div><div class="section-result" id="annualUnitResult">当前口径：年假按天确定政策额度，转换成小时余额保存；休假申请页仍按年假自身的申请计量单位计算本次时长。</div></div></section><div class="annual-structure-grid"><section class="annual-stage"><span class="annual-stage-tag current">OEHR 现有</span><div class="annual-stage-title">年假额度生成</div><div class="annual-stage-text">工龄或工时、额度阶梯、公式和发放频率，计算出本周期应生成的额度。</div></section><section class="annual-stage add"><span class="annual-stage-tag add">通用补充</span><div class="annual-stage-title">申请资格</div><div class="annual-stage-text">决定已生成的余额何时可以申请，例如连续工作满12个月或转正后可用。</div></section><section class="annual-stage"><span class="annual-stage-tag operate">现有为主</span><div class="annual-stage-title">余额生命周期</div><div class="annual-stage-text">有效期、扣减顺序、结转、失效、离职结算和销假恢复。</div></section><section class="annual-stage add"><span class="annual-stage-tag add">按需启用</span><div class="annual-stage-title">复杂累计规则</div><div class="annual-stage-text">按周期工时、司龄档位和累计上限生成额度；普通国内年假不必开启。</div></section></div></div>';}
function bindAnnualFramework(){var grant=document.getElementById("annualGrantUnit"),balance=document.getElementById("annualBalanceUnit"),box=document.getElementById("annualConversionBox"),result=document.getElementById("annualUnitResult");if(!grant||!balance||!box){return;}var sync=function(){var convert=grant.value==="天"&&balance.value==="小时";box.style.display=convert?"block":"none";if(result){result.textContent=convert?"当前口径：年假按天确定政策额度，转换成小时余额保存；休假申请页仍按年假自身的申请计量单位计算本次时长。":grant.value===balance.value?"当前口径：政策额度和账户余额使用同一单位，不需要天、小时换算。":"当前单位组合暂不支持，请统一单位或改为“天额度转小时余额”。";}};grant.onchange=sync;balance.onchange=sync;sync();}
function annualConfigPageHtml(){return `
<div class="annual-framework">
  <div class="annual-page-head">
    <div><div class="annual-page-title">年假配置</div><div class="panel-sub">维护年假额度的生成、结转和结算。员工怎样申请年假仍在“休假配置”中维护。</div></div>
    <div class="toolbar"><span class="annual-save-state">国内标准方案 · 已配置</span><button class="btn btn-primary" id="saveAnnualConfig">保存</button></div>
  </div>
  <div class="annual-steps" role="tablist">
    <button class="annual-step active" data-annual-step="grant"><span class="annual-step-no">1</span>年假生成规则<span class="annual-step-summary">公式配置 · 每日预发</span></button>
    <button class="annual-step" data-annual-step="carry"><span class="annual-step-no">2</span>年假结转规则<span class="annual-step-summary">余额转下期 · 次年末失效</span></button>
    <button class="annual-step" data-annual-step="settle"><span class="annual-step-no">3</span>年假结算规则<span class="annual-step-summary">过期及离职均不结算</span></button>
  </div>

  <div class="annual-step-pane active" data-annual-pane="grant">
    <div class="annual-mode-row"><div class="annual-mode-switch"><button class="annual-mode active">标准配置</button><button class="annual-mode">公式配置</button></div><button class="btn-text" id="annualGrantGuide">规则说明</button></div>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">1. 发放周期与方式</div><div class="annual-config-desc">普通年假按自然年归属，每日计算并预发当日应得额度。</div></div>
      <div class="annual-config-body">
        ${businessFieldsHtml([
          {label:"年假周期",value:"自然年",options:["自然年","自定义周期"],required:true},
          {label:"归属年度",value:"周期开始日期所在年度",options:["周期开始日期所在年度","周期结束日期所在年度"],required:true},
          {label:"发放人员状态",value:"正式",options:["正式","正式、试用"],required:true,tip:"普通发放只面向正式员工；跨年转正的入职年度额度由下方专项规则补发。"},
          {label:"发放方式",value:"预发",options:["预发","实发"],required:true},
          {label:"发放时间",value:"每日",options:["每日","每月","周期开始日"],required:true},
          {label:"计算精度",value:"年",options:["年","月","考勤周期"],required:true,tip:"计算精度决定公式取数周期；每日发放由“发放时间”控制。"}
        ])}
      </div>
    </section>

    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">2. 标准额度</div><div class="annual-config-desc">按工龄起算日匹配档位，政策额度按天定义、账户按小时记账，1天折合8小时。</div></div>
      <div class="annual-config-body">
        <div class="annual-rule-summary">
          <div class="summary-tile"><div class="summary-tile-label">额度匹配模式</div><div class="summary-tile-value">工龄（工龄起算日）</div></div>
          <div class="summary-tile"><div class="summary-tile-label">跨档折算</div><div class="summary-tile-value">按比例折算</div></div>
          <div class="summary-tile"><div class="summary-tile-label">账户换算</div><div class="summary-tile-value">1天 = 8小时</div></div>
        </div>
        <div class="table-wrap"><table class="annual-table"><thead><tr><th>工龄区间（年）</th><th>标准额度（天）</th><th>账户额度（小时）</th><th>适用说明</th></tr></thead><tbody>
          <tr><td>(0, 9.99]</td><td>5</td><td>40</td><td>累计工作已满1年不满10年</td></tr>
          <tr><td>(9.99, 19.99]</td><td>10</td><td>80</td><td>累计工作已满10年不满20年</td></tr>
          <tr><td>(19.99, 999]</td><td>15</td><td>120</td><td>累计工作已满20年</td></tr>
        </tbody></table></div>
      </div>
    </section>

    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">3. 额度计算公式</div><div class="annual-config-desc">每日保留折算结果；普通年假不按8小时向下取整。</div></div>
      <div class="annual-config-body">
        <div class="annual-formula-card">
          <div class="annual-formula-title"><span>普通年假发放公式</span><button class="btn-text" id="editAnnualFormula">编辑公式</button></div>
          <div class="annual-formula-code">取标准额度() × 取自然年实际在职天数(入职日期) ÷ 取自然年总天数()</div>
          <div class="annual-formula-meta"><span>是否含标准额度：是</span><span>进位方式：四舍五入</span><span>保留：2位小数</span><span>发放：每日预发</span></div>
        </div>
        <div class="section-result"><b>结果说明：</b>40小时档员工每天按累计在职天数更新应得额度。保留2位小数，不将普通每日发放结果统一按1天向下取整。</div>
      </div>
    </section>

    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">4. 特殊发放规则</div><div class="annual-config-desc">只处理不能由普通每日发放完整表达的专项场景。</div></div>
      <div class="annual-config-body">
        <div class="special-rule-card">
          <div class="special-rule-main">
            <div><div class="special-rule-title"><span class="rule-status">已启用</span>跨年度转正补发</div><div class="special-rule-desc">入职年度处于试用期、次年转正时，补算归属入职年度的年假。</div></div>
            <div class="special-rule-flow"><span class="flow-node">转正生效</span><span>→</span><span class="flow-node">补算入职年度</span><span>→</span><span class="flow-node">按整天向下取整</span><span>→</span><span class="flow-node">结转至转正年度</span></div>
            <button class="btn" id="configureCrossYear">配置</button>
          </div>
          <div class="special-rule-foot">专项取整边界：折算后不足1整天不生成；达到1整天后按整天生成。该规则不影响普通年假每日发放。</div>
        </div>
      </div>
    </section>
  </div>

  <div class="annual-step-pane" data-annual-pane="carry">
    <div class="annual-rule-summary">
      <div class="summary-tile"><div class="summary-tile-label">结转方式</div><div class="summary-tile-value">余额转下期</div></div>
      <div class="summary-tile"><div class="summary-tile-label">结转有效期</div><div class="summary-tile-value">下一年12月31日失效</div></div>
      <div class="summary-tile"><div class="summary-tile-label">再次结转</div><div class="summary-tile-value">不允许</div></div>
    </div>
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">年假结转规则</div><div class="annual-config-desc">普通年度余额和跨年度转正补发额度共用同一结转引擎。</div></div><div class="annual-config-body">
      ${businessFieldsHtml([
        {label:"周期结束后",value:"余额转入下一周期",options:["余额转入下一周期","余额到期失效"],required:true},
        {label:"转下期额度有效期",value:"下一年年假周期结束",options:["下一年年假周期结束","固定日期","永久有效"],required:true},
        {label:"上期结转余额再次结转",value:"否",options:["否","是"],required:true},
        {label:"余额扣减顺序",value:"按有效期先到期先扣",options:["按有效期先到期先扣","按生成时间先生成先扣"],required:true},
        {label:"同日到期时",value:"优先扣减旧年度额度",options:["优先扣减旧年度额度","优先扣减本年度额度"],required:true},
        {label:"销假恢复",value:"恢复原扣减批次和原失效日",options:["恢复原扣减批次和原失效日","恢复到当前年度"],required:true}
      ])}
      <div class="section-result"><b>跨年度转正补发：</b>补算结果先生成一笔归属入职年度的专项额度，再按本页规则结转至转正年度；补发本身属于“生成规则”，结转只负责搬运该批额度。</div>
    </div></section>
  </div>

  <div class="annual-step-pane" data-annual-pane="settle">
    <div class="annual-rule-summary">
      <div class="summary-tile"><div class="summary-tile-label">普通过期</div><div class="summary-tile-value">不结算，到期失效</div></div>
      <div class="summary-tile"><div class="summary-tile-label">离职</div><div class="summary-tile-value">暂不结算</div></div>
      <div class="summary-tile"><div class="summary-tile-label">特殊岗位折现</div><div class="summary-tile-value">审批后交薪酬处理</div></div>
    </div>
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">年假结算规则</div><div class="annual-config-desc">考勤负责输出获批或失效额度，工资折现由薪酬处理。</div></div><div class="annual-config-body">
      ${businessFieldsHtml([
        {label:"普通额度到期",value:"不结算",options:["不结算","全部结算","按比例结算"],required:true},
        {label:"员工离职",value:"不结算",options:["不结算","全部结算","按比例结算"],required:true}
      ])}
      <div class="notice warning" style="margin-top:14px"><b>特殊岗位年假折现不在这里自动判断。</b><br>员工发起折现申请，经经理和HR审批后，将获批时长输出给薪酬计算。页面数值条件无法完整表达“岗位＋本人申请＋多级审批”。</div>
    </div></section>
  </div>
</div>`;}

function annualOehrPageHtml(){return `
<div class="annual-framework">
  <div class="annual-steps" role="tablist">
    <button class="annual-step active" data-annual-step="grant"><span class="annual-step-no">1</span>年假生成规则</button>
    <button class="annual-step" data-annual-step="carry"><span class="annual-step-no">2</span>年假结转规则</button>
    <button class="annual-step" data-annual-step="settle"><span class="annual-step-no">3</span>年假结算规则</button>
  </div>

  <div class="annual-step-pane active" data-annual-pane="grant">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">配置方式</div></div>
      <div class="annual-config-body oehr-config-mode"><div class="annual-mode-switch"><button class="annual-mode active">标准配置</button><button class="annual-mode">公式配置</button></div></div>
    </section>

    <div class="annual-generation-group-title"><span class="annual-generation-group-no">1</span>额度生成资格</div>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">哪些员工可以获得年假额度 <span class="hint" data-tip="只控制本次年假额度生成，不代替休假申请资格，也不直接清除已有有效余额。">?</span></div><div class="annual-config-desc">在方案适用范围内，进一步判断哪些员工参加年假额度计算。</div></div>
      <div class="annual-config-body annual-quota-eligibility">
        ${conditionSetHtml([
          condition("任职信息·人员状态","等于","正式"),
          condition("任职信息·入职日期","已填写",""),
          condition("组织任职·主任职职位","不包含","司机")
        ],"同时满足全部条件（且）","annual-eligibility-condition-list",annualEligibilityFields)}
        <div class="field-note">系统在每次生成或重算额度时，读取员工当日有效的任职和档案信息；不满足条件时，不生成本次年假额度。</div>
      </div>
    </section>

    <div class="annual-generation-group-title"><span class="annual-generation-group-no">2</span>普通年假生成</div>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">发放周期 <button type="button" class="hint hint-action" id="annualCycleHelp" data-tip="点击查看发放周期字段释义" aria-label="查看发放周期字段释义">?</button></div></div>
      <div class="annual-config-body">
        ${businessFieldsHtml([
          {label:"年假周期",value:"自然年",options:["自然年","自定义周期"],required:true},
          {label:"归属年度",value:"周期开始日期所在年度",options:["周期开始日期所在年度","周期结束日期所在年度"],required:true}
        ])}
        <div class="business-field oehr-full-field" style="margin-top:14px"><span class="form-label"><span class="required">*</span>有效期</span><div class="oehr-radio-line">
          <label class="oehr-radio-option"><input type="radio" name="annualValidity">年假周期结束后失效</label>
          <label class="oehr-radio-option"><input type="radio" name="annualValidity" checked>固定日期后失效</label>
          <span class="oehr-radio-inline"><select class="form-select"><option>次年</option><option>当年</option></select><input class="form-input" value="12/31" aria-label="固定日期"><span>后失效</span></span>
        </div></div>
      </div>
    </section>

    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">发放规则 <button type="button" class="hint hint-action" id="annualDistributionHelp" data-tip="点击查看发放规则字段释义" aria-label="查看发放规则字段释义">?</button></div></div>
      <div class="annual-config-body">
        <div class="business-field-grid">
          <label class="business-field"><span class="form-label"><span class="required">*</span>发放方式 <span class="hint" data-tip="预发会把计算截止日包含到当天；每日发放采用预发。">?</span></span><select class="form-select"><option selected>预发</option><option>实发</option></select></label>
          <div class="business-field oehr-full-field"><span class="form-label"><span class="required">*</span>发放时间</span><div class="oehr-radio-line">
            <label class="oehr-radio-option"><input type="radio" name="annualReleaseTime" checked>不区分入职当年/月</label>
            <span class="oehr-radio-inline"><select class="form-select"><option selected>每日</option><option>每月</option><option>每年</option><option>每考勤周期</option><option>每入职日期</option></select></span>
            <label class="oehr-radio-option"><input type="radio" name="annualReleaseTime">区分入职当年/月</label>
          </div></div>
        </div>
      </div>
    </section>

    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">额度计算 <button type="button" class="hint hint-action" id="annualCalculationHelp" data-tip="点击查看额度计算字段释义" aria-label="查看额度计算字段释义">?</button></div></div>
      <div class="annual-config-body">
        ${businessFieldsHtml([
          {label:"是否含标准额度",value:"是",options:["是","否"],required:true},
          {label:"额度匹配模式",value:"工龄（工龄起算日）",options:["工龄（工龄起算日）","司龄（入职日期）","出勤时长"],required:true},
          {label:"是否管控标准额度上限",value:"否",options:["否","是"],required:true},
          {label:"额度跨阶折算方式",value:"按比例折算",options:["不折算，按跨阶前的工龄（工龄起算日）发放","不折算，按跨阶后的工龄（工龄起算日）发放","按比例折算","不涉及"],required:true,actionTipId:"annualCrossTierHelp",actionTipText:"点击查看四种跨阶折算方式说明",actionTipLabel:"查看额度跨阶折算方式说明"}
        ])}
        <div class="business-field oehr-full-field" style="margin-top:14px"><span class="form-label"><span class="required">*</span>计算规则 <button type="button" class="hint hint-action" id="annualFormulaHelp" data-tip="点击查看公式调整、函数区别和集团示例" aria-label="查看年假计算公式说明">?</button></span><div class="oehr-formula-row"><div class="annual-formula-code">取标准额度() × 取自然年实际在职天数(入职日期) ÷ 取自然年总天数()</div><button class="btn" id="editAnnualFormula">设置公式</button></div><div class="section-result"><b>跨档当年：</b>系统按跨档日拆分原档、新档两个日历区间，公式分别读取每个区间的实际在职天数后相加；结果保留小数，不按整天向下取整。</div></div>
        <div style="margin-top:14px">${businessFieldsHtml([
          {label:"计算精度",value:"年",options:["年","月","考勤周期"],required:true},
          {label:"进位方式",value:"四舍五入",options:["四舍五入","向上取整","向下取整"],required:true},
          {label:"小数位数",value:"两位",options:["零位","一位","两位","三位","四位"],required:true}
        ])}</div>
        <div class="business-field oehr-full-field" style="margin-top:14px"><span class="form-label"><span class="required">*</span>标准额度阶梯设置</span><div class="table-wrap"><table class="oehr-ladder"><thead><tr><th>开始工龄(&gt;)</th><th>结束工龄(&lt;=)</th><th>职级</th><th>标准额度(H)</th><th>判断条件不享有(非必填)</th><th>操作</th></tr></thead><tbody>
          <tr><td>0</td><td>9.99</td><td class="oehr-muted">—</td><td>40</td><td class="oehr-muted">—</td><td><button class="btn-text">删除</button></td></tr>
          <tr><td>9.99</td><td>19.99</td><td class="oehr-muted">—</td><td>80</td><td class="oehr-muted">—</td><td><button class="btn-text">删除</button></td></tr>
          <tr><td>19.99</td><td>999</td><td class="oehr-muted">—</td><td>120</td><td class="oehr-muted">—</td><td><button class="btn-text">删除</button></td></tr>
        </tbody></table></div><button class="btn" style="margin-top:10px">＋ 添加</button></div>
      </div>
    </section>

    <div class="annual-generation-group-title"><span class="annual-generation-group-no">3</span>补发规则</div>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">跨年度补发</div><div class="annual-config-desc">先补算并生成员工入职年度应得的年假，再按结转规则转入可使用的年度；因此本规则归在年假生成。</div></div>
      <div class="annual-config-body">
        <div class="table-wrap"><table class="annual-supplement-table"><thead><tr><th>规则名称</th><th>是否启用</th><th>什么时候补发</th><th>补发哪段年假</th><th>怎么算</th><th>补发后怎么处理</th><th>操作</th></tr></thead><tbody>
          <tr>
            <td><b>跨年度转正补发</b></td>
            <td><div class="table-switch"><button type="button" class="switch-toggle${crossYearRuleEnabled?" on":""}" id="crossYearListToggle" aria-pressed="${crossYearRuleEnabled}"></button><span id="crossYearListToggleText">${crossYearRuleEnabled?"启用":"停用"}</span></div></td>
            <td>员工转正后，首次符合“哪些员工可以获得年假额度”的全部条件时</td>
            <td>入职日至入职当年12月31日</td>
            <td>按入职当年的标准年假折算，结果按整天向下取整</td>
            <td>不足1天不补发；达到1天后转入符合条件的年度</td>
            <td><button class="btn-text" id="configureCrossYear">规则说明与试算</button></td>
          </tr>
        </tbody></table></div>
      </div>
    </section>
  </div>

  <div class="annual-step-pane" data-annual-pane="carry">
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">结转方式 <span class="hint" data-tip="决定年假周期结束后剩余额度是否进入下一周期。">?</span></div></div><div class="annual-config-body"><div class="oehr-radio-line">
      <label class="oehr-radio-option"><input type="radio" name="annualCarry">不结转，过期失效</label>
      <label class="oehr-radio-option"><input type="radio" name="annualCarry" checked>余额转下期</label>
    </div></div></section>
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">转下期设置</div></div><div class="annual-config-body"><div class="business-field"><span class="form-label"><span class="required">*</span>有效期</span><div class="oehr-radio-line">
      <label class="oehr-radio-option"><input type="radio" name="carryValidity">年假周期结束后失效</label>
      <label class="oehr-radio-option"><input type="radio" name="carryValidity" checked>固定日期后失效</label>
      <span class="oehr-radio-inline"><select class="form-select"><option selected>次年</option><option>当年</option></select><input class="form-input" value="12/31" aria-label="结转失效日期"><span>后失效</span></span>
      <label class="oehr-radio-option"><input type="radio" name="carryValidity">永久有效</label>
    </div><div class="section-result">补发年假先记在员工入职年度，再使用本页“余额转下期”规则转到员工符合年假发放条件的年度。</div></div></div></section>
  </div>

  <div class="annual-step-pane" data-annual-pane="settle">
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">过期结算 <span class="hint" data-tip="普通年假余额到期后不在考勤中自动折现。">?</span></div></div><div class="annual-config-body"><div class="oehr-radio-line">
      <label class="oehr-radio-option"><input type="radio" name="expirySettle" checked>不结算</label>
      <label class="oehr-radio-option"><input type="radio" name="expirySettle">按条件结算</label>
      <span class="oehr-muted">总失效额度满足条件时不结算，否则全部结算</span>
      <label class="oehr-radio-option"><input type="radio" name="expirySettle">全部结算</label>
    </div><div class="section-result">特殊岗位折现不使用页面数值条件；员工申请并经经理、HR审批后，将获批时长交薪酬处理。</div></div></section>
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">离职结算 <span class="hint" data-tip="当前国内适配暂设不结算，业务确认需要折现时再调整。">?</span></div></div><div class="annual-config-body"><div class="oehr-radio-line">
      <label class="oehr-radio-option"><input type="radio" name="leaveSettle" checked>不结算</label>
      <label class="oehr-radio-option"><input type="radio" name="leaveSettle">全部结算</label>
    </div></div></section>
  </div>
</div>`;}

function annualEligibilitySectionHtml(){return `
  <section class="annual-config-section">
    <div class="annual-config-body annual-quota-eligibility">
      <div class="annual-eligibility-switch-row"><button type="button" class="switch-toggle" id="annualEligibilityEnabled" aria-pressed="false"></button><span>设置额度获得条件</span><span class="hint" data-tip="用于在方案适用范围内进一步判断哪些员工可以获得年假额度，例如排除特定职位；不代替休假申请资格。">?</span></div>
      <div id="annualEligibilityConditionBody" style="display:none">
        ${conditionSetHtml([],"同时满足全部条件（且）","annual-eligibility-condition-list",annualEligibilityFields,true,"已启用额度获得条件，请至少添加一条条件。")}
      </div>
      <div class="section-result" id="annualEligibilityResult"><b>当前结果：</b>未设置额外条件；方案适用范围内员工均可参加年假额度计算。</div>
    </div>
  </section>`;}

function annualStandardConfigHtml(){return `
  <div class="annual-standard-stack">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">基本信息</div></div>
      <div class="annual-config-body">${businessFieldsHtml([
        {label:"人员状态",value:"请选择",options:["请选择","正式","试用","正式、试用"],required:true},
        {label:"最小单位",value:"请选择",options:["请选择","天","小时"],required:true},
        {label:"天转换为小时数",value:"",type:"number",suffix:"小时",required:true},
        {label:"小数位数",value:"请选择",options:["请选择","0位","1位","2位","3位","4位"],required:true},
        {label:"进位方式",value:"请选择",options:["请选择","四舍五入","向上取整","向下取整"],required:true}
      ])}</div>
    </section>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">额度配置规则</div></div>
      <div class="annual-config-body">${businessFieldsHtml([
        {label:"年假规则",value:"请选择",options:["请选择","按司龄匹配额度","按工龄匹配额度","按出勤时长匹配额度"],required:true},
        {label:"生成频率",value:"请选择",options:["请选择","每年","每月","每日","每考勤周期"],required:true},
        {label:"计算精度",value:"请选择",options:["请选择","年","月","考勤周期"],required:true},
        {label:"起算日期",value:"请选择",options:["请选择","入职日期","工龄起算日"],required:true},
        {label:"年假周期",value:"请选择",options:["请选择","自然年","自定义周期"],required:true}
      ])}</div>
    </section>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">特殊规则</div></div>
      <div class="annual-config-body">${businessFieldsHtml([
        {label:"全年应出勤小时数",value:"",type:"number",suffix:"小时"},
        {label:"累积限额",value:"",type:"number",suffix:"小时"},
        {label:"特殊系数",value:"",type:"number"}
      ])}</div>
    </section>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">有效期</div></div>
      <div class="annual-config-body">${businessFieldsHtml([
        {label:"额度有效期",value:"请选择",options:["请选择","年假周期结束后失效","次年12月31日后失效","永久有效"],required:true}
      ])}</div>
    </section>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">额度阶梯</div><div class="annual-config-desc">按选择的年假规则匹配标准额度。</div></div>
      <div class="annual-config-body">
        ${businessFieldsHtml([{label:"额度计算模式",value:"请选择",options:["请选择","按司龄匹配额度","按工龄匹配额度","按出勤时长匹配额度"],required:true}])}
        <div class="table-wrap" style="margin-top:14px"><table class="oehr-ladder"><thead><tr><th>开始司龄(&gt;)</th><th>结束司龄(&lt;=)</th><th>职级</th><th>标准额度（天）</th><th>不享有条件（非必填）</th><th>操作</th></tr></thead><tbody>
          <tr><td colspan="6" class="oehr-muted" style="text-align:center">尚未配置额度阶梯</td></tr>
        </tbody></table></div><button class="btn" style="margin-top:10px">＋ 添加</button>
      </div>
    </section>
  </div>`;}

function annualFormulaConfigHtml(){return `
  <section class="annual-config-section">
    <div class="annual-config-head"><div class="annual-config-title">发放周期 <button type="button" class="hint hint-action" id="annualCycleHelp" data-tip="查看字段说明" aria-label="查看发放周期字段说明">?</button></div></div>
    <div class="annual-config-body">
      ${businessFieldsHtml([
        {label:"年假周期",value:"请选择",options:["请选择","自然年","自定义周期"],required:true},
        {label:"归属年度",value:"请选择",options:["请选择","周期开始日期所在年度","周期结束日期所在年度"],required:true}
      ])}
      <div class="business-field oehr-full-field" style="margin-top:14px"><span class="form-label"><span class="required">*</span>有效期</span><div class="oehr-radio-line">
        <label class="oehr-radio-option"><input type="radio" name="annualValidity">年假周期结束后失效</label>
        <label class="oehr-radio-option"><input type="radio" name="annualValidity">固定日期后失效</label>
        <span class="oehr-radio-inline"><select class="form-select"><option selected>请选择</option><option>次年</option><option>当年</option></select><input class="form-input" value="" aria-label="固定日期"><span>后失效</span></span>
      </div></div>
    </div>
  </section>
  <section class="annual-config-section">
    <div class="annual-config-head"><div class="annual-config-title">发放规则 <button type="button" class="hint hint-action" id="annualDistributionHelp" data-tip="查看字段说明" aria-label="查看发放规则字段说明">?</button></div></div>
    <div class="annual-config-body">
      ${businessFieldsHtml([
        {label:"发放人员状态",value:"请选择",options:["请选择","正式","试用","正式、试用"],required:true},
        {label:"发放方式",value:"请选择",options:["请选择","实发","预发"],required:true}
      ])}
      <div class="business-field oehr-full-field" style="margin-top:14px"><span class="form-label"><span class="required">*</span>发放时间</span><div class="oehr-radio-line">
        <label class="oehr-radio-option"><input type="radio" name="annualReleaseTime">不区分入职当年／月</label>
        <span class="oehr-radio-inline"><select class="form-select"><option selected>请选择</option><option>每日</option><option>每月</option><option>每年</option><option>每考勤周期</option><option>每入职日期</option></select></span>
        <label class="oehr-radio-option"><input type="radio" name="annualReleaseTime">区分入职当年／月</label>
      </div></div>
    </div>
  </section>
  <section class="annual-config-section">
    <div class="annual-config-head"><div class="annual-config-title">额度计算 <button type="button" class="hint hint-action" id="annualCalculationHelp" data-tip="查看字段说明" aria-label="查看额度计算字段说明">?</button></div></div>
    <div class="annual-config-body">
      ${businessFieldsHtml([
        {label:"是否含标准额度",value:"请选择",options:["请选择","是","否"],required:true},
        {label:"额度匹配模式",value:"请选择",options:["请选择","司龄（入职日期）","工龄（工龄起算日）","出勤时长"],required:true},
        {label:"是否管控标准额度上限",value:"请选择",options:["请选择","否","是"],required:true},
        {label:"额度跨阶折算方式",value:"请选择",options:["请选择","不折算，按跨阶前档位发放","不折算，按跨阶后档位发放","按比例折算","不涉及"],required:true,actionTipId:"annualCrossTierHelp",actionTipText:"查看跨阶折算方式",actionTipLabel:"查看额度跨阶折算方式"}
      ])}
      <div class="business-field oehr-full-field" style="margin-top:14px"><span class="form-label"><span class="required">*</span>计算规则 <button type="button" class="hint hint-action" id="annualFormulaHelp" data-tip="查看公式和试算说明" aria-label="查看年假计算公式说明">?</button></span><div class="oehr-formula-row"><div class="annual-formula-code oehr-muted">尚未设置公式</div><button class="btn" id="editAnnualFormula">设置公式</button></div></div>
      <div style="margin-top:14px">${businessFieldsHtml([
        {label:"计算精度",value:"请选择",options:["请选择","年","月","考勤周期"],required:true},
        {label:"进位方式",value:"请选择",options:["请选择","四舍五入","向上取整","向下取整"],required:true},
        {label:"小数位数",value:"请选择",options:["请选择","0位","1位","2位","3位","4位"],required:true}
      ])}</div>
      <div class="business-field oehr-full-field" style="margin-top:14px"><span class="form-label"><span class="required">*</span>标准额度阶梯设置</span><div class="table-wrap"><table class="oehr-ladder"><thead><tr><th>开始司龄(&gt;)</th><th>结束司龄(&lt;=)</th><th>职级</th><th>标准额度（小时）</th><th>不享有条件（非必填）</th><th>操作</th></tr></thead><tbody>
        <tr><td colspan="6" class="oehr-muted" style="text-align:center">尚未配置标准额度阶梯</td></tr>
      </tbody></table></div><button class="btn" style="margin-top:10px">＋ 添加</button></div>
    </div>
  </section>`;}

function annualSupplementSectionHtml(){return `
  <section class="annual-config-section">
    <div class="annual-config-head"><div class="annual-config-title">跨年度补发</div><div class="annual-config-desc">补发属于额度生成；结转规则只负责把已生成的补发额度转到可使用年度。</div></div>
    <div class="annual-config-body"><div class="table-wrap"><table class="annual-supplement-table"><thead><tr><th>规则名称</th><th>是否启用</th><th>什么时候补发</th><th>补发哪段年假</th><th>怎么算</th><th>补发后怎么处理</th><th>操作</th></tr></thead><tbody>
      <tr><td><b>跨年度转正补发</b></td><td><div class="table-switch"><button type="button" class="switch-toggle${crossYearRuleEnabled?" on":""}" id="crossYearListToggle" aria-pressed="${crossYearRuleEnabled}"></button><span id="crossYearListToggleText">${crossYearRuleEnabled?"启用":"停用"}</span></div></td><td>员工转正后，首次满足年假额度生成条件时</td><td>入职日至入职当年12月31日</td><td>按入职年度标准额度折算并向下取整</td><td>不足1天不补发；达到1天后按结转规则处理</td><td><button class="btn-text" id="configureCrossYear">规则说明与试算</button></td></tr>
    </tbody></table></div></div>
  </section>`;}

function annualOehrPageHtmlV2(){return `
<div class="annual-framework">
  <div class="annual-steps" role="tablist">
    <button class="annual-step active" data-annual-step="grant"><span class="annual-step-no">1</span>年假生成规则</button>
    <button class="annual-step" data-annual-step="carry"><span class="annual-step-no">2</span>年假结转规则</button>
    <button class="annual-step" data-annual-step="settle"><span class="annual-step-no">3</span>年假结算规则</button>
  </div>
  <div class="annual-step-pane active" data-annual-pane="grant">
    <div class="quota-generation-flow">
      <div class="quota-stage-group">
        <div class="quota-stage-heading"><span class="quota-stage-number">1</span><div><div class="quota-stage-title">哪些员工可以获得年假额度</div><div class="quota-stage-desc">默认覆盖方案适用范围内员工；如需排除司机等员工，再设置额外条件。</div></div></div>
        ${annualEligibilitySectionHtml()}
      </div>
      <div class="quota-stage-group">
        <div class="quota-stage-heading"><span class="quota-stage-number">2</span><div><div class="quota-stage-title">额度如何计算与发放</div><div class="quota-stage-desc">选择一种计算方式，并维护该方式对应的发放、额度与有效期字段。</div></div></div>
        <div class="annual-mode-card"><div class="annual-mode-card-row"><b>额度计算方式</b><div class="annual-mode-switch"><button class="annual-mode active" data-annual-mode="standard">标准配置</button><button class="annual-mode" data-annual-mode="formula">公式配置</button></div><span class="annual-mode-explain">新建时默认选择标准配置；未填写字段不生成任何年假额度。</span></div></div>
        <div class="annual-mode-panels">
          <div class="annual-config-mode-panel active" data-annual-mode-panel="standard">${annualStandardConfigHtml()}</div>
          <div class="annual-config-mode-panel" data-annual-mode-panel="formula">${annualFormulaConfigHtml()}</div>
        </div>
      </div>
      <div class="quota-stage-group">
        <div class="quota-stage-heading"><span class="quota-stage-number">3</span><div><div class="quota-stage-title">是否需要特殊补发</div><div class="quota-stage-desc">普通额度生成之外的补发规则集中维护在这里。</div></div></div>
        ${annualSupplementSectionHtml()}
      </div>
    </div>
  </div>
  <div class="annual-step-pane" data-annual-pane="carry">
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">结转方式</div></div><div class="annual-config-body"><div class="oehr-radio-line"><label class="oehr-radio-option"><input type="radio" name="annualCarry">不结转，过期失效</label><label class="oehr-radio-option"><input type="radio" name="annualCarry">余额转下期</label></div></div></section>
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">转下期设置</div></div><div class="annual-config-body"><div class="business-field"><span class="form-label"><span class="required">*</span>有效期</span><div class="oehr-radio-line"><label class="oehr-radio-option"><input type="radio" name="carryValidity">年假周期结束后失效</label><label class="oehr-radio-option"><input type="radio" name="carryValidity">固定日期后失效</label><span class="oehr-radio-inline"><select class="form-select"><option selected>请选择</option><option>次年</option><option>当年</option></select><input class="form-input" value="" aria-label="结转失效日期"><span>后失效</span></span><label class="oehr-radio-option"><input type="radio" name="carryValidity">永久有效</label></div></div></div></section>
  </div>
  <div class="annual-step-pane" data-annual-pane="settle">
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">过期结算</div></div><div class="annual-config-body">
      <div class="oehr-radio-line">
        <label class="oehr-radio-option"><input type="radio" name="expirySettle" value="none">不结算</label>
        <label class="oehr-radio-option"><input type="radio" name="expirySettle" value="conditional">按条件结算</label>
        <label class="oehr-radio-option"><input type="radio" name="expirySettle" value="all">全部结算</label>
      </div>
      <div class="settlement-condition-row" id="annualExpiryConditionPanel" style="display:none">
        <span>当总失效额度</span>
        <select class="form-select" id="annualExpiryOperator"><option>小于</option><option>小于等于</option><option>大于</option><option>大于等于</option></select>
        <div class="input-with-suffix"><input class="form-input" id="annualExpiryThreshold" type="number" value="" min="0"><span class="input-suffix">小时</span></div>
        <span>时不结算，其余全部结算</span>
      </div>
      <div class="settlement-result" id="annualExpirySettlementResult"></div>
    </div></section>
    <section class="annual-config-section"><div class="annual-config-head"><div class="annual-config-title">离职结算</div></div><div class="annual-config-body">
      <div class="oehr-radio-line">
        <label class="oehr-radio-option"><input type="radio" name="leaveSettle" value="none">不结算</label>
        <label class="oehr-radio-option"><input type="radio" name="leaveSettle" value="all">全部结算</label>
      </div>
      <div class="settlement-result" id="annualLeaveSettlementResult"></div>
    </div></section>
  </div>
</div>`;}

function controlLayerHelpHtml(){return `
  <div class="notice">从整套方案到单次申请依次判断，四层规则各自解决一个问题，不需要重复配置。</div>
  <div class="table-wrap"><table class="control-layer-table"><thead><tr><th>控制层级</th><th>回答的问题</th><th>年假示例</th></tr></thead><tbody>
    <tr><td>假期方案适用范围</td><td>员工是否使用整套假期方案</td><td>某公司、组织、员工类型适用</td></tr>
    <tr><td>额度生成资格</td><td>员工是否获得年假额度</td><td>职位属于司机，不生成年假额度</td></tr>
    <tr><td>申请资格</td><td>员工即使有额度，是否允许申请</td><td>特殊情况下限制某类员工申请</td></tr>
    <tr><td>申请时余额校验</td><td>本次还有多少可以申请</td><td>可用余额为0，不能提交</td></tr>
  </tbody></table></div>`;}

function compSourceRuleHelpHtml(){return `
  <div class="notice"><b>配置边界：</b>“加班费／调休假”由加班方案决定；本页不重复配置补偿方式，只承接补偿方式已经确定为“调休假”的加班时长。</div>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">员工什么时候可以选择</div><div class="annual-drawer-section-body">
    <div class="trace-row"><span class="trace-label">提交加班申请</span><span class="trace-value">加班方案可同时开放“加班费、调休假”，员工在加班单中选择一种。</span></div>
    <div class="trace-row"><span class="trace-label">按打卡自动计算</span><span class="trace-value">加班方案只能预设一种补偿方式，不由员工选择。</span></div>
  </div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">选择后的处理</div><div class="annual-drawer-section-body">
    <div class="trace-row"><span class="trace-label">选择加班费</span><span class="trace-value">形成加班费工时，不进入调休额度生成。</span></div>
    <div class="trace-row"><span class="trace-label">选择调休假</span><span class="trace-value">进入本页“加班转调休设置”，再按加班来源判断是否转换，并计算额度、比例和有效期。</span></div>
  </div></section>
  <div class="section-result"><b>当前关系：</b>只有补偿方式确定为“调休假”的加班时长，才会进入调休额度生成。</div>`;}

function compOehrPageHtml(){return `
<div class="annual-framework comp-framework">
  <div class="annual-steps" role="tablist">
    <button class="annual-step active" data-quota-step="grant"><span class="annual-step-no">1</span>调休生成规则</button>
    <button class="annual-step" data-quota-step="carry"><span class="annual-step-no">2</span>调休结转规则</button>
    <button class="annual-step" data-quota-step="settle"><span class="annual-step-no">3</span>调休结算规则</button>
  </div>

  <div id="compConfigBody" data-quota-config-body>
    <div class="quota-step-pane active" data-quota-pane="grant">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">额度生成规则 <span class="hint" data-tip="只有加班补偿方式为“调休假”时，才按这里的来源设置生成调休额度。">?</span></div><div class="annual-config-desc">设置各类加班是否转换为调休额度及转换比例。</div></div>
      <div class="annual-config-body">
        <div class="form-label"><span class="required">*</span>加班转调休设置 <span class="rule-link" id="compSourceRuleHelp" role="button" tabindex="0">规则说明</span></div>
        <div class="table-wrap"><table class="comp-source-table"><thead><tr><th>加班来源</th><th>是否生成调休额度</th><th>转换比例</th><th>当前配置结果</th></tr></thead><tbody>
          <tr><td>工作日加班时长</td><td><select class="form-select"><option selected>转换</option><option>不转换</option></select></td><td><span class="ratio-tag">1:1</span></td><td>每1小时生成1小时调休</td></tr>
          <tr><td>公休日加班时长</td><td><select class="form-select"><option selected>转换</option><option>不转换</option></select></td><td><span class="ratio-tag">1:1</span></td><td>每1小时生成1小时调休</td></tr>
          <tr><td>节假日加班时长</td><td><select class="form-select"><option selected>转换</option><option>不转换</option></select></td><td><span class="ratio-tag">1:1</span></td><td>每1小时生成1小时调休</td></tr>
          <tr><td>综合工时加班时长</td><td><select class="form-select"><option>转换</option><option selected>不转换</option></select></td><td><span class="oehr-muted">—</span></td><td>当前不生成调休额度</td></tr>
        </tbody></table></div>

      </div>
    </section>

    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">额度使用规则 <span class="hint" data-tip="先使用更早到期的额度；有效期相同时，优先使用更早生成的额度。">?</span></div></div>
      <div class="annual-config-body">
        ${businessFieldsHtml([
          {label:"余额扣减顺序",value:"按余额有效期顺序扣减",options:["按余额有效期顺序扣减"],required:true,tip:"先失效的先扣；有效期相同时，先加班形成的额度先扣。"},
          {label:"销假恢复规则",value:"恢复至原加班来源额度",options:["恢复至原加班来源额度"],required:true,tip:"撤销已生效休假后，按原扣减关系恢复到对应的加班日期额度，保留原失效日。"}
        ])}
        <div class="special-rule-flow comp-use-flow"><span class="flow-node">按失效日排序</span><span>→</span><span class="flow-node">同失效日按加班日期排序</span><span>→</span><span class="flow-node">记录本次扣减来源</span><span>→</span><span class="flow-node">销假按来源恢复</span></div>
      </div>
    </section>
    </div>

    <div class="quota-step-pane" data-quota-pane="carry">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">有效期与延期</div><div class="annual-config-desc">设置每笔调休额度何时到期，以及到期前是否自动延期。</div></div>
      <div class="annual-config-body">
        <div class="form-label"><span class="required">*</span>余额有效期设置 <span class="hint" data-tip="有效期记录在每一笔加班来源额度上，不是所有调休共用一个年度余额。">?</span></div>
        <div class="comp-radio-stack">
          <label class="comp-radio-row active"><input type="radio" name="compExpiryType" value="overtime" checked><span>加班日期起</span><input class="form-input comp-number" value="6" aria-label="有效期数值"><select class="form-select comp-unit"><option>日</option><option selected>月</option><option>年</option></select><span>后失效</span><span class="recommended-choice compact">当前配置</span></label>
          <label class="comp-radio-row"><input type="radio" name="compExpiryType" value="fixed"><select class="form-select comp-fixed-type" disabled><option>当年</option><option>次年</option></select><span>固定日期</span><input class="form-input comp-date" value="12/31" disabled aria-label="固定失效日期"><span>失效</span></label>
          <label class="comp-radio-row"><input type="radio" name="compExpiryType" value="cycle"><span>考勤周期结束后失效</span></label>
          <label class="comp-radio-row"><input type="radio" name="compExpiryType" value="forever"><span>永久有效</span></label>
        </div>

        <div class="comp-inline-config">
          <div>
            <div class="form-label">余额自动延期设置</div>
            <div class="toggle-form-row"><button type="button" class="switch-toggle" id="compAutoDelay" aria-pressed="false"></button><span class="switch-text">到期后自动延期</span></div>
          </div>
          <div class="comp-delay-fields" id="compDelayFields">
            <span>到期后，余额自动延长</span><input class="form-input comp-number" value="1" disabled><select class="form-select comp-unit" disabled><option selected>月</option><option>日</option><option>年</option></select><span>后失效</span>
          </div>
        </div>
        <div class="section-result"><b>当前结果：</b>工作日、公休日、法定节假日加班按1:1生成调休；综合工时不转换。每笔调休从对应加班日期起6个月后失效，不自动延期。</div>
      </div>
    </section>

    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">到期处理 <span class="hint" data-tip="决定到期调休额度是否转为加班费时长；工资金额仍由薪酬计算。">?</span></div><div class="annual-config-desc">集团当前不做调休额度到期结算。</div></div>
      <div class="annual-config-body">
        <div class="toggle-form-row"><button type="button" class="switch-toggle" id="compExpirySettlement" aria-pressed="false"></button><span class="switch-text">允许结算调休假余额</span></div>
        <div class="comp-settlement-details" id="compExpirySettlementDetails" hidden>
          <div class="table-wrap"><table class="comp-source-table"><thead><tr><th>调休来源</th><th>是否结算</th><th>加班倍数</th></tr></thead><tbody>
            <tr><td>工作日调休假时长</td><td><select class="form-select"><option selected>结算</option><option>不结算</option></select></td><td><select class="form-select"><option>1.0</option><option selected>1.5</option><option>2.0</option><option>3.0</option></select></td></tr>
            <tr><td>公休日调休假时长</td><td><select class="form-select"><option selected>结算</option><option>不结算</option></select></td><td><select class="form-select"><option>1.0</option><option>1.5</option><option selected>2.0</option><option>3.0</option></select></td></tr>
            <tr><td>节假日调休假时长</td><td><select class="form-select"><option selected>结算</option><option>不结算</option></select></td><td><select class="form-select"><option>1.0</option><option>1.5</option><option>2.0</option><option selected>3.0</option></select></td></tr>
            <tr><td>综合工时调休假时长</td><td><select class="form-select"><option>结算</option><option selected>不结算</option></select></td><td>—</td></tr>
          </tbody></table></div>
          <div class="sentence-row comp-auto-time">考勤周期结束后第 <input class="form-input small" value="3"> 天 <input class="form-input small" value="09:00">（北京时间）开始自动生成结算</div>
        </div>
        <div class="section-result"><b>关闭后的含义：</b>调休额度到期后直接失效，不向考勤结算明细输出加班费时长。</div>
      </div>
    </section>
    </div>

    <div class="quota-step-pane" data-quota-pane="settle">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">离职结算 <span class="hint" data-tip="决定离职时剩余调休额度直接失效，还是按加班来源折算为加班费时长。">?</span></div><div class="annual-config-desc">设置员工离职时剩余调休额度如何处理。</div></div>
      <div class="annual-config-body">
        <div class="form-label"><span class="required">*</span>员工离职时</div>
        <div class="oehr-radio-line">
          <label class="oehr-radio-option"><input type="radio" name="compLeaveSettlementType" value="none" checked>不结算，剩余调休余额失效</label>
          <label class="oehr-radio-option"><input type="radio" name="compLeaveSettlementType" value="pay">按加班来源折算为加班费时长</label>
        </div>
        <div class="comp-settlement-details" id="compLeaveSettlementDetails" hidden>
          <div class="table-wrap"><table class="comp-source-table"><thead><tr><th>调休来源</th><th>是否结算</th><th>加班倍数</th></tr></thead><tbody>
            <tr><td>工作日调休假时长</td><td><select class="form-select"><option selected>结算</option><option>不结算</option></select></td><td><select class="form-select"><option selected>1.5</option><option>2.0</option><option>3.0</option></select></td></tr>
            <tr><td>公休日调休假时长</td><td><select class="form-select"><option selected>结算</option><option>不结算</option></select></td><td><select class="form-select"><option>1.5</option><option selected>2.0</option><option>3.0</option></select></td></tr>
            <tr><td>节假日调休假时长</td><td><select class="form-select"><option selected>结算</option><option>不结算</option></select></td><td><select class="form-select"><option>1.5</option><option>2.0</option><option selected>3.0</option></select></td></tr>
            <tr><td>综合工时调休假时长</td><td><select class="form-select"><option>结算</option><option selected>不结算</option></select></td><td>—</td></tr>
          </tbody></table></div>
        </div>
        <div class="section-result" id="compLeaveSettlementResult"><b>当前配置：</b>员工离职时，未使用的调休余额直接失效，不生成加班费结算时长。</div>
      </div>
    </section>
    </div>

  </div>
</div>`;}

function toggleCompSection(button,target){if(!button||!target){return;}var on=button.classList.toggle("on");button.setAttribute("aria-pressed",String(on));target.hidden=!on;}
function bindQuotaConfigTabs(panel){
  var framework=panel&&panel.querySelector(".annual-framework");
  if(!framework){return;}
  framework.querySelectorAll(".annual-step[data-quota-step]").forEach(function(step){
    step.onclick=function(){
      var key=step.dataset.quotaStep;
      framework.querySelectorAll(".annual-step[data-quota-step]").forEach(function(item){item.classList.toggle("active",item===step);});
      framework.querySelectorAll(".quota-step-pane").forEach(function(pane){pane.classList.toggle("active",pane.dataset.quotaPane===key);});
    };
  });
}
function bindCompConfigPage(panel){
  bindQuotaConfigTabs(panel);
  var sourceHelp=document.getElementById("compSourceRuleHelp");if(sourceHelp){var openSourceHelp=function(){openAnnualHelpDrawer("加班补偿方式与调休额度的关系",compSourceRuleHelpHtml());};sourceHelp.onclick=openSourceHelp;sourceHelp.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openSourceHelp();}};}
  document.querySelectorAll('input[name="compExpiryType"]').forEach(function(radio){radio.onchange=function(){document.querySelectorAll(".comp-radio-row").forEach(function(row){var active=row.contains(radio);if(active){row.classList.add("active");}else{row.classList.remove("active");}row.querySelectorAll("input:not([type=radio]),select").forEach(function(control){control.disabled=!active;});});};});
  var delay=document.getElementById("compAutoDelay"),delayFields=document.getElementById("compDelayFields");
  if(delay&&delayFields){delay.onclick=function(){var on=delay.classList.toggle("on");delay.setAttribute("aria-pressed",String(on));delayFields.querySelectorAll("input,select").forEach(function(control){control.disabled=!on;});};}
  var expiry=document.getElementById("compExpirySettlement"),expiryDetails=document.getElementById("compExpirySettlementDetails");
  if(expiry){expiry.onclick=function(){toggleCompSection(expiry,expiryDetails);};}
  var leaveDetails=document.getElementById("compLeaveSettlementDetails"),leaveResult=document.getElementById("compLeaveSettlementResult");
  document.querySelectorAll('input[name="compLeaveSettlementType"]').forEach(function(radio){radio.onchange=function(){var settle=radio.value==="pay";if(leaveDetails){leaveDetails.hidden=!settle;}if(leaveResult){leaveResult.innerHTML=settle?"<b>当前配置：</b>员工离职时，按各加班来源和倍数生成加班费结算时长；工资金额由薪酬处理。":"<b>当前配置：</b>员工离职时，未使用的调休余额直接失效，不生成加班费结算时长。";}};});
}

function annualCrossTierHelpHtml(){return `
  <div class="notice">本字段只在“是否含标准额度＝是”、额度按司龄或工龄匹配，并且员工在计算年度内跨越额度档位时生效。</div>
  <div class="table-wrap"><table class="cross-tier-guide"><thead><tr><th>选项</th><th>系统实际含义</th><th>2026-08-15跨10年示例</th></tr></thead><tbody>
    <tr><td>不折算，按跨阶前的工龄（工龄起算日）发放</td><td>跨档所在月份仍按原档计算，从下月起切换新档。</td><td>1—8月按5天档；9—12月按10天档。</td></tr>
    <tr><td>不折算，按跨阶后的工龄（工龄起算日）发放</td><td>跨档所在月份整月按新档计算。</td><td>1—7月按5天档；8—12月按10天档。</td></tr>
    <tr><td>按比例折算</td><td>以实际跨档日为边界，精确拆成原档、新档两个日历区间。</td><td>1月1日—8月14日按5天档；8月15日—12月31日按10天档。</td></tr>
    <tr><td>不涉及</td><td>不拆分跨档区间，整段按计算周期末所处档位匹配。</td><td>年末计算时可能整段按10天档，不适合集团规则。</td></tr>
  </tbody></table></div>
  <div class="section-result">“不折算”不是“不处理跨档”，而是“不按跨档日精确拆分”，改在计算周期边界切换档位。</div>
  <span class="recommended-choice">集团规则：按比例折算</span>`;}

function annualCycleHelpHtml(){return `
  <div class="notice"><b>这组字段决定：</b>一笔年假额度按什么日期范围计算、记在哪个年度，以及何时到期。它不决定每天还是每月发放。</div>
  <div class="table-wrap"><table class="field-definition-table"><thead><tr><th>字段</th><th>系统实际含义</th><th>当前配置的含义</th></tr></thead><tbody>
    <tr><td>年假周期</td><td>确定额度的完整计算周期。自然年为1月1日至12月31日；自定义周期可按入职日期、工龄起算日或指定日期形成跨年周期。</td><td><b>自然年：</b>集团年假统一按每个公历年度计算。</td></tr>
    <tr><td>归属年度</td><td>决定跨年周期生成的余额记录记在周期开始年度还是周期结束年度。自然年开始、结束在同一年，两个选项结果相同；自定义周期时才有实质差异。</td><td><b>周期开始日期所在年度：</b>额度记入周期开始的年份。</td></tr>
    <tr><td>有效期</td><td>决定当年度生成额度的失效日期。可在年假周期结束后失效，或设置当年/次年的固定日期；失效日当天仍有效，超过该日期后失效。</td><td><b>次年12月31日后失效：</b>当年度年假可使用至下一年12月31日。</td></tr>
  </tbody></table></div>
  <div class="section-result"><b>当前结果：</b>年假按自然年计算，额度归入周期开始年度，并在次年12月31日后失效。</div>`;}

function annualDistributionHelpHtml(){return `
  <div class="notice"><b>这组字段决定：</b>系统在什么时间点把公式计算到哪里。“预发”不是一次性提前发完全年额度；哪些员工参加计算由“哪些员工可以获得年假额度”控制。</div>
  <div class="table-wrap"><table class="field-definition-table"><thead><tr><th>字段</th><th>系统实际含义</th><th>当前配置的含义</th></tr></thead><tbody>
    <tr><td>发放方式</td><td>控制发放日对应计算区间是否包含尚未结束的当前单位。每日发放时，预发计算至当天，实发只计算至昨天；每月、每年时也按同样思路区分当前期和已结束期。</td><td><b>预发：</b>配合每日发放，余额每天累计到当天。</td></tr>
    <tr><td>发放时间</td><td>先决定入职当年/月是否使用不同发放安排，再选择每日、每月、每年、每考勤周期或每入职日期等触发频率。</td><td><b>不区分＋每日：</b>入职当年和以后年度使用同一套每日发放安排。</td></tr>
  </tbody></table></div>
  <div class="section-result"><b>当前结果：</b>额度每日预发，计算范围累计到当天。</div>`;}

function annualCalculationHelpHtml(){return `
  <div class="notice"><b>这组字段决定：</b>公式从哪一档取标准额度、跨档怎样拆段、公式按多大的区间执行，以及最终结果怎样取数。</div>
  <div class="table-wrap"><table class="field-definition-table"><thead><tr><th>字段</th><th>系统实际含义</th><th>当前配置的含义</th></tr></thead><tbody>
    <tr><td>是否含标准额度</td><td>选择“是”后，系统把标准额度阶梯传给公式，公式可使用“取标准额度()”，并启用司龄/工龄匹配和跨档拆分；选择“否”则完全由公式自行计算。</td><td><b>是：</b>公式从下方40/80/120小时阶梯取值。</td></tr>
    <tr><td>额度匹配模式</td><td>决定用什么指标匹配标准额度阶梯：司龄使用入职日期，工龄使用工龄起算日，出勤时长读取当前计算区间的实际出勤小时。</td><td><b>工龄：</b>用参加工作日期对应的工龄起算日判断5天、10天、15天档。</td></tr>
    <tr><td>是否管控标准额度上限</td><td>选择“是”时，在自然年、含标准额度、按比例折算且按司龄/工龄匹配的条件下，系统会把各分段生成结果限制在对应标准额度内；选择“否”则不增加这层封顶。</td><td><b>否：</b>额度结果以公式计算值为准，不再做标准额度上限截断。</td></tr>
    <tr><td>额度跨阶折算方式</td><td>员工在计算年度跨越阶梯时，决定按月边界切档、按跨档日比例拆分，或不处理该场景。</td><td><b>按比例折算：</b>以满10年/20年的实际日期拆成前后两段。</td></tr>
    <tr><td>计算规则</td><td>对每个实际计算区间执行的额度公式。区间可能先被计算精度和跨档规则拆分，系统分别执行公式后再合计。</td><td>标准额度 × 自然年实际在职天数 ÷ 自然年总天数。</td></tr>
    <tr><td>计算精度</td><td>决定公式执行前的基础拆段粒度：年＝一个年度区间，月＝按自然月拆分，考勤周期＝按考勤周期拆分。它不等于发放频率。</td><td><b>年：</b>普通情况按年度区间计算；跨档时仍会进一步按跨档日拆分。</td></tr>
    <tr><td>进位方式＋小数位数</td><td>公式各分段结果合计后再处理精度。四舍五入按小数位数保留；向上/向下取整在代码中按取整基数处理。</td><td><b>四舍五入、两位：</b>最终生成额度保留2位小数。</td></tr>
    <tr><td>标准额度阶梯设置</td><td>按“开始值＜匹配值≤结束值”找到标准额度；可附加不享有条件。命中额度供“取标准额度()”读取。</td><td>0＜工龄≤9.99年为40小时；9.99＜工龄≤19.99年为80小时；19.99＜工龄≤999年为120小时。</td></tr>
  </tbody></table></div>
  <div class="section-result"><b>当前结果：</b>按工龄档位取标准额度，跨档时按实际日期分段折算，最终保留2位小数。</div>`;}

function annualFormulaHelpHtml(){return `
  <div class="notice"><b>集团结论：</b>额度跨阶折算方式选择“按比例折算”；普通年假每日发放使用“实际在职天数”公式。</div>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">公式调整</div><div class="annual-drawer-section-body">
    <div class="summary-box"><b>当前公式</b><div class="annual-formula-code" style="margin-top:8px">取标准额度() × 取自然年在职天数(入职日期) ÷ 取自然年总天数()</div></div>
    <div class="summary-box"><b>应改为</b><div class="annual-formula-code" style="margin-top:8px">取标准额度() × 取自然年实际在职天数(入职日期) ÷ 取自然年总天数()</div></div>
    <div class="table-wrap"><table class="cross-tier-guide"><thead><tr><th>函数</th><th>取数范围</th><th>使用场景</th></tr></thead><tbody>
      <tr><td>取自然年在职天数</td><td>从入职日期计算到当年12月31日，属于预计全年口径。</td><td>不用于普通每日累计；仅用于跨年度转正后回算入职年度。</td></tr>
      <tr><td>取自然年实际在职天数</td><td>按本次实际计算区间的开始、结束日期取数，每日计算时只累计至当天。</td><td>普通每日发放，以及跨档后的分段折算。</td></tr>
    </tbody></table></div>
  </div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">集团跨10年示例</div><div class="annual-drawer-section-body">
    <div class="test-result"><div class="trace-row"><span class="trace-label">跨档日期</span><span class="trace-value">2026-08-15累计工龄满10年</span></div><div class="trace-row"><span class="trace-label">跨档前</span><span class="trace-value">1月1日—8月14日，共226天，按5天档</span></div><div class="trace-row"><span class="trace-label">跨档后</span><span class="trace-value">8月15日—12月31日，共139天，按10天档</span></div><div class="trace-row"><span class="trace-label">分段折算</span><span class="trace-value">(226 ÷ 365) × 5 ＋ (139 ÷ 365) × 10</span></div><div class="trace-row"><span class="trace-label">年度结果</span><span class="trace-value"><b>约6.90天（55.23小时）</b></span></div></div>
    <div class="section-result">普通年度和跨档年度保留2位小数，不按整天向下取整。入职日期用于限定实际在职区间；工龄起算日用于判断5天、10天、15天档位及跨档日期。</div>
  </div></section>`;}

function annualFormulaDrawerHtml(){return `
  <div class="notice">公式配置用于普通年假每日发放；选择“按比例折算”后，工龄跨档年度由系统按跨档日拆分原档、新档区间。</div>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">普通年度公式</div><div class="annual-drawer-section-body"><textarea class="formula-editor" id="annualFormulaText">取标准额度() × 取自然年实际在职天数(入职日期) ÷ 取自然年总天数()</textarea><div class="formula-check-row"><button type="button" class="btn formula-check">检查公式</button><button type="button" class="btn formula-test">规则试算</button><span class="formula-check-status">未检查</span></div><div class="formula-test-panel" data-editor="annualFormulaText"></div><div class="annual-formula-meta"><span>返回值：截至计算日累计应得额度（小时）</span></div><div class="section-result"><b>为什么使用“实际在职天数”：</b>预发＋每日的计算周期截止到当天；跨档时系统还会把周期按跨档日拆段。该函数会按每个实际计算区间取数，普通年度不会提前计入未来日期，跨档年度也不会重复计算全年天数。</div></div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">跨档当年展开规则</div><div class="annual-drawer-section-body"><div class="annual-formula-code">原档标准额度 × 跨档前实际在职日历天数 ÷ 当年总日历天数<br>＋ 新档标准额度 × 跨档日起实际在职日历天数 ÷ 当年总日历天数</div><div class="test-result"><div class="test-title">集团样例</div><div class="trace-row"><span class="trace-label">累计工龄满10年</span><span class="trace-value">2026-08-15</span></div><div class="trace-row"><span class="trace-label">分段折算</span><span class="trace-value">(226 ÷ 365) × 5天 ＋ (139 ÷ 365) × 10天</span></div><div class="trace-row"><span class="trace-label">年度结果</span><span class="trace-value"><b>约6.90天（55.23小时），保留小数，不按整天向下取整</b></span></div></div></div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">结果处理</div><div class="annual-drawer-section-body">${businessFieldsHtml([{label:"进位方式",value:"四舍五入",options:["四舍五入","向上取整","向下取整"],required:true},{label:"保留小数位",value:"2位",options:["0位","1位","2位","4位"],required:true}])}<div class="section-result">普通年度和跨档年度均保留折算小数。跨年度转正补发仍使用其独立的整天取整规则。</div></div></section>`;}

function crossYearDrawerHtml(){return `
  <div class="notice"><b>业务场景：</b>员工入职当年处于试用期，跨年后转正并符合年假发放条件时，系统补发其入职年度应得的年假。</div>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">1. 为什么归在年假生成</div><div class="annual-drawer-section-body">
    <div class="readonly-rule-grid">
      <div class="readonly-rule-item full"><div class="readonly-rule-label">补发规则负责什么</div><div class="readonly-rule-value">判断员工是否应获得入职年度年假，计算应补发多少、记在哪一年，并生成一笔新的年假额度。</div></div>
      <div class="readonly-rule-item full"><div class="readonly-rule-label">结转规则负责什么</div><div class="readonly-rule-value">只处理已经生成的年假额度，决定是否转入下一周期、转入后何时失效以及使用顺序，不重新判断员工应得多少。</div></div>
      <div class="readonly-rule-item full"><div class="readonly-rule-label">两者怎么衔接</div><div class="readonly-rule-value">先由补发规则生成入职年度额度，再调用年假结转规则把该笔额度转到员工符合年假发放条件的年度。没有先生成的额度，结转规则就没有可以转移的余额。</div></div>
    </div>
    <div class="section-result"><b>例：</b>员工2025年入职，2026年首次符合年假发放条件。系统先补发2天并记在2025年度，再将这2天按结转规则转入2026年度。</div>
  </div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">2. 什么时候补发</div><div class="annual-drawer-section-body">
    <div class="readonly-rule-grid">
      <div class="readonly-rule-item full"><div class="readonly-rule-label">补发时间</div><div class="readonly-rule-value">员工转正后，首次符合“哪些员工可以获得年假额度”的全部条件时补发。</div></div>
      <div class="readonly-rule-item"><div class="readonly-rule-label">哪些情况需要补发</div><div class="readonly-rule-value">符合年假发放条件的年度晚于入职年度。</div></div>
      <div class="readonly-rule-item"><div class="readonly-rule-label">是否会重复补发</div><div class="readonly-rule-value">同一入职年度只补发一次。</div></div>
    </div>
    <div class="section-result">例如员工转正时连续工作尚未满12个月，系统暂不补发；满12个月并符合全部年假发放条件后，再自动补发。</div>
  </div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">3. 补发哪一段年假</div><div class="annual-drawer-section-body">
    <div class="readonly-rule-grid">
      <div class="readonly-rule-item"><div class="readonly-rule-label">计算哪段时间</div><div class="readonly-rule-value">入职日期至入职年度12月31日。</div></div>
      <div class="readonly-rule-item"><div class="readonly-rule-label">记在哪一年</div><div class="readonly-rule-value">记在员工入职年度。</div></div>
      <div class="readonly-rule-item full"><div class="readonly-rule-label">计算方法</div><div class="readonly-rule-value">入职当年的标准年假 × 这段时间的在职日历天数 ÷ 入职当年的总日历天数。</div></div>
      <div class="readonly-rule-item full"><div class="readonly-rule-label">使用哪套年假标准</div><div class="readonly-rule-value">使用入职年度对应的标准额度、工龄档位和跨档规则；只对这次补发结果按整天向下取整，不改变普通年假的日常发放方式。</div></div>
    </div>
  </div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">4. 补发结果怎么处理</div><div class="annual-drawer-section-body">
    <div class="readonly-rule-grid">
      <div class="readonly-rule-item"><div class="readonly-rule-label">结果取整</div><div class="readonly-rule-value">各段折算结果合计后，按整天向下取整。</div></div>
      <div class="readonly-rule-item"><div class="readonly-rule-label">不足1天</div><div class="readonly-rule-value">不补发年假。</div></div>
      <div class="readonly-rule-item full"><div class="readonly-rule-label">达到1天及以上</div><div class="readonly-rule-value">生成一笔入职年度的补发年假，再按年假结转规则转到员工符合年假发放条件的年度。</div></div>
    </div>
    <div class="rule-dependency-check"><b>当前配置可用：</b>年假已设置“余额转下期”，补发额度可以转到员工符合条件的年度。若关闭年假结转，需要先停用本规则才能保存方案。</div>
  </div></section>
  <section class="annual-drawer-section"><div class="annual-drawer-section-title">规则试算</div><div class="annual-drawer-section-body"><div class="trial-box">
    ${businessFieldsHtml([{label:"入职日期",value:"2025-07-01",id:"crossEntryDate",type:"date"},{label:"符合年假发放条件的日期",value:"2026-01-01",id:"crossEligibilityDate",type:"date"},{label:"当年标准年假（试算输入）",value:"5",id:"crossStandardDays",type:"number",suffix:"天"}])}
    <div class="trial-equation" id="crossEquation">5 × 184 ÷ 365 = 2.52天</div>
    <div class="trial-result" id="crossResult">向下取整后补发2天（16小时），记在2025年度并转入2026年度。</div>
  </div></div></section>`;}

function openAnnualDrawer(title,body,context){var drawer=document.getElementById("drawer"),confirm=document.getElementById("confirmRules");drawer.classList.remove("narrow","option-guide","help-mode");drawer.dataset.context=context||"annual";document.getElementById("drawerTitle").textContent=title;document.getElementById("drawerBody").innerHTML=body;confirm.textContent="保存配置";document.getElementById("drawerMask").classList.add("show");bindFormulaEditors();}
function openAnnualHelpDrawer(title,body){openAnnualDrawer(title,body,"guide");var drawer=document.getElementById("drawer");drawer.classList.add("option-guide","help-mode");document.getElementById("confirmRules").textContent="知道了";}
function calculateCrossYearTrial(){var dateInput=document.getElementById("crossEntryDate"),eligibilityInput=document.getElementById("crossEligibilityDate"),daysInput=document.getElementById("crossStandardDays");if(!dateInput||!dateInput.value||!eligibilityInput||!eligibilityInput.value){return;}var start=new Date(dateInput.value+"T00:00:00"),eligibility=new Date(eligibilityInput.value+"T00:00:00"),year=start.getFullYear(),eligibilityYear=eligibility.getFullYear(),end=new Date(year+"-12-31T00:00:00"),yearStart=new Date(year+"-01-01T00:00:00"),active=Math.floor((end-start)/86400000)+1,total=Math.floor((end-yearStart)/86400000)+1,standard=Number(daysInput.value||0),raw=standard*active/total,granted=Math.floor(raw);if(eligibilityYear<=year){document.getElementById("crossEquation").textContent="符合年假发放条件的年度与入职年度相同";document.getElementById("crossResult").textContent="不属于跨年度补发，不生成补发年假。";return;}document.getElementById("crossEquation").textContent=standard+" × "+active+" ÷ "+total+" = "+raw.toFixed(2)+"天";document.getElementById("crossResult").textContent=granted<1?"向下取整后为0天：不补发年假。":"向下取整后补发"+granted+"天（"+(granted*8)+"小时），记在"+year+"年度并转入"+eligibilityYear+"年度。";}
function bindAnnualSettlementInteractions(){
  var expiryRadios=document.querySelectorAll('input[name="expirySettle"]'),leaveRadios=document.querySelectorAll('input[name="leaveSettle"]'),panel=document.getElementById("annualExpiryConditionPanel"),operator=document.getElementById("annualExpiryOperator"),threshold=document.getElementById("annualExpiryThreshold"),expiryResult=document.getElementById("annualExpirySettlementResult"),leaveResult=document.getElementById("annualLeaveSettlementResult");
  function selectedValue(nodes,fallback){var checked=Array.from(nodes).find(function(node){return node.checked;});return checked?checked.value:fallback;}
  function refreshExpiry(){
    var mode=selectedValue(expiryRadios,""),value=threshold&&threshold.value!==""?threshold.value:"—",relation=operator?operator.value:"小于";
    if(panel){panel.style.display=mode==="conditional"?"flex":"none";}
    if(!expiryResult){return;}
    if(!mode){expiryResult.textContent="当前规则：尚未配置过期结算方式。";}
    else if(mode==="none"){expiryResult.textContent="当前规则：年假额度到期后不结算。";}
    else if(mode==="all"){expiryResult.textContent="当前规则：年假额度到期后全部结算。";}
    else{expiryResult.textContent="当前规则：总失效额度"+relation+value+"小时不结算，其余全部结算。";}
  }
  function refreshLeave(){if(!leaveResult){return;}var mode=selectedValue(leaveRadios,"");leaveResult.textContent=!mode?"当前规则：尚未配置离职结算方式。":mode==="all"?"当前规则：员工离职时，剩余年假额度全部结算。":"当前规则：员工离职时，剩余年假额度不结算。";}
  expiryRadios.forEach(function(node){node.onchange=refreshExpiry;});
  leaveRadios.forEach(function(node){node.onchange=refreshLeave;});
  if(operator){operator.onchange=refreshExpiry;}
  if(threshold){threshold.oninput=refreshExpiry;}
  refreshExpiry();
  refreshLeave();
}
function bindAnnualConfigPage(){
  document.querySelectorAll(".annual-step").forEach(function(step){step.onclick=function(){var key=step.dataset.annualStep;document.querySelectorAll(".annual-step").forEach(function(x){x.classList.toggle("active",x===step);});document.querySelectorAll(".annual-step-pane").forEach(function(x){x.classList.toggle("active",x.dataset.annualPane===key);});};});
  document.querySelectorAll(".annual-mode[data-annual-mode]").forEach(function(button){button.onclick=function(){var mode=button.dataset.annualMode;document.querySelectorAll(".annual-mode[data-annual-mode]").forEach(function(x){x.classList.toggle("active",x===button);});document.querySelectorAll(".annual-config-mode-panel").forEach(function(panel){panel.classList.toggle("active",panel.dataset.annualModePanel===mode);});};});
  var eligibilityToggle=document.getElementById("annualEligibilityEnabled"),eligibilityBody=document.getElementById("annualEligibilityConditionBody"),eligibilityResult=document.getElementById("annualEligibilityResult");
  function syncAnnualEligibility(){
    if(!eligibilityToggle||!eligibilityBody){return;}
    eligibilityToggle.classList.toggle("on",annualEligibilityEnabled);
    eligibilityToggle.setAttribute("aria-pressed",String(annualEligibilityEnabled));
    eligibilityBody.style.display=annualEligibilityEnabled?"block":"none";
    if(eligibilityResult){eligibilityResult.innerHTML=annualEligibilityEnabled?"<b>当前结果：</b>仅符合下方条件的员工可以获得年假额度。":"<b>当前结果：</b>未设置额外条件；方案适用范围内员工均可参加年假额度计算。";}
  }
  if(eligibilityToggle){eligibilityToggle.onclick=function(){
    if(annualEligibilityEnabled){
      var list=document.querySelector(".annual-eligibility-condition-list"),hasConditions=list&&list.querySelectorAll(".structured-condition-row").length;
      if(hasConditions&&!window.confirm("关闭后将清空已配置的额度获得条件，是否继续？")){return;}
      if(list&&hasConditions){list.querySelectorAll(".structured-condition-row").forEach(function(row){row.remove();});syncConditionSetState(list);bindConditionRows();}
    }
    annualEligibilityEnabled=!annualEligibilityEnabled;syncAnnualEligibility();planFormDirty=true;
  };}
  syncAnnualEligibility();
  var save=document.getElementById("saveAnnualConfig");if(save){save.onclick=function(){showToast("年假配置已保存");};}
  var sectionHelpConfigs=[["annualCycleHelp","发放周期字段释义",annualCycleHelpHtml],["annualDistributionHelp","发放规则字段释义",annualDistributionHelpHtml],["annualCalculationHelp","额度计算字段释义",annualCalculationHelpHtml]];
  sectionHelpConfigs.forEach(function(item){var trigger=document.getElementById(item[0]);if(trigger){trigger.onclick=function(e){e.preventDefault();e.stopPropagation();openAnnualHelpDrawer(item[1],item[2]());};}});
  var crossTierHelp=document.getElementById("annualCrossTierHelp");if(crossTierHelp){crossTierHelp.onclick=function(e){e.preventDefault();e.stopPropagation();openAnnualHelpDrawer("额度跨阶折算方式说明",annualCrossTierHelpHtml());};}
  var formulaHelp=document.getElementById("annualFormulaHelp");if(formulaHelp){formulaHelp.onclick=function(e){e.preventDefault();e.stopPropagation();openAnnualHelpDrawer("年假计算公式说明",annualFormulaHelpHtml());};}
  var formula=document.getElementById("editAnnualFormula");if(formula){formula.onclick=function(){openAnnualDrawer("编辑年假发放公式",annualFormulaDrawerHtml(),"annual-formula");};}
  var guide=document.getElementById("annualGrantGuide");if(guide){guide.onclick=function(){openAnnualDrawer("年假生成规则说明",'<div class="summary-box"><b>普通发放</b><br>正式员工按自然年、工龄档位和实际在职天数每日累计发放，结果保留2位小数。</div><div class="summary-box"><b>跨年度转正补发</b><br>次年转正生效时按全年剩余口径回算入职年度；跨档先按比例折算，合计后按整天向下取整，再复用结转规则。</div>',"annual-guide");};}
  var crossToggle=document.getElementById("crossYearListToggle");if(crossToggle){crossToggle.onclick=function(){crossYearRuleEnabled=crossToggle.classList.toggle("on");crossToggle.setAttribute("aria-pressed",String(crossYearRuleEnabled));var text=document.getElementById("crossYearListToggleText");if(text){text.textContent=crossYearRuleEnabled?"启用":"停用";}showToast(crossYearRuleEnabled?"跨年度转正补发已启用":"跨年度转正补发已停用");};}
  var cross=document.getElementById("configureCrossYear");if(cross){cross.onclick=function(){openAnnualHelpDrawer("跨年度转正补发规则说明",crossYearDrawerHtml());calculateCrossYearTrial();var date=document.getElementById("crossEntryDate"),eligibility=document.getElementById("crossEligibilityDate"),days=document.getElementById("crossStandardDays");if(date){date.onchange=calculateCrossYearTrial;}if(eligibility){eligibility.onchange=calculateCrossYearTrial;}if(days){days.oninput=calculateCrossYearTrial;}};}
  bindAnnualSettlementInteractions();
}
function normalizeAnnualInformationArchitecture(panel){
  var grant=panel.querySelector('[data-annual-pane="grant"]');
  if(!grant){return;}
  var titles=Array.from(grant.querySelectorAll(":scope > .annual-generation-group-title")),configSection=grant.querySelector(":scope > .annual-config-section"),eligibilitySection=titles[0]&&titles[0].nextElementSibling;
  if(!configSection||!eligibilitySection||!titles[1]){return;}
  var configTitle=configSection.querySelector(".annual-config-title");
  if(configTitle){configTitle.textContent="年假额度计算方式";}
  var configHead=configSection.querySelector(".annual-config-head");
  if(configHead&&!configHead.querySelector(".annual-config-desc")){configHead.insertAdjacentHTML("beforeend",'<div class="annual-config-desc">只决定年假额度怎样计算；上方额度生成资格始终使用结构化条件。</div>');}
  grant.insertBefore(configSection,titles[1]);
  titles[1].lastChild.textContent="额度计算与发放";
}
function sickQuotaPageHtml(){return `
<div class="annual-framework">
  <div class="annual-steps" role="tablist">
    <button class="annual-step active" data-quota-step="grant"><span class="annual-step-no">1</span>病假生成规则</button>
    <button class="annual-step" data-quota-step="validity"><span class="annual-step-no">2</span>病假有效期规则</button>
    <button class="annual-step" data-quota-step="settle"><span class="annual-step-no">3</span>病假结算规则</button>
  </div>
  <div id="sickQuotaBody" data-quota-config-body>
    <div class="quota-step-pane active" data-quota-pane="grant">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">额度生成规则</div><div class="annual-config-desc">设置病假额度采用固定值、考勤结果、公式还是导入方式生成。</div></div>
      <div class="annual-config-body">
        <div class="form-label"><span class="required">*</span>计算规则</div>
        <div class="sick-option-list" id="sickCalculationOptions">
          <label class="sick-option active"><input type="radio" name="sickCalculation" value="fixed" checked>固定额度</label>
          <label class="sick-option"><input type="radio" name="sickCalculation" value="attendance">按考勤项目统计结果折算（比如：每日总工时）</label>
          <label class="sick-option"><input type="radio" name="sickCalculation" value="formula">自定义公式计算</label>
          <label class="sick-option"><input type="radio" name="sickCalculation" value="import">手动导入</label>
        </div>
        <div class="sick-dependent" data-sick-calculation-panel="fixed">${businessFieldsHtml([{label:"固定额度",value:"80",type:"number",suffix:"小时",required:true}])}</div>
        <div class="sick-dependent" data-sick-calculation-panel="attendance" style="display:none">${businessFieldsHtml([{label:"考勤项目",value:"每日总工时",options:["每日总工时","实际出勤时长"],required:true},{label:"折算比例",value:"1",type:"number",required:true}])}</div>
        <div class="sick-dependent" data-sick-calculation-panel="formula" style="display:none"><div class="oehr-formula-row"><div class="annual-formula-code">按员工档案和考勤结果计算病假额度</div><button type="button" class="btn">设置公式</button></div></div>
        <div class="sick-dependent" data-sick-calculation-panel="import" style="display:none"><div class="field-note">额度通过病假额度导入功能维护，本页不再计算。</div></div>
      </div>
    </section>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">额度使用规则</div></div>
      <div class="annual-config-body">${businessFieldsHtml([{label:"余额扣减顺序",value:"按余额有效期顺序，先失效的先扣减；有效期相同时，优先扣减较早年度额度",options:["按余额有效期顺序，先失效的先扣减；有效期相同时，优先扣减较早年度额度"],required:true}])}<div class="section-result" id="sickGrantResult"><b>当前结果：</b>每名符合条件的员工生成80小时病假额度；申请时优先使用较早失效的余额。</div></div>
    </section>
    </div>

    <div class="quota-step-pane" data-quota-pane="validity">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">余额有效期</div><div class="annual-config-desc">设置每笔病假额度何时失效或是否长期有效。</div></div>
      <div class="annual-config-body">
        <div class="form-label comp-field-title"><span class="required">*</span>余额有效期</div>
        <div class="sick-option-list" id="sickValidityOptions">
          <label class="sick-option active"><input type="radio" name="sickValidity" value="fixed" checked>固定日期失效</label>
          <label class="sick-option"><input type="radio" name="sickValidity" value="entry">次年入职日期失效</label>
          <label class="sick-option"><input type="radio" name="sickValidity" value="cap">按余额累积上限失效</label>
          <label class="sick-option"><input type="radio" name="sickValidity" value="forever">永久有效</label>
        </div>
        <div class="sick-dependent" data-sick-validity-panel="fixed">${businessFieldsHtml([{label:"固定日期",value:"当年12月31日",options:["当年12月31日","次年12月31日"],required:true}])}</div>
        <div class="sick-dependent" data-sick-validity-panel="entry" style="display:none"><div class="field-note">每笔额度在次年对应入职日期失效。</div></div>
        <div class="sick-dependent" data-sick-validity-panel="cap" style="display:none">${businessFieldsHtml([{label:"余额累积上限",value:"160",type:"number",suffix:"小时",required:true}])}</div>
        <div class="sick-dependent" data-sick-validity-panel="forever" style="display:none"><div class="field-note">额度不设置失效日期。</div></div>
        <div class="section-result" id="sickValidityResult"><b>当前结果：</b>本年度生成的病假额度于当年12月31日后失效。</div>
      </div>
    </section>
    </div>

    <div class="quota-step-pane" data-quota-pane="settle">
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">病假额度结算</div></div>
      <div class="annual-config-body"><div class="section-result"><b>当前结果：</b>病假额度继续用于病假工资计算。</div></div>
    </section>
    <section class="annual-config-section">
      <div class="annual-config-head"><div class="annual-config-title">离职结算</div></div>
      <div class="annual-config-body"><div class="sick-option-list"><label class="sick-option active"><input type="radio" name="sickLeaving" value="clear" checked>余额清零</label><label class="sick-option"><input type="radio" name="sickLeaving" value="prorate">按入职天数结算</label></div><div class="section-result" id="sickLeavingResult"><b>当前结果：</b>员工离职时，未使用的病假余额清零。</div></div>
    </section>
    </div>
  </div>
</div>`;}
function bindSickConfigPage(panel){bindQuotaConfigTabs(panel);function updateSickResult(groupName,value){var grant=document.getElementById("sickGrantResult"),validity=document.getElementById("sickValidityResult"),leaving=document.getElementById("sickLeavingResult");if(groupName==="sickCalculation"&&grant){var text={fixed:"每名符合条件的员工生成80小时病假额度",attendance:"病假额度按所选考勤项目统计结果折算",formula:"病假额度按已配置公式计算",import:"病假额度通过导入结果维护"}[value];grant.innerHTML="<b>当前结果：</b>"+text+"；申请时优先使用较早失效的余额。";}if(groupName==="sickValidity"&&validity){var validityText={fixed:"本年度生成的病假额度于当年12月31日后失效。",entry:"每笔病假额度于次年对应入职日期后失效。",cap:"病假余额最多累计160小时，超出部分按规则处理。",forever:"病假额度长期有效，不设置失效日期。"}[value];validity.innerHTML="<b>当前结果：</b>"+validityText;}if(groupName==="sickLeaving"&&leaving){leaving.innerHTML=value==="prorate"?"<b>当前结果：</b>员工离职时，剩余病假额度按入职天数折算。":"<b>当前结果：</b>员工离职时，未使用的病假余额清零。";}}
  function bindOptions(groupName,panelAttribute){document.querySelectorAll('input[name="'+groupName+'"]').forEach(function(input){input.onchange=function(){document.querySelectorAll('input[name="'+groupName+'"]').forEach(function(x){x.closest(".sick-option").classList.toggle("active",x.checked);});document.querySelectorAll("["+panelAttribute+"]").forEach(function(panel){panel.style.display=panel.getAttribute(panelAttribute)===input.value?"block":"none";});updateSickResult(groupName,input.value);};});}bindOptions("sickCalculation","data-sick-calculation-panel");bindOptions("sickValidity","data-sick-validity-panel");document.querySelectorAll('input[name="sickLeaving"]').forEach(function(input){input.onchange=function(){document.querySelectorAll('input[name="sickLeaving"]').forEach(function(x){x.closest(".sick-option").classList.toggle("active",x.checked);});updateSickResult("sickLeaving",input.value);};});}
function quotaConfigControlHtml(key,label){var enabled=quotaConfigEnabled[key]!==false;return '<div class="quota-page-control"><div class="quota-page-control-label"><button type="button" class="switch-toggle'+(enabled?' on':'')+'" id="'+key+'ConfigEnabled" aria-pressed="'+enabled+'"></button><span>启用'+label+'</span></div></div>';}
function bindQuotaConfigControl(panel,key,label){var toggle=document.getElementById(key+"ConfigEnabled"),content=panel.querySelector("[data-quota-config-body]");if(!toggle||!content){return;}content.classList.add("quota-config-content");function sync(){var enabled=quotaConfigEnabled[key]!==false;toggle.classList.toggle("on",enabled);toggle.setAttribute("aria-pressed",String(enabled));content.classList.toggle("config-disabled",!enabled);}toggle.onclick=function(){quotaConfigEnabled[key]=!(quotaConfigEnabled[key]!==false);sync();planFormDirty=true;showToast(label+(quotaConfigEnabled[key]?"已启用":"已停用"));};sync();}
function renderBoundary(key){
  var d=boundary[key],panel=document.getElementById("panel-"+key);
  if(key==="annual"){panel.innerHTML=annualOehrPageHtmlV2();bindAnnualConfigPage();bindConditionRows();return;}
  if(key==="comp"){panel.innerHTML=quotaConfigControlHtml(key,"调休假配置")+compOehrPageHtml();bindQuotaConfigControl(panel,key,"调休假配置");bindCompConfigPage(panel);return;}
  if(key==="sick"){panel.innerHTML=quotaConfigControlHtml(key,"病假配置")+sickQuotaPageHtml();bindQuotaConfigControl(panel,key,"病假配置");bindSickConfigPage(panel);return;}
  panel.innerHTML='<div class="empty-boundary"><div class="boundary-box"><div class="boundary-title">'+d.title+'</div><div class="boundary-text">'+d.text+'</div><div class="chips">'+d.chips.map(function(x){return '<span class="chip">'+x+'</span>';}).join("")+'</div></div></div>';
}
function switchTab(key){document.querySelectorAll(".tab").forEach(function(x){x.classList.toggle("active",x.dataset.tab===key);});document.querySelectorAll(".tab-panel").forEach(function(x){x.classList.toggle("active",x.id==="panel-"+key);});}

function unifiedBaseHtml(leave,isNew){var leaveNames=[leave.name||"请选择","请选择"].concat(leaves.map(function(x){return x.name;}));return businessSectionHtml("1. 基本信息","",businessFieldsHtml([{label:"休假类型",value:leave.name||"请选择",options:leaveNames,id:"leaveTypeSelect",disabled:!isNew,required:true},{label:"计量单位",value:leave.unit||"小时",options:["小时","天"],id:"leaveUnit",required:true,direct:true,tip:"决定最多可休、周期内可休上限、周期内单次上限及按本次申请时长设置的附件判断单位；单次最小、单次最大和日最大时长固定按小时配置。"},{label:"是否带薪",value:leave.paid||"是",options:["是","否"],id:"paidSettingUnified",required:true,direct:true},{label:"余额限制",value:leave.balanceLimit||"否",options:["是","否"],id:"balanceLimit",required:true,direct:true,tip:"是：余额为0或不足时不允许提交；否：余额为0或不足时仍允许提交。本字段不决定是否发放额度，额度是否发放由“按可用额度控制”及对应额度配置决定。"}]));}
function unitLinkageSummaryHtml(unit){return '<div class="unit-linkage-summary" id="unitLinkageSummary">'+(unit==="天"?"员工按天申请；单次最小、单次最大和日最大时长均按小时校验。":"员工按小时申请；单次最小、单次最大和日最大时长均按小时校验。")+'</div>';}
function unifiedCalculationHtml(leave){var unit=leave.unit||"小时",requestTip="用于校验一张休假单汇总后的休假工时。",isDay=unit==="天",dailyTip="同一天最多计入的休假小时数；每日试算结果不得超过该上限。",roundBase=leave.roundBase&&leave.roundBase!=="—"?leave.roundBase:"0.5",roundType=leave.round&&leave.round!=="—"?leave.round:"向上取整";return businessSectionHtml("2. 本次申请时长计算","",businessFieldsHtml([{label:"单次最小时长",value:leave.min||"1",id:"leaveMin",required:true,type:"number",min:"0",suffix:"小时",tip:requestTip},{label:"单次最大时长",value:leave.max||"",id:"leaveMax",type:"number",min:"0",suffix:"小时",tip:requestTip},{label:"时长计算方式",value:leave.calc||"考勤日",options:["考勤日","自然日"],id:"calcType",required:true,direct:true,tip:"考勤日按员工排班计入；自然日连续计入休息日和法定节假日。"},{label:"日最大时长",value:leave.daily||"8",id:"dayMax",required:true,type:"number",min:"0",suffix:"小时",tip:dailyTip}])+unitLinkageSummaryHtml(unit)+'<div id="hourCalculationFields"'+(isDay?' style="display:none"':'')+'>'+businessFieldsHtml([{label:"舍位基数",value:roundBase,id:"roundingBase",required:true,type:"number",min:"0",suffix:"小时",tip:"例如0.5表示试算结果按0.5小时的倍数处理。"},{label:"舍位方式",value:roundType,options:["向上取整","四舍五入","向下取整"],id:"roundingType",required:true,direct:true}])+'</div>');}

function entitlementModeSelectHtml(key,current){var balanceAllowed=["annual","comp","sick"].indexOf(key)>-1,location=key==="annual"?"年假配置":key==="comp"?"调休假配置":key==="sick"?"病假配置":"对应额度配置",tip=balanceAllowed?"选择“按可用额度控制”后，额度生成、有效期、结转和结算在“"+location+"”维护；余额为0或不足时是否阻止提交，由基本信息中的“余额限制”决定。":"当前假别没有独立额度配置，因此不能选择“按可用额度控制”。";return '<div class="entitlement-mode-field"><div class="form-label"><span class="required">*</span>控制方式 <span class="hint" data-tip="'+tip+'">?</span></div><input type="hidden" id="entitlementMode" value="'+current+'"><div class="entitlement-choice-grid">'+entitlementModes.map(function(x){var disabled=x==="按可用余额控制"&&!balanceAllowed;return '<button type="button" class="entitlement-choice '+(x===current?'active ':'')+(disabled?'disabled':'')+'" data-value="'+x+'"'+(disabled?' disabled':'')+'><span class="entitlement-choice-title">'+entitlementModeLabel(x)+'</span><span class="entitlement-choice-desc">'+entitlementModeDescription(x)+'</span></button>';}).join("")+'</div></div>';}
function gestationParts(value){var match=String(value||"").match(/(\d+)\s*周(?:\s*\+?\s*(\d+)\s*天)?/);return {weeks:match?match[1]:"",days:match&&match[2]?match[2]:"0"};}
function conditionFieldType(field){var meta=findField(field);if(field==="休假申请·孕周"||/月数|天数|时长|年龄/.test(field)){return "number";}if(/日期|预产期/.test(field)){return "date";}if(/是否/.test(field)){return "boolean";}if(meta&&meta.values){return "enum";}return "text";}
function conditionOperatorsForField(field){var type=conditionFieldType(field),presence=["未填写","已填写"];if(type==="text"){return ["等于","不等于","包含","不包含"].concat(presence);}if(type==="enum"){return ["等于","不等于","是以下任一项","不是以下任一项"].concat(presence);}if(type==="boolean"){return ["等于","不等于"].concat(presence);}if(type==="date"){return ["等于","不等于","早于","早于等于","晚于","晚于等于"].concat(presence);}return ["等于","不等于","大于","大于等于","小于","小于等于"].concat(presence);}
function conditionNeedsValue(operator){return operator!=="未填写"&&operator!=="已填写";}
function enumValues(value){if(Array.isArray(value)){return value;}return String(value||"").split(/[、,，]/).map(function(x){return x.trim();}).filter(Boolean);}
function multiOptionListHtml(values,current){var selected=enumValues(current);return values.filter(function(x,i,a){return x!=null&&x!==""&&a.indexOf(x)===i;}).map(function(x){return '<option value="'+x+'"'+(selected.indexOf(x)>-1?' selected':'')+'>'+x+'</option>';}).join("");}
function fieldValueControl(field,value,operator){var meta=findField(field),type=conditionFieldType(field);if(field==="休假申请·孕周"){var p=gestationParts(value);return '<span class="condition-value gestation-control" data-value="'+(value||"")+'"><input class="form-input gestation-week" type="number" min="0" value="'+p.weeks+'"><span>周</span><input class="form-input gestation-day" type="number" min="0" max="6" value="'+p.days+'"><span>天</span></span>';}if(meta&&meta.values){var multi=operator==="是以下任一项"||operator==="不是以下任一项"||operator==="包含任一项"||operator==="包含全部项"||operator==="不包含任一项";if(multi){return '<select class="form-select condition-value condition-multi-value" multiple aria-label="条件值，可多选">'+multiOptionListHtml(meta.values.concat(enumValues(value)),value)+'</select>';}return '<select class="form-select condition-value">'+optionListHtml(meta.values.concat([value]),value)+'</select>';}return '<input class="form-input condition-value" type="'+(type==="date"?"date":type==="number"?"number":"text")+'" value="'+(value||"")+'" placeholder="请输入或选择条件值">';}
function conditionValueCellHtml(field,value,operator){return conditionNeedsValue(operator)?fieldValueControl(field,value,operator):'<span class="condition-presence-value">无需填写具体值</span><input class="condition-value" type="hidden" value="">';}
function conditionFieldOptionsHtml(fields,current){var groups={};(fields||[]).forEach(function(field){var meta=findField(field),group=meta?meta.group:"其他";(groups[group]||(groups[group]=[])).push(field);});return Object.keys(groups).map(function(group){return '<optgroup label="'+group+'">'+groups[group].map(function(field){return '<option value="'+field+'"'+(field===current?' selected':'')+'>'+simpleFieldName(field)+'</option>';}).join("")+'</optgroup>';}).join("");}
function structuredConditionRowHtml(row,allowedFields){var fields=allowedFields&&allowedFields.length?allowedFields:fieldCatalog.map(function(x){return x.field;});row=row||condition(fields[0]||"员工信息·性别","等于","");var operators=conditionOperatorsForField(row.field),selected=operators.indexOf(row.operator)>-1?row.operator:operators[0];return '<div class="condition-row structured-condition-row"><label class="condition-control"><span class="condition-mobile-label">条件字段</span><select class="form-select condition-field">'+conditionFieldOptionsHtml(fields,row.field)+'</select></label><label class="condition-control"><span class="condition-mobile-label">运算符</span><select class="form-select condition-operator">'+optionListHtml(operators,selected)+'</select></label><label class="condition-control"><span class="condition-mobile-label">条件值</span><span class="condition-value-cell">'+conditionValueCellHtml(row.field,row.value,selected)+'</span></label><span class="condition-operation-cell"><span class="condition-mobile-label">操作</span><button type="button" class="btn-text remove-condition">删除</button></span></div>';}
function conditionSetHtml(conditions,logic,scopeClass,allowedFields,required,emptyMessage){var rows=conditions&&conditions.length?conditions:[],isRequiredEmpty=required&&!rows.length,message=emptyMessage||"已启用申请资格，请至少添加一条条件。",addButton='<button type="button" class="btn add-structured-condition" data-scope="'+scopeClass+'">＋ 新增条件</button>',empty=isRequiredEmpty?'<div class="empty-condition-state rule-empty-state"><div><span class="rule-empty-badge">待完善</span>'+message+'</div>'+addButton+'</div>':"";return '<div class="logic-row"'+(rows.length>1?'':' style="display:none"')+'><span>多条条件：</span><select class="form-select condition-logic"><option'+(logic!=="满足任一条件（或）"?' selected':'')+'>同时满足全部条件（且）</option><option'+(logic==="满足任一条件（或）"?' selected':'')+'>满足任一条件（或）</option></select></div>'+(rows.length?'<div class="condition-column-header"><span>条件字段</span><span>运算符</span><span>条件值</span><span>操作</span></div>':'')+'<div class="condition-list '+scopeClass+'" data-required="'+(required?'true':'false')+'" data-empty-message="'+message+'">'+empty+rows.map(function(row){return structuredConditionRowHtml(row,allowedFields);}).join("")+'</div><div class="sub-action"'+(isRequiredEmpty?' style="display:none"':'')+'>'+addButton+'</div>';}
function fieldSourceSummaryHtml(fields){var unique=[];(fields||[]).forEach(function(field){if(unique.indexOf(field)<0){unique.push(field);}});if(!unique.length){return '';}return '<div class="system-result"><b>本规则读取的数据</b><br>'+unique.map(function(field){var meta=findField(field);return field+'：'+(meta?meta.note:'由该业务字段提供。');}).join('<br>')+'</div>';}
function durationConditionCellHtml(r){var conditions=r.conditions||[],conditional=conditions.length>0;return '<div class="rule-condition-cell"><div class="condition-scope-line"><span>这条规则何时使用</span><select class="form-select duration-scope-mode"><option'+(!conditional?' selected':'')+'>所有申请</option><option'+(conditional?' selected':'')+'>满足条件时</option></select></div><div class="duration-condition-editor"'+(conditional?'':' style="display:none"')+'>'+conditionSetHtml(conditions,r.logic||"同时满足全部条件（且）","duration-condition-list")+'</div></div>';}
function totalDurationRowHtml(r,leave){return '<tr class="duration-rule-row" data-kind="total"><td>'+durationConditionCellHtml(r)+'</td><td><div class="rule-value-inline"><input class="form-input duration-value" value="'+(r.duration||"")+'"><span>'+leave.unit+'</span></div></td><td><div class="rule-operation"><button type="button" class="btn-text remove-duration-rule">删除</button></div></td></tr>';}
function periodicDurationRowHtml(r,leave){var accumulated=r.limitType!=="申请次数＋单次时长",unit=leave.unit;return '<tr class="duration-rule-row" data-kind="periodic"><td>'+durationConditionCellHtml(r)+'</td><td><select class="form-select period-cycle">'+optionListHtml(["工作日","自然日","自然周","自然月","自然年"],r.cycle||"自然月")+'</select></td><td><select class="form-select period-limit-type">'+optionListHtml(["累计时长","申请次数＋单次时长"],r.limitType||"累计时长")+'</select></td><td><div class="period-limit-stack"><div class="rule-value-inline period-accumulated"'+(accumulated?'':' style="display:none"')+'><input class="form-input period-cap-value" value="'+(r.duration||"")+'"><span class="input-suffix">'+unit+'</span></div><div class="rule-value-inline period-count"'+(accumulated?' style="display:none"':'')+'><span>最多</span><input class="form-input period-max-times" value="'+(r.maxTimes||"")+'"><span>次，每次</span><input class="form-input period-single-duration" value="'+(r.singleDuration||"")+'"><span class="input-suffix">'+unit+'</span></div></div></td><td><div class="rule-operation"><button type="button" class="btn-text remove-duration-rule">删除</button></div></td></tr>';}
function durationRulesTableHtml(mode,rules,leave){var body="",headers="",description="",addLabel="＋ 新增规则",matrixClass="duration-total";(rules||[]).forEach(function(r){if(mode==="按周期限制使用"){body+=periodicDurationRowHtml(r,leave);}else{body+=totalDurationRowHtml(r,leave);}});if(!body){body='<tr class="empty-duration-rules"><td colspan="5"><div class="field-note" style="text-align:center;padding:14px">尚未配置规则。</div></td></tr>';}if(mode==="按总可休时长控制"){headers='<th>时长条件</th><th>最多可休（'+leave.unit+'）</th><th>操作</th>';description="根据城市、孕周、亲属关系等时长条件确定最多可休时长。";addLabel="＋ 新增可休时长规则";}else{headers='<th>时长条件</th><th>统计周期</th><th>限制方式</th><th>周期内最多（'+leave.unit+'）</th><th>操作</th>';description="按工作日、自然日、自然周、自然月或自然年限制累计时长，也可限制申请次数和每次时长。";addLabel="＋ 新增周期规则";matrixClass="duration-periodic";}var fields=[];(rules||[]).forEach(function(r){(r.conditions||[]).forEach(function(x){fields.push(x.field);});});return '<div class="mode-description">'+description+'</div><div class="table-wrap"><table class="business-table duration-matrix '+matrixClass+'"><thead><tr>'+headers+'</tr></thead><tbody id="durationRuleRows">'+body+'</tbody></table></div><div class="sub-action"><button type="button" class="btn add-duration-rule">'+addLabel+'</button></div><div class="rule-source-summary">'+fieldSourceSummaryHtml(fields)+'</div>';}
function conditionOperatorText(operator){return {"等于":"＝","不等于":"≠","是以下任一项":"是以下任一项","不是以下任一项":"不是以下任一项","包含任一项":"包含任一项","包含全部项":"包含全部项","不包含任一项":"不包含任一项","包含":"包含","不包含":"不包含","大于":"＞","大于等于":"≥","小于":"＜","小于等于":"≤","早于":"早于","早于等于":"早于等于","晚于":"晚于","晚于等于":"晚于等于","已填写":"已填写","未填写":"未填写"}[operator]||operator;}
function simpleFieldName(field){return String(field||"").split("·").pop();}
function ruleScopeType(r){if(r.scopeType){return r.scopeType;}return r.conditions&&r.conditions.length?"conditional":"all";}
function normalizeDurationRuleOrder(rules){var normal=[],fallback=[];(rules||[]).forEach(function(r){(ruleScopeType(r)==="all"?fallback:normal).push(r);});rules.splice.apply(rules,[0,rules.length].concat(normal,fallback));return rules;}
function formulaReferencedFields(formula){var matches=String(formula||"").match(/\[([^\]]+)\]/g)||[];return matches.map(function(x){return x.slice(1,-1);}).filter(function(x,index,array){return array.indexOf(x)===index;});}
function validateFormulaText(formula,expected){
  var text=String(formula||"").trim();if(!text){return {ok:false,message:expected==="condition"?"请填写时长条件公式":expected==="annual"?"请填写年假额度公式":"请填写可休时长公式"};}
  var left=(text.match(/\[/g)||[]).length,right=(text.match(/\]/g)||[]).length;if(left!==right){return {ok:false,message:"公式中的字段括号不完整"};}
  var fields=formulaReferencedFields(text),unknown=fields.find(function(field){return !findField(field);});if(unknown){return {ok:false,message:"公式引用了不可用字段："+unknown};}
  if(expected==="condition"){
    if(!/[=≠<>≤≥]|等于|大于|小于|包含|已填写|未填写/.test(text)){return {ok:false,message:"条件公式需要包含明确的判断关系"};}
    var pair=text.match(/\[([^\]]+)\]\s*(=|≠|<|≤|>|≥)\s*\[([^\]]+)\]/);
    if(pair){var leftType=conditionFieldType(pair[1]),rightType=conditionFieldType(pair[3]),numberMismatch=(leftType==="number")!==(rightType==="number"),dateMismatch=(leftType==="date")!==(rightType==="date");if(numberMismatch||dateMismatch){return {ok:false,message:"比较字段的数据类型不一致，请调整判断条件"};}}
  }
  return {ok:true,message:expected==="condition"?"条件公式检查通过，将返回满足或不满足":expected==="annual"?"公式检查通过，将返回年假额度":"公式检查通过，将返回可休时长"};
}
function formulaSummaryText(formula){var fields=formulaReferencedFields(formula);return fields.length?"引用字段："+fields.map(simpleFieldName).join("、"):"已配置高级公式";}
function ruleConditionSummary(r){var conditions=r.conditions||[];if(ruleScopeType(r)==="all"){return "兜底规则";}if(r.conditionMode==="条件公式"){return String(r.conditionFormula||"条件公式").replace(/\s+/g," ").trim();}var joiner=r.logic==="满足任一条件（或）"?" 或 ":" 且 ";return conditions.map(function(c){return simpleFieldName(c.field)+conditionOperatorText(c.operator)+(conditionNeedsValue(c.operator)?c.value:"");}).join(joiner);}
function durationRuleName(r,index){if(r.name){return r.name;}var conditions=r.conditions||[];if(r.conditionMode==="条件公式"){return "高级公式规则"+(index+1);}if(conditions.length===1){var c=conditions[0];if(c.field==="任职信息·工作地区"){return c.value||"地区规则";}return simpleFieldName(c.field)+conditionOperatorText(c.operator)+(c.value||"");}return conditions.length?"组合条件"+(index+1):"统一时长";}
function ruleSignature(r){var conditionPart=r.conditionMode==="条件公式"?(r.conditionFormula||""):(r.logic||"")+"|"+(r.conditions||[]).map(function(c){return [c.field,c.operator,c.value].join("=");}).sort().join("&");return ruleScopeType(r)+"|"+(r.conditionMode||"常规条件")+"|"+conditionPart;}
function checkDurationRuleSet(rules){var issues=[],seen={},unconditionalIndexes=[];(rules||[]).forEach(function(r,index){var label=r.name||"第"+(index+1)+"条规则",scope=ruleScopeType(r);if(scope==="all"){unconditionalIndexes.push(index);}if(scope==="conditional"&&!(r.conditions||[]).length&&r.conditionMode!=="条件公式"){issues.push(label+"尚未配置时长条件");}if(scope==="conditional"&&(r.conditions||[]).some(function(c){return !c.field||!c.operator||(conditionNeedsValue(c.operator)&&!String(c.value||"").trim());})){issues.push(label+"存在未填写完整的时长条件");}if(scope==="conditional"){var signature=ruleSignature(r);if(seen[signature]){issues.push(label+"与"+seen[signature]+"的时长条件重复");}else{seen[signature]=label;}}});if(unconditionalIndexes.length>1){issues.unshift("兜底规则最多只能配置一条");}if(unconditionalIndexes.length===1&&unconditionalIndexes[0]!==rules.length-1){issues.push("兜底规则必须放在规则表最后一条");}if(!(rules||[]).length){issues.push("至少需要配置一条休假规则");}return issues.length?{level:"error",text:issues[0]}:{level:"ok",text:"规则完整。"};}
function durationRuleResultSummary(mode,r,leave){var unit=(leave&&leave.unit)||r.unit||"小时";if(mode==="按总可休时长控制"){return "可休"+(r.duration||"—")+unit;}var prefix="每个"+(r.cycle||"自然月");if(r.limitType==="申请次数＋单次时长"){return prefix+"最多申请"+(r.maxTimes||"—")+"次，每次可休"+(r.singleDuration||"—")+unit;}return prefix+"累计可休"+(r.duration||"—")+unit;}
function escapeRuleHtml(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function ruleConditionDetailHtml(r){if(ruleScopeType(r)==="all"){return '<div class="rule-condition-detail-line">前面的规则均未命中时，使用本条结果。</div>';}if(r.conditionMode==="条件公式"){return '<div class="rule-condition-detail-line"><b>判断方式：</b>条件公式</div><div class="rule-formula-preview">'+escapeRuleHtml(r.conditionFormula||"尚未填写公式")+'</div>';}var conditions=r.conditions||[],joiner=r.logic==="满足任一条件（或）"?"满足任一项（或）":"同时满足全部（且）";return '<div class="rule-condition-detail-line"><b>条件关系：</b>'+joiner+'</div>'+conditions.map(function(c){return '<div class="rule-condition-detail-line">'+escapeRuleHtml(simpleFieldName(c.field)+conditionOperatorText(c.operator)+(conditionNeedsValue(c.operator)?c.value:""))+'</div>';}).join("");}
function ruleConditionSummaryCellHtml(r){var summary=ruleConditionSummary(r);return '<div class="rule-condition-summary" tabindex="0"><span class="rule-condition-summary-text">'+escapeRuleHtml(summary)+'</span><div class="rule-condition-popover">'+ruleConditionDetailHtml(r)+'</div></div>';}
function durationRuleEntryActionsHtml(rules){var hasFallback=(rules||[]).some(function(r){return ruleScopeType(r)==="all";});return '<div class="rule-list-actions"><button type="button" class="btn btn-primary add-condition-duration-summary">＋ 新增条件规则</button>'+(hasFallback?'':'<button type="button" class="btn add-fallback-duration-summary">＋ 新增兜底规则</button>')+'</div>';}
function durationRulesSummaryTableHtml(mode,rules,leave){normalizeDurationRuleOrder(rules);if(!(rules||[]).length){return '<div class="rule-empty-state"><div><span class="rule-empty-badge">待完善</span>请添加一条“时长条件＋最多可休”。</div>'+durationRuleEntryActionsHtml(rules)+'</div>';}var rows=rules.map(function(r,index){var fixed=ruleScopeType(r)==="all";return '<tr class="duration-summary-row" draggable="'+(fixed?"false":"true")+'" data-fixed="'+(fixed?"true":"false")+'" data-index="'+index+'"><td><div class="rule-order-actions">'+(fixed?'<span class="rule-count" title="系统固定在最后">固定</span>':'<span class="drag-handle" title="拖动调整顺序" aria-label="拖动调整顺序">⋮⋮</span>')+'<span>第'+(index+1)+'条</span></div></td><td>'+ruleConditionSummaryCellHtml(r)+'</td><td>'+durationRuleResultSummary(mode,r,leave)+'</td><td><div class="row-actions"><button type="button" class="btn-text edit-duration-summary" data-index="'+index+'">编辑</button><button type="button" class="btn-text copy-duration-summary" data-index="'+index+'">复制</button><button type="button" class="btn-text delete-duration-summary" data-index="'+index+'">删除</button></div></td></tr>';}).join("");return '<div class="rule-list-toolbar"><div class="rule-list-title">规则表 <span class="rule-count">'+rules.length+'条</span></div>'+durationRuleEntryActionsHtml(rules)+'</div><div class="table-wrap rule-summary-wrap"><table class="business-table rule-summary-table"><thead><tr><th>执行顺序</th><th>时长条件</th><th>最多可休</th><th>操作</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="field-note">系统从上到下匹配，命中第一条后结束；条件规则可拖动排序，兜底规则由系统固定在最后。</div>';}
function normalizedFormulaStatus(formula,status){if(!String(formula||"").trim()){return "未检测";}return status&&status!=="未检测"?status:"未检测";}
function formulaStatusText(value){return value==="通过"?"检查通过":value==="未通过"?"检查未通过":"未检查";}
function formulaStatusTag(formula,status){var value=normalizedFormulaStatus(formula,status);return '<span class="formula-status-tag'+(value==="通过"?' passed':value==="未通过"?' failed':'')+'">'+formulaStatusText(value)+'</span>';}
function formulaEditorHtml(id,value,help,status,label){var groups={};fieldCatalog.forEach(function(x){(groups[x.group]||(groups[x.group]=[])).push(x.field);});var left=Object.keys(groups).map(function(group){return '<div class="field-group"><div class="field-group-name">'+group+'</div>'+groups[group].map(function(field){return '<button type="button" class="field-button formula-field-button" data-editor="'+id+'" data-token="['+field+']">'+field.split('·').pop()+'</button>';}).join("")+'</div>';}).join("");var tools=["如果","那么","否则","且","或","=","≠","<","≤",">","≥","+","-","*","/","(",")"],current=normalizedFormulaStatus(value,status);return '<div class="advanced-layout"><div class="field-panel"><div class="panel-mini-head">选择业务字段</div><div class="field-groups">'+left+'</div></div><div class="formula-panel"><div class="formula-editor-label"><span class="required">*</span>'+(label||"计算公式")+'</div><div class="formula-help">'+(help||'选择业务字段并设置判断关系，结果需明确返回“满足”或“不满足”。')+'</div><div class="formula-toolbar">'+tools.map(function(x){return '<button type="button" class="field-button formula-token" data-editor="'+id+'" data-token=" '+x+' ">'+x+'</button>';}).join("")+'</div><textarea class="formula-editor" id="'+id+'">'+(value||"")+'</textarea><div class="formula-check-row"><button type="button" class="btn formula-check">检查公式</button><button type="button" class="btn formula-test">规则试算</button><span class="formula-check-status '+(current==="通过"?"passed":current==="未通过"?"failed":"")+'">'+formulaStatusText(current)+'</span></div><div class="formula-test-panel" data-editor="'+id+'"></div></div></div>';}
function qualificationFormulaSummaryHtml(formula,status){if(!String(formula||"").trim()){return '<div class="formula-summary-card"><div class="formula-summary-head"><div><div class="formula-summary-title">尚未配置高级公式</div><div class="formula-summary-desc">适合常规条件无法表达的组合判断。</div></div><button type="button" class="btn btn-primary configure-qualification-formula">配置高级公式</button></div></div>';}return '<div class="formula-summary-card"><div class="formula-summary-head"><div><div class="formula-summary-title">高级公式已配置 '+formulaStatusTag(formula,status)+'</div><div class="formula-summary-desc">'+formulaSummaryText(formula)+'；判断结果：是否符合申请资格。</div></div><div class="formula-summary-actions"><button type="button" class="btn-text check-qualification-formula">检查公式</button><button type="button" class="btn-text test-qualification-formula">规则试算</button><button type="button" class="btn-text configure-qualification-formula">修改</button><button type="button" class="btn-text clear-qualification-formula">清除</button></div></div></div>';}
function renderQualificationFormulaSummary(){var panel=document.getElementById("conditionFormulaPanel");if(!panel){return;}panel.innerHTML=qualificationFormulaSummaryHtml(activeLeaveRuleDraft&&activeLeaveRuleDraft.conditionFormula,activeLeaveRuleDraft&&activeLeaveRuleDraft.conditionFormulaCheckStatus);bindQualificationFormulaActions();}
function bindQualificationFormulaActions(){document.querySelectorAll(".configure-qualification-formula").forEach(function(btn){btn.onclick=function(){openQualificationFormula(false);};});document.querySelectorAll(".check-qualification-formula").forEach(function(btn){btn.onclick=function(){openQualificationFormula(true);document.querySelector("#formulaConfigBody .formula-check").click();};});document.querySelectorAll(".test-qualification-formula").forEach(function(btn){btn.onclick=function(){openQualificationFormula(true);document.querySelector("#formulaConfigBody .formula-test").click();};});document.querySelectorAll(".clear-qualification-formula").forEach(function(btn){btn.onclick=function(){if(!window.confirm("确定清除已配置的高级公式吗？")){return;}activeLeaveRuleDraft.conditionFormula="";activeLeaveRuleDraft.conditionFormulaCheckStatus="未检测";markLeaveFormDirty();renderQualificationFormulaSummary();};});}
function openQualificationFormula(readonly){var value=(activeLeaveRuleDraft&&activeLeaveRuleDraft.conditionFormula)||"",status=(activeLeaveRuleDraft&&activeLeaveRuleDraft.conditionFormulaCheckStatus)||"未检测";activeFormulaConfig={readonly:readonly,kind:"qualification",checkStatus:status,originalValue:value};document.getElementById("formulaConfigTitle").textContent=readonly?"查看资格公式":"配置资格公式";document.getElementById("formulaConfigBody").innerHTML=formulaEditorHtml("qualificationFormulaDraft",value,"",status,"资格公式");document.getElementById("saveFormulaConfig").style.display=readonly?"none":"inline-flex";document.getElementById("formulaConfigMask").classList.add("show");bindFormulaEditors();if(readonly){var textarea=document.getElementById("qualificationFormulaDraft");textarea.readOnly=true;document.querySelectorAll("#formulaConfigBody .formula-toolbar,#formulaConfigBody .formula-actions,#formulaConfigBody .field-panel").forEach(function(el){el.style.display="none";});document.querySelector("#formulaConfigBody .advanced-layout").style.gridTemplateColumns="1fr";}}
function closeFormulaConfig(){document.getElementById("formulaConfigMask").classList.remove("show");activeFormulaConfig=null;}
function durationFormulaSummaryHtml(leave,rule){var formula=String(rule.durationFormula||"").trim();if(!formula){return '<div class="duration-formula-card"><div class="duration-formula-card-head"><div class="duration-formula-title">尚未配置高级公式</div><button type="button" class="btn btn-primary configure-duration-formula">配置公式</button></div></div>';}return '<div class="duration-formula-card"><div class="duration-formula-card-head"><div class="duration-formula-title">高级公式已配置 '+formulaStatusTag(formula,rule.durationFormulaCheckStatus)+'</div><div class="duration-formula-actions"><button type="button" class="btn-text check-duration-formula">检查公式</button><button type="button" class="btn-text test-duration-formula">规则试算</button><button type="button" class="btn-text configure-duration-formula">修改</button><button type="button" class="btn-text clear-duration-formula">清除</button></div></div><div class="duration-formula-preview">'+escapeRuleHtml(formula)+'</div></div>';}
function openDurationFormula(readonly,leave,rule){var value=rule.durationFormula||"",status=rule.durationFormulaCheckStatus||"未检测";activeFormulaConfig={readonly:readonly,kind:"duration",leave:leave,rule:rule,checkStatus:status,originalValue:value};document.getElementById("formulaConfigTitle").textContent=readonly?"查看可休时长公式":"配置可休时长公式";document.getElementById("formulaConfigBody").innerHTML=formulaEditorHtml("durationFormulaDraft",value,"公式需返回可休时长数值，单位为“"+leave.unit+"”。",status,"可休时长公式");document.getElementById("saveFormulaConfig").style.display=readonly?"none":"inline-flex";document.getElementById("formulaConfigMask").classList.add("show");bindFormulaEditors();if(readonly){var textarea=document.getElementById("durationFormulaDraft");textarea.readOnly=true;document.querySelectorAll("#formulaConfigBody .formula-toolbar,#formulaConfigBody .field-panel").forEach(function(el){el.style.display="none";});document.querySelector("#formulaConfigBody .advanced-layout").style.gridTemplateColumns="1fr";}}
function entitlementDetailHtml(key,leave,rule){var mode=rule.entitlementMode;if(mode==="按可用余额控制"){var tab=key==="annual"?"annual":key==="comp"?"comp":key==="sick"?"sick":"";return '<div class="inline-link-row"><div><b>为该假别发放并使用额度</b><div class="field-note">额度生成、有效期、扣减顺序、结转和结算由对应额度配置维护；余额为0或不足时是否阻止提交，按“余额限制”判断。</div></div>'+(tab?'<button type="button" class="btn jump-quota" data-tab="'+tab+'">前往额度配置</button>':'')+'</div>';}if(mode==="不限制可休总时长"){return '';}var formulaMode=rule.durationMode==="统一公式";return '<div class="duration-config-head"><div><div class="form-label"><span class="required">*</span>配置方式</div><div class="duration-config-mode"><button type="button" class="duration-config-option'+(formulaMode?'':' active')+'" data-duration-mode="规则表">常规条件</button><button type="button" class="duration-config-option'+(formulaMode?' active':'')+'" data-duration-mode="统一公式">高级公式</button></div></div></div><div id="durationConfigContent">'+(formulaMode?durationFormulaSummaryHtml(leave,rule):durationRulesSummaryTableHtml(mode,rule.durationRules,leave))+'</div>';}
function unifiedEntitlementHtml(key,leave,rule){return businessSectionHtml("3. 可休时长","",entitlementModeSelectHtml(key,rule.entitlementMode)+'<div id="entitlementDetail">'+entitlementDetailHtml(key,leave,rule)+'</div>');}

function unifiedApplicationHtml(leave,rule){var conditionsOn=rule.conditionEnabled,conditionMode=rule.conditionMode||"常规条件",standard=conditionMode!=="公式配置",conditionBody='<span class="form-label"><span class="required">*</span>判断方式</span>'+configModeSwitchHtml("conditionMode",standard?"常规条件":"公式配置","常规条件")+'<div id="conditionStandardPanel"'+(standard?'':' style="display:none"')+'>'+conditionSetHtml(rule.conditions,rule.conditionLogic,"eligibility-condition-list",null,true)+'</div><div id="conditionFormulaPanel"'+(standard?' style="display:none"':'')+'>'+qualificationFormulaSummaryHtml(rule.conditionFormula,rule.conditionFormulaCheckStatus)+'</div>';var qualifications='<div class="linked-box rule-module"><div class="attachment-title"><button type="button" class="switch-toggle inline-rule-toggle '+(conditionsOn?'on':'')+'" data-target="applicationConditionBody" aria-pressed="'+conditionsOn+'" aria-label="申请资格"></button><span>申请资格</span></div><div id="applicationConditionBody"'+(conditionsOn?'':' style="display:none"')+'>'+conditionBody+'</div></div>';return businessSectionHtml("4. 申请资格","按员工信息、任职信息或系统计算结果判断能否申请；入职等待期也在这里配置。",qualifications);}

function normalizedCalendarOffsetUnit(unit){if(unit==="天"){return "自然日";}if(unit==="个月"||unit==="月"){return "日历月";}if(unit==="年"){return "日历年";}return unit||"自然日";}
function dateRuleRowHtml(row){row=row||{target:"请选择",relation:"请选择",reference:"请选择",offset:"",unit:"自然日"};var unit=normalizedCalendarOffsetUnit(row.unit);return '<div class="date-rule-row"><select class="form-select date-target">'+optionListHtml(["请选择","休假开始日期","休假结束日期"],row.target)+'</select><select class="form-select date-relation">'+optionListHtml(["请选择","不得早于","不得晚于"],row.relation)+'</select><select class="form-select date-reference">'+optionListHtml(["请选择"].concat(dateReferenceOptions),row.reference)+'</select><div class="date-value-unit"><input class="form-input date-offset" type="number" min="0" value="'+row.offset+'"><select class="form-select date-unit">'+optionListHtml(["自然日","工作日","日历月","日历年"],unit)+'</select></div><button type="button" class="btn-text remove-date-rule">删除</button></div>';}
function dateRulesInnerHtml(rows){if(!(rows||[]).length){return '<div class="rule-empty-state empty-date-rules"><div><span class="rule-empty-badge">待完善</span>已启用日期限制，请至少新增一条日期规则。</div><button type="button" class="btn add-date-rule">＋ 新增日期规则</button></div>';}return '<div class="date-rule-header"><span><i class="required">*</i>校验日期</span><span><i class="required">*</i>限制方式</span><span><i class="required">*</i>参照日期 <span class="hint" data-tip="只能选择系统已保存的日期；材料中未结构化登记的日期由审批人核验，不能自动校验。">?</span></span><span><i class="required">*</i>时间范围 <span class="hint" data-tip="自然日连续计算日历日期；工作日按企业工作日历计算；日历月、日历年按对应日期偏移。">?</span></span><span>操作</span></div><div class="date-rule-list">'+rows.map(dateRuleRowHtml).join("")+'</div><div class="sub-action"><button type="button" class="btn add-date-rule">＋ 新增日期规则</button></div>';}
function dateRulesHtml(rows){return '<div id="dateRulesEditor">'+dateRulesInnerHtml(rows)+'</div>';}
function unifiedLeaveDateHtml(rule){var on=rule.leaveDateEnabled;return businessSectionHtml("5. 日期限制","",'<div class="linked-box rule-module"><div class="attachment-title"><button type="button" class="switch-toggle inline-rule-toggle '+(on?'on':'')+'" data-target="leaveDateRuleBody" aria-pressed="'+on+'" aria-label="日期限制"></button><span>日期限制</span></div><div id="leaveDateRuleBody"'+(on?'':' style="display:none"')+'>'+dateRulesHtml(rule.leaveDateRules)+'</div></div>');}
function intervalUnitOptions(unit){return unit==="小时"?["小时","自然日","工作日","周","月"]:["自然日","工作日","周","月"];}
function unifiedIntervalHtml(leave,rule){var on=!!rule.intervalEnabled,options=intervalUnitOptions(leave.unit),current=options.indexOf(rule.intervalUnit)>-1?rule.intervalUnit:"自然日";return businessSectionHtml("7. 申请间隔","",'<div class="linked-box rule-module"><div class="attachment-title"><button type="button" class="switch-toggle inline-rule-toggle '+(on?'on':'')+'" data-target="intervalRuleBody" aria-pressed="'+on+'" aria-label="申请间隔"></button><span>申请间隔</span></div><div id="intervalRuleBody"'+(on?'':' style="display:none"')+'><label class="business-field interval-field"><span class="form-label"><span class="required">*</span>最小间隔 <span class="hint" data-tip="只比较有效的同类休假；驳回、撤回、终止及已全部销假的单据不计入。">?</span></span><div class="compound-value-unit"><input class="form-input" id="intervalValue" type="number" min="0" value="'+(rule.intervalValue||"")+'"><select class="form-select" id="intervalUnit" title="间隔单位">'+optionListHtml(options,current)+'</select></div></label></div></div>');}
function unifiedUsageModeHtml(rule){var value=rule.usageMode==="必须一次性休完"?"必须一次申请完":"可分次申请";return businessSectionHtml("8. 使用方式","",businessFieldsHtml([{label:"使用方式",value:value,options:["可分次申请","必须一次申请完"],id:"mustCompleteOnce",required:true,direct:true,wideChoice:true,tip:"只控制一项可休权益是否可以拆成多张申请，不决定休假日期是否连续。"}]));}
function unifiedOtherHtml(leave){var prerequisite=arrayValue(leave.prerequisite),options=leaves.filter(function(x){return x.name!==leave.name;}).map(function(x){return x.name;}),strongChecked=leave.strong==="是";return businessSectionHtml("9. 前置假","",'<span class="form-label">前置假类型</span>'+checkboxGroupHtml("preposHolidayGroup",options,prerequisite)+'<div class="strong-control-row" id="preleaveControlRow"'+(prerequisite.length?'':' style="display:none"')+'><label class="checkbox-option strong-control-option"><input type="checkbox" id="unifiedStrongControl"'+(strongChecked?' checked':'')+'>强管控</label><span class="hint" data-tip="强管控：只有前置假余额小于等于0时，才能申请当前假别。未勾选为弱管控：前置假余额不足以覆盖本次申请时，即可申请当前假别。">?</span></div>',"","preleave-section");}
var attachmentTypeLibrary=[
  {name:"诊断证明",note:"医疗机构出具的诊断证明。"},
  {name:"病历",note:"门诊或住院病历资料。"},
  {name:"医疗费用单据",note:"医疗机构开具的费用凭证。"},
  {name:"结婚证明",note:"用于核验婚姻登记事实。"},
  {name:"产检证明",note:"用于核验产检安排。"},
  {name:"生育证明",note:"用于核验生育相关事项。"},
  {name:"流产证明",note:"用于核验流产相关事项。"},
  {name:"难产证明",note:"用于核验难产相关事项。"},
  {name:"出生证明",note:"用于核验子女出生信息。"},
  {name:"死亡证明",note:"用于核验亲属去世事实。"},
  {name:"亲属关系证明",note:"用于核验员工与相关人员的关系。"}
];
var activeAttachmentRuleRow=null;
var pendingAttachmentTypes=[];
var editingAttachmentTypeIndex=-1;
var pendingAttachmentTypeNameEn="";
attachmentTypeLibrary.forEach(function(item){if(!item.state){item.state="启用";}if(!item.updatedBy){item.updatedBy="系统管理员";}if(!item.updatedAt){item.updatedAt="2026-07-25 10:00";}});
attachmentTypeLibrary.forEach(function(item,index){
  if(!item.code){item.code="ATT"+String(index+1).padStart(3,"0");}
  if(!item.nameEn){item.nameEn="";}
  if(!item.businesses){item.businesses=["考勤"];}
  if(!item.description){item.description=item.note||"";}
  if(!item.createdBy){item.createdBy=item.updatedBy||"系统管理员";}
  if(!item.createdAt){item.createdAt=item.updatedAt||"2026-07-25 10:00";}
});
function normalizedAttachmentRules(rule){return rule.attachmentRules&&rule.attachmentRules.length?rule.attachmentRules:[];}
function attachmentTypeSummaryHtml(selected){var values=arrayValue(selected);if(!values.length){return '<span class="attachment-type-empty">尚未选择附件类型</span>';}return values.map(function(item){return '<span class="attachment-type-chip">'+item+'</span>';}).join("");}
function attachmentTypeReferenceHtml(selected){var values=arrayValue(selected);return '<div class="attachment-type-reference"><input type="hidden" class="attachment-material-values" value="'+values.join("、")+'"><div class="attachment-type-summary">'+attachmentTypeSummaryHtml(values)+'</div><button type="button" class="btn select-attachment-types">选择附件类型</button></div>';}
function attachmentRuleRowHtml(row,leave){row=row||{basis:"所有申请",operator:"大于",value:"",materials:[],requirement:"全部提供"};var conditional=row.basis!=="所有申请",unit=row.basis==="休假日期跨度"?"自然日":leave.unit;return '<tr class="attachment-config-row"><td><div class="attachment-upload-condition"><select class="form-select attachment-basis">'+optionListHtml(["所有申请","本次申请时长","休假日期跨度"],row.basis)+'</select><span class="attachment-all-text"'+(conditional?' style="display:none"':'')+'>每次申请均需提供</span><div class="attachment-condition"'+(conditional?'':' style="display:none"')+'><select class="form-select attachment-operator">'+optionListHtml(["大于","大于等于"],row.operator||"大于")+'</select><input class="form-input attachment-value" type="number" min="0" value="'+(row.value||"")+'"><span class="attachment-unit">'+unit+'</span></div></div></td><td>'+attachmentTypeReferenceHtml(row.materials)+'</td><td><select class="form-select attachment-requirement">'+optionListHtml(["全部提供","任选一种"],row.requirement||"全部提供")+'</select></td><td><button type="button" class="btn-text remove-attachment-rule">删除</button></td></tr>';}
function attachmentRulesContentHtml(rows,leave){if(!(rows||[]).length){return '<div class="rule-empty-state empty-attachment-rules"><div><span class="rule-empty-badge">待完善</span>已启用材料要求，请至少新增一条材料规则。</div><button type="button" class="btn add-attachment-rule">＋ 新增材料规则</button></div>';}return '<div class="table-wrap"><table class="business-table attachment-rule-table"><thead><tr><th>上传条件 <span class="hint" data-tip="本次申请时长取提交前试算结果；休假日期跨度包含开始日和结束日，按自然日计算。">?</span></th><th>附件类型</th><th>提供方式</th><th>操作</th></tr></thead><tbody id="attachmentRuleRows">'+rows.map(function(row){return attachmentRuleRowHtml(row,leave);}).join("")+'</tbody></table></div><div class="attachment-match-note">同一次申请命中多条规则时，每条规则都需要满足；重复的附件类型只需上传一次。</div><div class="sub-action"><button type="button" class="btn add-attachment-rule">＋ 新增材料规则</button></div>';}
function unifiedAttachmentHtml(leave,rule){var rows=normalizedAttachmentRules(rule);return businessSectionHtml("9. 材料要求","",'<div id="attachmentRuleBody"'+(rule.attachmentEnabled?'':' style="display:none"')+'>'+attachmentRulesContentHtml(rows,leave)+'</div>',moduleActionHtml("attachmentRuleBody",rule.attachmentEnabled,"材料要求"));}
function unifiedPolicyHtml(rule){return businessSectionHtml("10. 员工说明","员工选择该假别后展示，不参与计算。",'<div id="unifiedPolicyBody"'+(rule.policyEnabled?'':' style="display:none"')+'><span class="form-label"><span class="required">*</span>说明内容</span><textarea class="policy-textarea" id="unifiedPolicyNotice">'+rule.policyNotice+'</textarea></div>',moduleActionHtml("unifiedPolicyBody",rule.policyEnabled,"员工说明"));}

function regroupLeaveSections(body){
  var sections=Array.from(body.children).filter(function(node){return node.classList&&node.classList.contains("business-section");});
  if(sections.length!==10){return;}
  var groups=[
    {title:"1. 基本信息",flat:true,items:[[sections[0],""],[sections[1],""]]},
    {title:"2. 可休时长",items:[[sections[2],""],[sections[6],""]]},
    {title:"3. 申请规则",items:[[sections[3],"申请资格"],[sections[4],"日期限制"],[sections[5],"申请间隔"],[sections[7],"前置假"]]},
    {title:"4. 材料与说明",items:[[sections[8],"材料要求"],[sections[9],"员工说明"]]}
  ];
  groups.forEach(function(groupData){
    var group=document.createElement("section");
    group.className="business-section";
    group.innerHTML='<div class="business-section-head"><div><div class="business-section-title">'+groupData.title+'</div></div></div><div class="business-section-body"></div>';
    body.insertBefore(group,groupData.items[0][0]);
    var target=group.querySelector(".business-section-body");
    if(groupData.flat){
      var mergedGrid=document.createElement("div");
      mergedGrid.className="business-field-grid basic-settings-grid";
      var extraNodes=[];
      groupData.items.forEach(function(item){
        var source=item[0],sourceBody=source.querySelector(".business-section-body"),grid=sourceBody.querySelector(":scope > .business-field-grid");
        if(grid){while(grid.firstChild){mergedGrid.appendChild(grid.firstChild);}grid.remove();}
        while(sourceBody.firstChild){extraNodes.push(sourceBody.firstChild);sourceBody.removeChild(sourceBody.firstChild);}
        source.remove();
      });
      extraNodes.forEach(function(node){
        if(node.id==="hourCalculationFields"){mergedGrid.appendChild(node);}
        else{target.appendChild(node);}
      });
      target.insertBefore(mergedGrid,target.firstChild);
      return;
    }
    groupData.items.forEach(function(item){
      var source=item[0],sourceHead=source.querySelector(".business-section-head"),sourceBody=source.querySelector(".business-section-body"),action=sourceHead&&sourceHead.children.length>1?sourceHead.lastElementChild:null,sub=document.createElement("div"),subHead=document.createElement("div"),subBody=document.createElement("div");
      sub.className="business-subsection";
      subHead.className="business-subsection-head";
      subHead.innerHTML=item[1]?'<div class="business-subsection-title">'+item[1]+'</div>':'';
      if(action){subHead.appendChild(action);}
      subBody.className="business-subsection-body";
      while(sourceBody.firstChild){subBody.appendChild(sourceBody.firstChild);}
      sub.appendChild(subHead);
      sub.appendChild(subBody);
      target.appendChild(sub);
      source.remove();
    });
  });
}
function openLeaveForm(key){editingLeaveKey=key||"";var leave=key?leaves.find(function(x){return x.key===key;}):{name:"",unit:"小时",min:"1",max:"",calc:"考勤日",roundBase:"0.5",round:"向上取整",daily:"8",prerequisite:"无",strong:"—",paid:"是",balanceLimit:"否"};var r=key?JSON.parse(JSON.stringify(unifiedRules[key])):defaultRule();activeLeaveRuleDraft=r;leaveFormDirty=false;hidePlanPageBanner();document.getElementById("leaveFormTitle").textContent=key?"编辑休假配置":"新增休假配置";var outline='<div class="form-outline"><button type="button" class="outline-link active" data-section="1">基本信息</button><button type="button" class="outline-link" data-section="2">可休时长</button><button type="button" class="outline-link" data-section="3">申请规则</button><button type="button" class="outline-link" data-section="4">材料与说明</button></div>';var body=document.getElementById("leaveFormBody");body.innerHTML=outline+unifiedBaseHtml(leave,!key)+unifiedCalculationHtml(leave)+unifiedEntitlementHtml(key,leave,r)+unifiedApplicationHtml(leave,r)+unifiedLeaveDateHtml(r)+unifiedIntervalHtml(leave,r)+unifiedUsageModeHtml(r)+unifiedOtherHtml(leave)+unifiedAttachmentHtml(leave,r)+unifiedPolicyHtml(r);regroupLeaveSections(body);body.querySelectorAll(".business-section").forEach(function(section,index){section.id="leaveSection"+(index+1);});body.scrollTop=0;document.getElementById("modalMask").classList.add("show");bindUnifiedForm(key,leave,r);body.oninput=markLeaveFormDirty;body.onchange=markLeaveFormDirty;}

function durationRuleDirectFieldsHtml(mode,r,leave){var unit=fieldValue("leaveUnit",(leave&&leave.unit)||"小时");if(mode==="按总可休时长控制"){return businessFieldsHtml([{label:"最多可休",value:r.duration||"",id:"ruleDuration",required:true,type:"number",min:"0",suffix:unit}]);}var countMode=r.limitType==="申请次数＋单次时长";return '<div id="rulePeriodAccumulated"'+(countMode?' style="display:none"':'')+'>'+businessFieldsHtml([{label:"周期上限",value:r.duration||"",id:"ruleDuration",required:true,type:"number",min:"0",suffix:unit}])+'</div><div id="rulePeriodCount"'+(countMode?'':' style="display:none"')+'>'+businessFieldsHtml([{label:"申请次数上限",value:r.maxTimes||"",id:"ruleMaxTimes",required:true,type:"number",min:"1",suffix:"次"},{label:"单次上限",value:r.singleDuration||"",id:"ruleSingleDuration",required:true,type:"number",min:"0",suffix:unit,tip:"这是每张申请单的上限；与基本信息中的单次最小时长共同决定可提交范围。"}])+'</div>';}
function periodLimitTypeSelectHtml(current){return directChoiceControlHtml({id:"ruleLimitType",value:current==="申请次数＋单次时长"?"申请次数＋单次时长":"累计时长",options:[{value:"累计时长",label:"只限制周期累计时长"},{value:"申请次数＋单次时长",label:"限制申请次数和每次上限"}],wideChoice:true});}
function durationRuleResultEditorHtml(mode,r,leave){var common="",preview="";if(mode==="按周期限制使用"){common='<div class="business-field-grid"><label class="business-field"><span class="form-label"><span class="required">*</span>统计周期</span><select class="form-select" id="ruleCycle">'+optionListHtml(["工作日","自然日","自然周","自然月","自然年"],r.cycle||"自然月")+'</select></label><label class="business-field"><span class="form-label"><span class="required">*</span>限制方式</span>'+periodLimitTypeSelectHtml(r.limitType||"累计时长")+'</label></div>';preview='<div class="period-rule-preview" id="periodRulePreview"><b>规则结果：</b>'+durationRuleResultSummary(mode,r,leave)+'。</div>';}return common+durationRuleDirectFieldsHtml(mode,r,leave)+preview;}
function newDurationRuleFromContext(mode,leave,ruleData,scopeType){var existing=ruleData.durationRules||[],template=existing.length?existing[existing.length-1]:null,r=defaultDurationRule(mode,leave);r.scopeType=scopeType||"conditional";if(!template){return r;}r.conditionMode="常规条件";r.conditionFormula="";r.conditionSummary="";r.conditions=[];r.cycle=template.cycle||r.cycle;r.limitType=template.limitType||r.limitType;r.unit=template.unit||r.unit;r.resultMode=template.resultMode||"直接填写";r.formula="";r.duration="";r.maxTimes="";r.singleDuration="";return r;}
function conditionSourceBoxHtml(r){var fields=[];(r.conditions||[]).forEach(function(c){if(fields.indexOf(c.field)<0){fields.push(c.field);}});return '<div class="condition-source-box" id="ruleConditionSourceSummary"'+(r.conditionMode==="条件公式"||!fields.length?' style="display:none"':'')+'><b>条件数据来源</b><br>'+fields.map(function(field){var meta=findField(field);return field+'：'+(meta?meta.note:'由对应业务字段提供。');}).join('<br>')+'</div>';}
function durationConditionEditorHtml(r){return '<input type="hidden" id="ruleConditionMode" value="常规条件"><div id="ruleStandardConditionPanel">'+conditionSetHtml(r.conditions,r.logic||"同时满足全部条件（且）","rule-editor-condition-list",null,true)+'</div>';}
function refreshRuleConditionSourceSummary(){var box=document.getElementById("ruleConditionSourceSummary");if(!box){return;}if(fieldValue("ruleConditionMode","常规条件")==="条件公式"){box.style.display="none";box.innerHTML="";return;}var fields=[];document.querySelectorAll("#ruleEditorConditions .condition-field").forEach(function(select){var row=select.closest(".structured-condition-row"),value=row&&row.querySelector(".condition-value");if(select.value&&value&&String(value.value||value.dataset.value||"").trim()&&fields.indexOf(select.value)<0){fields.push(select.value);}});box.style.display=fields.length?"block":"none";box.innerHTML=fields.length?'<b>条件数据来源</b><br>'+fields.map(function(field){var meta=findField(field);return field+'：'+(meta?meta.note:'由对应业务字段提供。');}).join('<br>'):'';}
function ruleResultGroupTitle(mode,fallback){if(mode==="按周期限制使用"){return fallback?"未命中条件时的使用上限":"2. 周期限制";}return fallback?"未命中条件时最多可休":"2. 符合条件时最多可休";}
function openDurationRuleEditor(index,key,leave,ruleData,scopeType){var mode=ruleData.entitlementMode,editorLeave=Object.assign({},leave,{unit:fieldValue("leaveUnit",leave.unit||"小时")}),r=index>=0?JSON.parse(JSON.stringify(ruleData.durationRules[index])):newDurationRuleFromContext(mode,editorLeave,ruleData,scopeType),fallback=ruleScopeType(r)==="all";r.conditionMode="常规条件";r.resultMode="直接填写";activeDurationRuleEditor={index:index,key:key,leave:editorLeave,ruleData:ruleData,mode:mode,source:r};durationRuleEditorDirty=false;document.getElementById("ruleEditorTitle").textContent=index>=0?(fallback?"编辑兜底规则":"编辑条件规则"):(fallback?"新增兜底规则":"新增条件规则");document.getElementById("saveDurationRule").textContent="确定";var body=document.getElementById("ruleEditorBody"),conditionGroup=fallback?'<div class="fallback-editor-note">前面的条件规则均未命中时执行本规则；系统将本规则固定在规则列表最后。</div>':'<div class="rule-editor-group"><div class="rule-editor-group-title">1. 时长条件</div><div id="ruleEditorConditions">'+durationConditionEditorHtml(r)+'</div>'+conditionSourceBoxHtml(r)+'</div>';body.innerHTML=conditionGroup+'<div class="rule-editor-group"><div class="rule-editor-group-title">'+ruleResultGroupTitle(mode,fallback)+'</div>'+durationRuleResultEditorHtml(mode,r,editorLeave)+'</div>';document.getElementById("ruleEditorMask").classList.add("show");bindDurationRuleEditor();body.oninput=function(){durationRuleEditorDirty=true;};body.onchange=function(){durationRuleEditorDirty=true;};}
function closeDurationRuleEditor(force){if(!force&&durationRuleEditorDirty&&!window.confirm("当前规则尚未保存，确定离开吗？")){return false;}document.getElementById("ruleEditorMask").classList.remove("show");activeDurationRuleEditor=null;durationRuleEditorDirty=false;return true;}
function refreshPeriodRulePreview(){if(!activeDurationRuleEditor||activeDurationRuleEditor.mode!=="按周期限制使用"){return;}var preview=document.getElementById("periodRulePreview");if(!preview){return;}var draft=collectEditedDurationRule();preview.innerHTML='<b>规则结果：</b>'+durationRuleResultSummary("按周期限制使用",draft,activeDurationRuleEditor.leave)+'。';}
function bindDurationRuleEditor(){bindDirectChoices(document.getElementById("ruleEditorBody"));var conditionMode=document.getElementById("ruleConditionMode");document.querySelectorAll('input[name="durationConditionMode"]').forEach(function(input){input.onchange=function(){if(!conditionMode||!input.checked){return;}conditionMode.value=input.value;document.querySelectorAll(".condition-mode-radio").forEach(function(label){label.classList.toggle("active",label.contains(input));});var formula=conditionMode.value==="条件公式";document.getElementById("ruleStandardConditionPanel").style.display=formula?"none":"block";document.getElementById("ruleFormulaConditionPanel").style.display=formula?"block":"none";durationRuleEditorDirty=true;refreshRuleConditionSourceSummary();};});var resultMode=document.getElementById("ruleResultMode");if(resultMode){resultMode.onchange=function(){var formula=resultMode.value==="公式计算";document.getElementById("ruleDirectResult").style.display=formula?"none":"block";document.getElementById("ruleFormulaResult").style.display=formula?"block":"none";refreshPeriodRulePreview();};}var limit=document.getElementById("ruleLimitType");if(limit){limit.onchange=function(){var count=limit.value==="申请次数＋单次时长";var accumulated=document.getElementById("rulePeriodAccumulated"),times=document.getElementById("rulePeriodCount");if(accumulated){accumulated.style.display=count?"none":"block";}if(times){times.style.display=count?"block":"none";}refreshPeriodRulePreview();};}["ruleCycle","ruleDuration","ruleMaxTimes","ruleSingleDuration"].forEach(function(id){var control=document.getElementById(id);if(control){control.addEventListener(control.tagName==="SELECT"?"change":"input",refreshPeriodRulePreview);if(control.tagName!=="SELECT"){control.addEventListener("input",function(){clearLeaveFieldError(control);});control.addEventListener("blur",function(){validateDurationRuleNumericField(id);});}}});bindConditionRows();bindFormulaEditors();refreshRuleConditionSourceSummary();refreshPeriodRulePreview();}
function collectEditedDurationRule(){var ctx=activeDurationRuleEditor,mode=ctx.mode,source=ctx.source,scope=ruleScopeType(source),conditions=scope==="conditional"?collectConditionSet(document.querySelector(".rule-editor-condition-list")):[],logic=document.querySelector("#ruleEditorConditions .condition-logic"),r=durationRule(conditions,"",{name:source.name||"",scopeType:scope,conditionMode:"常规条件",conditionFormula:"",conditionSummary:"",kind:durationRuleKind(mode),logic:logic?logic.value:"同时满足全部条件（且）",resultMode:"直接填写",formula:""});r.unit=ctx.leave.unit;if(mode==="按周期限制使用"){r.cycle=fieldValue("ruleCycle","自然月");r.limitType=fieldValue("ruleLimitType","累计时长");if(r.limitType==="申请次数＋单次时长"){r.maxTimes=fieldValue("ruleMaxTimes","");r.singleDuration=fieldValue("ruleSingleDuration","");}else{r.duration=fieldValue("ruleDuration","");}}else{r.duration=fieldValue("ruleDuration","");}return r;}

function resetActiveFormulaCheck(){if(!activeFormulaConfig){return;}activeFormulaConfig.checkStatus="未检测";var status=document.querySelector("#formulaConfigBody .formula-check-status");if(status){status.textContent="未检查";status.className="formula-check-status";}}
function insertFormulaToken(editorId,token){var editor=document.getElementById(editorId);if(!editor){return;}var start=editor.selectionStart||0,end=editor.selectionEnd||0;editor.value=editor.value.slice(0,start)+token+editor.value.slice(end);editor.focus();editor.selectionStart=editor.selectionEnd=start+token.length;resetActiveFormulaCheck();if(document.getElementById("ruleEditorMask").classList.contains("show")){durationRuleEditorDirty=true;if(editorId==="ruleConditionFormula"){refreshRuleConditionSourceSummary();}}else{markLeaveFormDirty();}}
function formulaSampleValue(field){var name=simpleFieldName(field);if(/性别/.test(name)){return "女";}if(/婚姻状况/.test(name)){return "已婚";}if(/孕周/.test(name)){return "25周3天";}if(/城市/.test(name)){return "上海";}if(/人员状态|转正状态/.test(name)){return "正式";}if(/员工类型/.test(name)){return "内部员工";}if(/职位/.test(name)){return "职能";}if(/日期|预产期/.test(name)){return "2026-08-01";}if(/天数|时长|工龄|司龄|年龄/.test(name)){return "12";}return "示例值";}
function formulaTestPanelHtml(editor,expected){var fields=formulaReferencedFields(editor.value),fieldRows;if(expected==="annual"){fieldRows='<label class="formula-test-field"><span class="formula-test-label">标准额度</span><input class="form-input formula-test-input" data-sample-key="standard" value="80"></label><label class="formula-test-field"><span class="formula-test-label">实际在职天数</span><input class="form-input formula-test-input" data-sample-key="active" value="184"></label><label class="formula-test-field"><span class="formula-test-label">自然年总天数</span><input class="form-input formula-test-input" data-sample-key="total" value="365"></label>';}else{fieldRows=fields.map(function(field){return '<label class="formula-test-field"><span class="formula-test-label">'+escapeRuleHtml(simpleFieldName(field))+'</span><input class="form-input formula-test-input" data-field="'+escapeRuleHtml(field)+'" value="'+escapeRuleHtml(formulaSampleValue(field))+'"></label>';}).join("");}return '<div class="formula-test-head"><div><div class="formula-test-title">规则试算</div><div class="formula-summary-desc">填写一组示例数据，查看这条规则会得到什么结果。</div></div><button type="button" class="btn btn-primary formula-test-run">开始试算</button></div>'+(fieldRows?'<div class="formula-test-grid">'+fieldRows+'</div>':'<div class="field-note">当前公式未引用业务字段，可直接试算结果。</div>')+'<div class="formula-test-result" style="display:none"></div>';}
function durationFormulaSampleResult(formula){var match=String(formula||"").match(/那么\s*([0-9]+(?:\.[0-9]+)?)/);if(match){return match[1];}var values=String(formula||"").match(/[0-9]+(?:\.[0-9]+)?/g)||[];return values.length?values[values.length-1]:"1";}
function bindFormulaTestPanel(panel,editor,expected){var run=panel.querySelector(".formula-test-run");if(!run){return;}run.onclick=function(){var result=panel.querySelector(".formula-test-result"),text;if(expected==="condition"){text='<b>试算结果：符合申请资格</b><br><span>当前示例数据满足公式条件。</span>';}else if(expected==="annual"){var standard=Number((panel.querySelector('[data-sample-key="standard"]')||{}).value||0),active=Number((panel.querySelector('[data-sample-key="active"]')||{}).value||0),total=Number((panel.querySelector('[data-sample-key="total"]')||{}).value||0),amount=total>0?standard*active/total:0;text='<b>试算结果：'+amount.toFixed(2)+'小时</b><br><span>'+standard+' × '+active+' ÷ '+total+' = '+amount.toFixed(2)+'小时</span>';}else{var unit=activeFormulaConfig&&activeFormulaConfig.leave?activeFormulaConfig.leave.unit:"小时";text='<b>试算结果：'+escapeRuleHtml(durationFormulaSampleResult(editor.value))+escapeRuleHtml(unit)+'</b><br><span>该结果仅用于验证规则，保存后仍按员工实际数据计算。</span>';}result.innerHTML=text;result.style.display="block";showToast("规则试算完成");};}
function formulaExpectedType(editor){return editor.id==="annualFormulaText"?"annual":/Condition|qualification/i.test(editor.id)?"condition":"duration";}
function applyFormulaCheckResult(scope,editor,result){var value=result.ok?"通过":"未通过",status=scope.querySelector(".formula-check-status");editor.classList.toggle("input-error",!result.ok);if(activeFormulaConfig){activeFormulaConfig.checkStatus=value;}if(status){status.textContent=result.ok?formulaStatusText(value):result.message;status.className="formula-check-status "+(result.ok?"passed":"failed");}}
function checkFormulaEditor(scope,editor,showResultToast){if(!editor){return {ok:false,message:"未找到需要检查的公式"};}var expected=formulaExpectedType(editor),result=validateFormulaText(editor.value,expected);applyFormulaCheckResult(scope,editor,result);if(showResultToast){showToast(result.ok?"公式检查通过":"公式检查未通过："+result.message);}if(!result.ok){editor.focus();}return result;}
function checkAllFormulaEditors(scope){var editors=Array.from(scope.querySelectorAll(".formula-editor")),firstFailure=null;editors.forEach(function(editor){var container=editor.closest(".formula-panel,.annual-drawer-section-body")||scope,result=checkFormulaEditor(container,editor,false);if(!result.ok&&!firstFailure){firstFailure={editor:editor,result:result};}});return firstFailure?{ok:false,editor:firstFailure.editor,message:firstFailure.result.message}:{ok:true};}
function bindFormulaEditors(){document.querySelectorAll(".formula-field-button,.formula-token").forEach(function(btn){btn.onclick=function(){insertFormulaToken(btn.dataset.editor,btn.dataset.token);};});document.querySelectorAll(".formula-editor").forEach(function(editor){editor.oninput=function(){resetActiveFormulaCheck();var container=editor.closest(".formula-panel,.annual-drawer-section-body"),panel=container&&container.querySelector(".formula-test-panel");if(panel){panel.classList.remove("show");panel.innerHTML="";}};});document.querySelectorAll(".formula-check").forEach(function(btn){btn.onclick=function(){var scope=btn.closest("#ruleFormulaConditionPanel,#ruleFormulaResult,#formulaConfigBody,.annual-drawer-section-body")||document,editor=scope.querySelector(".formula-editor");checkFormulaEditor(scope,editor,true);};});document.querySelectorAll(".formula-test").forEach(function(btn){btn.onclick=function(){var scope=btn.closest("#ruleFormulaConditionPanel,#ruleFormulaResult,#formulaConfigBody,.annual-drawer-section-body")||document,editor=scope.querySelector(".formula-editor");if(!editor){return;}var expected=formulaExpectedType(editor),result=checkFormulaEditor(scope,editor,false);if(!result.ok){showToast("公式检查未通过："+result.message);return;}var panel=scope.querySelector(".formula-test-panel");if(!panel){return;}panel.innerHTML=formulaTestPanelHtml(editor,expected);panel.classList.add("show");bindFormulaTestPanel(panel,editor,expected);showToast("公式检查通过，请填写示例数据");};});}
function syncConditionSetState(list){if(!list){return;}var count=list.querySelectorAll(".structured-condition-row").length,container=list.parentElement,logic=container&&container.querySelector(".logic-row"),header=container&&container.querySelector(".condition-column-header"),subAction=container&&container.querySelector(":scope > .sub-action"),empty=list.querySelector(".empty-condition-state"),scopeClass=Array.from(list.classList).filter(function(name){return name!=="condition-list";})[0]||"",message=list.dataset.emptyMessage||"已启用申请资格，请至少新增一条条件。";if(list.dataset.required==="true"&&!count&&!empty){list.insertAdjacentHTML("afterbegin",'<div class="empty-condition-state rule-empty-state"><div><span class="rule-empty-badge">待完善</span>'+message+'</div><button type="button" class="btn add-structured-condition" data-scope="'+scopeClass+'">＋ 新增条件</button></div>');}if(count&&empty){empty.remove();}if(count&&!header){list.insertAdjacentHTML("beforebegin",'<div class="condition-column-header"><span>条件字段</span><span>运算符</span><span>条件值</span><span>操作</span></div>');}if(!count&&header){header.remove();}if(logic){logic.style.display=count>1?"flex":"none";}if(subAction){subAction.style.display=list.dataset.required==="true"&&!count?"none":"block";}}
function bindConditionRows(){
  document.querySelectorAll(".condition-field").forEach(function(select){
    select.onchange=function(){
      var row=select.closest(".structured-condition-row"),operator=row.querySelector(".condition-operator"),operators=conditionOperatorsForField(select.value),selected=operators.indexOf(operator.value)>-1?operator.value:operators[0];
      operator.innerHTML=optionListHtml(operators,selected);
      row.querySelector(".condition-value-cell").innerHTML=conditionValueCellHtml(select.value,"",selected);
      bindConditionRows();refreshRuleConditionSourceSummary();
    };
  });
  document.querySelectorAll(".condition-operator").forEach(function(select){
    select.onchange=function(){
      var row=select.closest(".structured-condition-row"),field=row.querySelector(".condition-field").value,control=row.querySelector(".condition-value"),value=collectConditionControlValue(control);
      row.querySelector(".condition-value-cell").innerHTML=conditionValueCellHtml(field,value,select.value);
      bindConditionRows();refreshRuleConditionSourceSummary();
    };
  });
  document.querySelectorAll(".gestation-control").forEach(function(control){var week=control.querySelector(".gestation-week"),day=control.querySelector(".gestation-day"),sync=function(){var dayValue=Math.max(0,Math.min(6,Number(day.value||0)));day.value=String(dayValue);control.dataset.value=week.value===""?"":String(week.value)+"周"+dayValue+"天";};week.oninput=sync;day.oninput=sync;sync();});
  document.querySelectorAll(".remove-condition").forEach(function(btn){btn.onclick=function(){var list=btn.closest(".condition-list"),annual=!!btn.closest(".annual-quota-eligibility");btn.closest(".structured-condition-row").remove();syncConditionSetState(list);if(btn.closest("#ruleEditorBody")){durationRuleEditorDirty=true;}else if(annual){planFormDirty=true;}else{markLeaveFormDirty();}bindConditionRows();refreshRuleConditionSourceSummary();};});
  document.querySelectorAll(".add-structured-condition").forEach(function(btn){btn.onclick=function(){var scope=btn.closest(".duration-rule-row,#conditionStandardPanel,#ruleEditorBody,.annual-quota-eligibility"),list=scope&&scope.querySelector("."+btn.dataset.scope);if(!list){return;}var annual=!!btn.closest(".annual-quota-eligibility"),fields=annual?annualEligibilityFields:null,empty=list.querySelector(".empty-condition-state");if(empty){empty.remove();}list.insertAdjacentHTML("beforeend",structuredConditionRowHtml(null,fields));syncConditionSetState(list);if(btn.closest("#ruleEditorBody")){durationRuleEditorDirty=true;}else if(annual){planFormDirty=true;}else{markLeaveFormDirty();}bindConditionRows();refreshRuleConditionSourceSummary();};});
  document.querySelectorAll(".condition-list").forEach(syncConditionSetState);
}
function durationRuleKind(mode){if(mode==="按周期限制使用"){return "periodic";}return "total";}
function defaultDurationRule(mode,leave){var baseConditions=[];if(mode==="按周期限制使用"){return durationRule(baseConditions,"",{kind:"periodic",cycle:"自然月",limitType:"累计时长",unit:leave.unit});}return durationRule(baseConditions,"",{kind:"total",unit:leave.unit});}
function durationRuleRowHtml(mode,r,leave){if(mode==="按周期限制使用"){return periodicDurationRowHtml(r,leave);}return totalDurationRowHtml(r,leave);}
function bindDurationRules(mode,leave){document.querySelectorAll(".remove-duration-rule").forEach(function(btn){btn.onclick=function(){var row=btn.closest(".duration-rule-row"),body=row&&row.parentElement;if(row){row.remove();}if(body&&!body.querySelector(".duration-rule-row")){body.innerHTML='<tr class="empty-duration-rules"><td colspan="5"><div class="field-note" style="text-align:center;padding:14px">尚未配置规则。</div></td></tr>';}};});document.querySelectorAll(".duration-scope-mode").forEach(function(select){select.onchange=function(){var editor=select.closest(".rule-condition-cell").querySelector(".duration-condition-editor");editor.style.display=select.value==="满足条件时"?"block":"none";};});document.querySelectorAll(".period-limit-type").forEach(function(select){select.onchange=function(){var row=select.closest(".duration-rule-row"),accumulated=row.querySelector(".period-accumulated"),count=row.querySelector(".period-count"),isCount=select.value==="申请次数＋单次时长";accumulated.style.display=isCount?"none":"flex";count.style.display=isCount?"flex":"none";};});var formulaType=document.getElementById("formulaLimitType");if(formulaType){formulaType.onchange=function(){var details=document.getElementById("formulaCountDetails");if(details){details.style.display=formulaType.value==="申请次数＋单次时长"?"block":"none";}};}var add=document.querySelector(".add-duration-rule");if(add){add.onclick=function(){var container=document.getElementById("durationRuleRows"),empty=container.querySelector(".empty-duration-rules");if(empty){empty.remove();}container.insertAdjacentHTML("beforeend",durationRuleRowHtml(mode,defaultDurationRule(mode,leave),leave));bindConditionRows();bindDurationRules(mode,leave);};}}
function bindDateRules(){document.querySelectorAll(".remove-date-rule").forEach(function(btn){btn.onclick=function(){var editor=document.getElementById("dateRulesEditor");btn.closest(".date-rule-row").remove();if(editor&&!editor.querySelector(".date-rule-row")){editor.innerHTML=dateRulesInnerHtml([]);}markLeaveFormDirty();bindDateRules();};});var add=document.querySelector(".add-date-rule");if(add){add.onclick=function(){var editor=document.getElementById("dateRulesEditor"),list=editor&&editor.querySelector(".date-rule-list");if(!editor){return;}if(!list){editor.innerHTML=dateRulesInnerHtml([null]);}else{list.insertAdjacentHTML("beforeend",dateRuleRowHtml());}markLeaveFormDirty();bindDateRules();};}}
function bindDirectChoices(scope){(scope||document).querySelectorAll(".direct-choice-group").forEach(function(group){var target=document.getElementById(group.dataset.valueTarget);if(!target){return;}group.querySelectorAll(".direct-choice-input").forEach(function(input){input.onchange=function(){if(input.disabled||group.classList.contains("is-disabled")||!input.checked){return;}target.value=input.value;target.dispatchEvent(new Event("change",{bubbles:true}));group.querySelectorAll(".direct-choice-input").forEach(function(choice){var active=choice.value===target.value;choice.checked=active;choice.closest(".direct-radio-option").classList.toggle("active",active);});};});});}
function bindConfigMode(){document.querySelectorAll(".config-mode-switch").forEach(function(group){group.querySelectorAll(".config-mode-option").forEach(function(btn){btn.onclick=function(){group.querySelectorAll(".config-mode-option").forEach(function(x){x.classList.remove("active");});btn.classList.add("active");var standard=btn.dataset.value!=="公式配置",name=group.dataset.mode;if(name==="conditionMode"){document.getElementById("conditionStandardPanel").style.display=standard?"block":"none";document.getElementById("conditionFormulaPanel").style.display=standard?"none":"block";markLeaveFormDirty();}else{document.getElementById("durationStandardPanel").style.display=standard?"block":"none";document.getElementById("durationFormulaPanel").style.display=standard?"none":"block";durationRuleEditorDirty=true;}};});});}
function markLeaveFormDirty(){leaveFormDirty=true;}
function closeLeaveForm(force){if(!force&&leaveFormDirty&&!window.confirm("当前配置尚未保存，确定离开吗？")){return false;}document.getElementById("modalMask").classList.remove("show");leaveFormDirty=false;return true;}
function bindQuotaJump(){document.querySelectorAll(".jump-quota").forEach(function(btn){btn.onclick=function(){if(closeLeaveForm(false)){switchTab(btn.dataset.tab);}};});}
function refreshEntitlementDetail(key,leave,ruleData){document.getElementById("entitlementDetail").innerHTML=entitlementDetailHtml(key,leave,ruleData);bindDurationRuleSummary(key,leave,ruleData);bindQuotaJump();}
function bindDurationRuleSummary(key,leave,ruleData){document.querySelectorAll(".duration-config-option").forEach(function(btn){btn.onclick=function(){var next=btn.dataset.durationMode;if(next===ruleData.durationMode){return;}ruleData.durationMode=next;markLeaveFormDirty();refreshEntitlementDetail(key,leave,ruleData);};});document.querySelectorAll(".edit-duration-summary").forEach(function(btn){btn.onclick=function(){openDurationRuleEditor(Number(btn.dataset.index),key,leave,ruleData);};});document.querySelectorAll(".copy-duration-summary").forEach(function(btn){btn.onclick=function(){var source=ruleData.durationRules[Number(btn.dataset.index)];if(ruleScopeType(source)==="all"){showToast("兜底规则只能配置一条，不能复制");return;}var copy=JSON.parse(JSON.stringify(source));copy.name="";ruleData.durationRules.push(copy);normalizeDurationRuleOrder(ruleData.durationRules);markLeaveFormDirty();refreshEntitlementDetail(key,leave,ruleData);showToast("规则已复制，请修改后确定");};});document.querySelectorAll(".delete-duration-summary").forEach(function(btn){btn.onclick=function(){if(!window.confirm("确定删除这条时长规则吗？")){return;}ruleData.durationRules.splice(Number(btn.dataset.index),1);markLeaveFormDirty();refreshEntitlementDetail(key,leave,ruleData);showToast("规则已删除");};});var draggedIndex=-1;document.querySelectorAll(".duration-summary-row").forEach(function(row){if(row.dataset.fixed==="true"){return;}row.ondragstart=function(e){draggedIndex=Number(row.dataset.index);row.classList.add("dragging");e.dataTransfer.effectAllowed="move";};row.ondragover=function(e){e.preventDefault();row.classList.add("drag-over");e.dataTransfer.dropEffect="move";};row.ondragleave=function(){row.classList.remove("drag-over");};row.ondrop=function(e){e.preventDefault();var targetIndex=Number(row.dataset.index);if(draggedIndex<0||targetIndex===draggedIndex){return;}var item=ruleData.durationRules.splice(draggedIndex,1)[0];ruleData.durationRules.splice(targetIndex,0,item);normalizeDurationRuleOrder(ruleData.durationRules);markLeaveFormDirty();refreshEntitlementDetail(key,leave,ruleData);showToast("规则顺序已调整");};row.ondragend=function(){document.querySelectorAll(".duration-summary-row").forEach(function(item){item.classList.remove("dragging","drag-over");});draggedIndex=-1;};});document.querySelectorAll(".add-condition-duration-summary").forEach(function(btn){btn.onclick=function(){openDurationRuleEditor(-1,key,leave,ruleData,"conditional");};});document.querySelectorAll(".add-fallback-duration-summary").forEach(function(btn){btn.onclick=function(){if((ruleData.durationRules||[]).some(function(r){return ruleScopeType(r)==="all";})){showToast("已配置兜底规则");return;}openDurationRuleEditor(-1,key,leave,ruleData,"all");};});document.querySelectorAll(".configure-duration-formula").forEach(function(btn){btn.onclick=function(){openDurationFormula(false,leave,ruleData);};});document.querySelectorAll(".check-duration-formula").forEach(function(btn){btn.onclick=function(){openDurationFormula(true,leave,ruleData);document.querySelector("#formulaConfigBody .formula-check").click();};});document.querySelectorAll(".test-duration-formula").forEach(function(btn){btn.onclick=function(){openDurationFormula(true,leave,ruleData);document.querySelector("#formulaConfigBody .formula-test").click();};});document.querySelectorAll(".clear-duration-formula").forEach(function(btn){btn.onclick=function(){if(!window.confirm("确定清除统一公式吗？")){return;}ruleData.durationFormula="";ruleData.durationFormulaCheckStatus="未检测";markLeaveFormDirty();refreshEntitlementDetail(key,leave,ruleData);};});}
function bindEntitlement(key,leave,ruleData){var mode=document.getElementById("entitlementMode"),choices=document.querySelectorAll(".entitlement-choice");if(mode&&choices.length){var previousMode=ruleData.entitlementMode;choices.forEach(function(choice){choice.onclick=function(){var nextMode=choice.dataset.value,dirtyBefore=leaveFormDirty;if(nextMode===previousMode){return;}if(((ruleData.durationRules||[]).length||ruleData.durationFormula)&&!window.confirm("切换控制方式后，当前配置将被清空。确定继续吗？")){setTimeout(function(){leaveFormDirty=dirtyBefore;},0);return;}mode.value=nextMode;ruleData.entitlementMode=nextMode;ruleData.durationMode="规则表";ruleData.durationRules=[];ruleData.durationFormula="";previousMode=nextMode;choices.forEach(function(item){item.classList.toggle("active",item.dataset.value===nextMode);});markLeaveFormDirty();refreshEntitlementDetail(key,leave,ruleData);};});}bindDurationRuleSummary(key,leave,ruleData);bindQuotaJump();}
function syncAttachmentRuleRow(row,leave){var basis=row.querySelector(".attachment-basis"),conditional=basis.value!=="所有申请",condition=row.querySelector(".attachment-condition"),allText=row.querySelector(".attachment-all-text"),unit=row.querySelector(".attachment-unit");condition.style.display=conditional?"flex":"none";allText.style.display=conditional?"none":"inline";if(unit){unit.textContent=basis.value==="休假日期跨度"?"自然日":leave.unit;}}
function renderAttachmentTypeOptions(keyword){var query=String(keyword||"").trim(),container=document.getElementById("attachmentTypeOptions"),items=attachmentTypeLibrary.filter(function(item){return item.state!=="停用"&&arrayValue(item.businesses).indexOf("考勤")>-1&&(!query||item.code.indexOf(query)>-1||item.name.indexOf(query)>-1||(item.nameEn||"").toLowerCase().indexOf(query.toLowerCase())>-1||(item.description||"").indexOf(query)>-1);});container.innerHTML=items.length?items.map(function(item){return '<label class="attachment-type-option"><input type="checkbox" value="'+item.name+'"'+(pendingAttachmentTypes.indexOf(item.name)>-1?' checked':'')+'><span><div class="attachment-type-name">'+item.name+' <small>'+item.code+'</small></div><div class="attachment-type-note">'+arrayValue(item.businesses).join("、")+(item.description?'；'+item.description:'')+'</div></span></label>';}).join(""):'<div class="attachment-type-empty" style="padding:20px;text-align:center">未找到业务包含“考勤”的启用附件类型</div>';container.querySelectorAll('input[type="checkbox"]').forEach(function(input){input.onchange=function(){if(input.checked&&pendingAttachmentTypes.indexOf(input.value)<0){pendingAttachmentTypes.push(input.value);}if(!input.checked){pendingAttachmentTypes=pendingAttachmentTypes.filter(function(item){return item!==input.value;});}};});}
function openAttachmentTypeSelector(row){activeAttachmentRuleRow=row;pendingAttachmentTypes=arrayValue(row.querySelector(".attachment-material-values").value);var search=document.getElementById("attachmentTypeSearch");search.value="";renderAttachmentTypeOptions("");document.getElementById("attachmentTypeMask").classList.add("show");search.focus();}
function closeAttachmentTypeSelector(){document.getElementById("attachmentTypeMask").classList.remove("show");activeAttachmentRuleRow=null;pendingAttachmentTypes=[];}
function applyAttachmentTypeSelection(){if(!activeAttachmentRuleRow){return;}var hidden=activeAttachmentRuleRow.querySelector(".attachment-material-values"),summary=activeAttachmentRuleRow.querySelector(".attachment-type-summary");hidden.value=pendingAttachmentTypes.join("、");summary.innerHTML=attachmentTypeSummaryHtml(pendingAttachmentTypes);markLeaveFormDirty();closeAttachmentTypeSelector();}
function attachmentTypeReferences(name){var references=[];Object.keys(unifiedRules).forEach(function(key){var leave=leaves.find(function(item){return item.key===key;}),referenced=(unifiedRules[key].attachmentRules||[]).some(function(rule){return arrayValue(rule.materials).indexOf(name)>-1;});if(referenced){var label="中国区假期方案/"+(leave?leave.name:key);if(references.indexOf(label)<0){references.push(label);}}});return references;}
function renderAttachmentManager(){
  var body=document.getElementById("attachmentManagerRows");if(!body){return;}
  var code=fieldValue("attachmentFilterCode","").trim(),name=fieldValue("attachmentFilterName","").trim(),business=fieldValue("attachmentFilterBusiness","全部"),state=fieldValue("attachmentFilterState","全部"),rows=attachmentTypeLibrary.map(function(item,index){return {item:item,index:index};}).filter(function(row){return (!code||row.item.code.indexOf(code)>-1)&&(!name||row.item.name.indexOf(name)>-1||(row.item.nameEn||"").toLowerCase().indexOf(name.toLowerCase())>-1)&&(business==="全部"||arrayValue(row.item.businesses).indexOf(business)>-1)&&(state==="全部"||row.item.state===state);});
  document.getElementById("attachmentTypeCount").textContent="共 "+rows.length+" 条";document.getElementById("attachmentPaginationTotal").textContent="共 "+rows.length+" 条";
  body.innerHTML=rows.length?rows.map(function(row){var item=row.item,index=row.index;return '<tr><td>'+escapeRuleHtml(item.code)+'</td><td><div class="multilingual-name"><b>'+escapeRuleHtml(item.name)+'</b><span class="multilingual-badge" title="支持多语言" aria-label="支持多语言"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21M12 3C9.6 5.5 8.3 8.5 8.3 12s1.3 6.5 3.7 9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span></div></td><td>'+escapeRuleHtml(arrayValue(item.businesses).join("、"))+'</td><td>'+escapeRuleHtml(item.description||"—")+'</td><td><span class="attachment-status'+(item.state==="停用"?' off':'')+'">'+item.state+'</span></td><td>'+escapeRuleHtml(item.createdBy||"—")+'</td><td>'+escapeRuleHtml(item.createdAt||"—")+'</td><td>'+escapeRuleHtml(item.updatedBy||"—")+'</td><td>'+escapeRuleHtml(item.updatedAt||"—")+'</td><td><div class="row-actions"><button type="button" class="btn-text edit-attachment-type" data-index="'+index+'">编辑</button><button type="button" class="btn-text toggle-attachment-type" data-index="'+index+'">'+(item.state==="停用"?"启用":"停用")+'</button></div></td></tr>';}).join(""):'<tr><td class="table-empty" colspan="10">没有符合条件的附件类型</td></tr>';
  body.querySelectorAll(".edit-attachment-type").forEach(function(btn){btn.onclick=function(){openAttachmentTypeEditor(Number(btn.dataset.index));};});
  body.querySelectorAll(".toggle-attachment-type").forEach(function(btn){btn.onclick=function(){var item=attachmentTypeLibrary[Number(btn.dataset.index)];if(item.state==="停用"){item.state="启用";item.updatedBy="当前用户";item.updatedAt="2026-07-29 10:00";renderAttachmentManager();showToast("启用成功");return;}var references=attachmentTypeReferences(item.name);if(references.length){showToast("当前附件类型已被【"+references.join("、")+"】引用，请解除引用后再停用");return;}openConfirm("停用附件类型","停用后将不能用于新的休假配置，请确认是否停用？",function(){item.state="停用";item.updatedBy="当前用户";item.updatedAt="2026-07-29 10:00";renderAttachmentManager();showToast("停用成功");},{confirmText:"确认",cancelText:"取消"});};});
}
function openAttachmentManager(){
  if(document.getElementById("planEditView").classList.contains("active")&&planFormDirty&&!window.confirm("当前假期方案尚未保存，离开后本次修改将丢失。是否继续？")){return;}
  editingAttachmentTypeIndex=-1;
  renderAttachmentManager();
  showView("attachments");
}
function closeAttachmentManager(){document.getElementById("attachmentManagerMask").classList.remove("show");editingAttachmentTypeIndex=-1;pendingAttachmentTypeNameEn="";}
function setAttachmentEditorChecks(id,values){var selected=arrayValue(values),group=document.getElementById(id);Array.from(group.querySelectorAll('input[type="checkbox"]')).forEach(function(input){input.checked=selected.indexOf(input.value)>-1;});}
function openAttachmentTypeEditor(index){editingAttachmentTypeIndex=index;var item=index>=0?attachmentTypeLibrary[index]:{code:"",name:"",nameEn:"",description:"",businesses:["考勤"]};pendingAttachmentTypeNameEn=item.nameEn||"";document.getElementById("attachmentTypeEditorTitle").textContent=index>=0?"编辑附件类型":"新增附件类型";document.getElementById("attachmentTypeCode").value=item.code||"";document.getElementById("attachmentTypeName").value=item.name||"";document.getElementById("attachmentTypeDescription").value=item.description||"";setAttachmentEditorChecks("attachmentTypeBusinesses",item.businesses);clearLeaveFieldError(document.getElementById("attachmentTypeName"));clearLeaveFieldError(document.getElementById("attachmentTypeBusinesses"));document.getElementById("attachmentManagerMask").classList.add("show");document.getElementById("attachmentTypeName").focus();}
function openAttachmentLanguageEditor(){document.getElementById("attachmentNameZhCn").value=fieldValue("attachmentTypeName","");document.getElementById("attachmentNameEnUs").value=pendingAttachmentTypeNameEn;document.getElementById("attachmentLanguageMask").classList.add("show");document.getElementById("attachmentNameZhCn").focus();}
function closeAttachmentLanguageEditor(){document.getElementById("attachmentLanguageMask").classList.remove("show");}
function saveAttachmentLanguageEditor(){var name=fieldValue("attachmentNameZhCn","").trim(),nameEn=fieldValue("attachmentNameEnUs","").trim();if(!name){showToast("请填写默认语言名称");return;}document.getElementById("attachmentTypeName").value=name;pendingAttachmentTypeNameEn=nameEn;closeAttachmentLanguageEditor();showToast("多语言名称已更新");}
function saveAttachmentTypeEditor(){var nameEl=document.getElementById("attachmentTypeName"),businessEl=document.getElementById("attachmentTypeBusinesses"),name=fieldValue("attachmentTypeName","").trim(),nameEn=pendingAttachmentTypeNameEn,description=fieldValue("attachmentTypeDescription","").trim(),businesses=checkedValues("attachmentTypeBusinesses"),isNew=editingAttachmentTypeIndex<0,hasError=false;clearLeaveFieldError(nameEl);clearLeaveFieldError(businessEl);if(!name){showLeaveFieldError(nameEl,"必填项不能为空");hasError=true;}if(!businesses.length){showLeaveFieldError(businessEl,"必填项不能为空");hasError=true;}var duplicate=attachmentTypeLibrary.findIndex(function(item,index){return item.name===name&&index!==editingAttachmentTypeIndex;});if(name&&duplicate>=0){showLeaveFieldError(nameEl,"附件类型名称不能重复");hasError=true;}if(hasError){var first=document.querySelector("#attachmentManagerMask .input-error");if(first){first.scrollIntoView({block:"center"});}return;}if(!isNew){Object.assign(attachmentTypeLibrary[editingAttachmentTypeIndex],{name:name,nameEn:nameEn,description:description,businesses:businesses,updatedBy:"当前用户",updatedAt:"2026-07-29 10:00"});}else{var nextCode="ATT"+String(attachmentTypeLibrary.length+1).padStart(3,"0");attachmentTypeLibrary.unshift({code:nextCode,name:name,nameEn:nameEn,description:description,businesses:businesses,state:"启用",createdBy:"当前用户",createdAt:"2026-07-29 10:00",updatedBy:"当前用户",updatedAt:"2026-07-29 10:00"});}closeAttachmentManager();renderAttachmentManager();showToast(isNew?"新增成功":"保存成功");}
function clearAttachmentValueError(row){var input=row.querySelector(".attachment-value"),message=row.querySelector(".attachment-value-error");if(input){input.classList.remove("input-error");}if(message){message.remove();}}
function showAttachmentValueError(row,message){var input=row.querySelector(".attachment-value");clearAttachmentValueError(row);input.classList.add("input-error");input.closest("td").insertAdjacentHTML("beforeend",'<div class="field-error-message attachment-value-error">'+message+'</div>');return true;}
function validateAttachmentValue(row,leave){var basis=row.querySelector(".attachment-basis").value,input=row.querySelector(".attachment-value"),text=String(input.value||"").trim(),message="";clearAttachmentValueError(row);if(basis==="所有申请"||text===""){return false;}var value=Number(text),unit=basis==="休假日期跨度"?"天":leave.unit;if(!(value>0)){message="上传条件数值必须大于0";}else if(unit==="天"&&!Number.isInteger(value)){message="按天计量时，上传条件数值仅支持整数";}return message?showAttachmentValueError(row,message):false;}
function bindAttachmentRules(leave){document.querySelectorAll(".attachment-config-row").forEach(function(row){var basis=row.querySelector(".attachment-basis"),previousBasis=basis.value,value=row.querySelector(".attachment-value");basis.onchange=function(){if(this.value!==previousBasis&&value){value.value="";}previousBasis=this.value;clearAttachmentValueError(row);syncAttachmentRuleRow(row,leave);};if(value){value.oninput=function(){clearAttachmentValueError(row);};value.onblur=function(){validateAttachmentValue(row,leave);};}syncAttachmentRuleRow(row,leave);var select=row.querySelector(".select-attachment-types");if(select){select.onclick=function(){openAttachmentTypeSelector(row);};}});document.querySelectorAll(".remove-attachment-rule").forEach(function(btn){btn.onclick=function(){var row=btn.closest(".attachment-config-row"),body=row.parentElement,container=document.getElementById("attachmentRuleBody");row.remove();markLeaveFormDirty();if(container&&!body.querySelector(".attachment-config-row")){container.innerHTML=attachmentRulesContentHtml([],leave);}bindAttachmentRules(leave);};});var add=document.querySelector(".add-attachment-rule");if(add){add.onclick=function(){var container=document.getElementById("attachmentRuleBody"),body=document.getElementById("attachmentRuleRows");if(!container){return;}if(!body){container.innerHTML=attachmentRulesContentHtml([{basis:"所有申请",operator:"大于",value:"",materials:[],requirement:"全部提供"}],leave);}else{body.insertAdjacentHTML("beforeend",attachmentRuleRowHtml(null,leave));}markLeaveFormDirty();bindAttachmentRules(leave);};}}
function collectAttachmentRules(){return Array.from(document.querySelectorAll(".attachment-config-row")).map(function(row){var basis=row.querySelector(".attachment-basis").value,materials=arrayValue(row.querySelector(".attachment-material-values").value);return {basis:basis,operator:basis==="所有申请"?"":row.querySelector(".attachment-operator").value,value:basis==="所有申请"?"":row.querySelector(".attachment-value").value,materials:materials,requirement:row.querySelector(".attachment-requirement").value};});}
function hasUnitDependentAttachmentValue(){return Array.from(document.querySelectorAll(".attachment-config-row")).some(function(row){var basis=row.querySelector(".attachment-basis"),value=row.querySelector(".attachment-value");return basis&&basis.value==="本次申请时长"&&value&&String(value.value||"").trim();});}
function clearUnitDependentAttachmentValues(ruleData){document.querySelectorAll(".attachment-config-row").forEach(function(row){var basis=row.querySelector(".attachment-basis"),value=row.querySelector(".attachment-value");if(basis&&basis.value==="本次申请时长"&&value){value.value="";}});(ruleData.attachmentRules||[]).forEach(function(item){if(item.basis==="本次申请时长"){item.value="";}});}
function currentIntervalUnitState(){return {enabled:moduleEnabled("intervalRuleBody"),value:fieldValue("intervalValue",""),unit:fieldValue("intervalUnit","自然日")};}
function syncDirectChoiceValue(targetId,value){var target=document.getElementById(targetId),group=document.querySelector('.direct-choice-group[data-value-target="'+targetId+'"]');if(target){target.value=value;}if(group){group.querySelectorAll(".direct-choice-input").forEach(function(choice){var active=choice.value===value;choice.checked=active;choice.closest(".direct-radio-option").classList.toggle("active",active);});}}
function bindUnifiedForm(key,leave,ruleData){
  bindDirectChoices(document.getElementById("leaveFormBody"));
  document.querySelectorAll(".outline-link").forEach(function(btn){btn.onclick=function(){document.querySelectorAll(".outline-link").forEach(function(x){x.classList.remove("active");});btn.classList.add("active");document.getElementById("leaveSection"+btn.dataset.section).scrollIntoView({block:"start"});};});
  document.querySelectorAll(".module-toggle,.inline-rule-toggle").forEach(function(btn){btn.onclick=function(){var on=btn.classList.toggle("on");btn.setAttribute("aria-pressed",String(on));document.getElementById(btn.dataset.target).style.display=on?"block":"none";markLeaveFormDirty();};});
  var unit=document.getElementById("leaveUnit");
  if(unit){var previousUnit=leave.unit;
  function syncUnitPresentation(){
    var isHour=unit.value==="小时",hourFields=document.getElementById("hourCalculationFields");
    if(hourFields){hourFields.style.display=isHour?"":"none";}
    ["leaveMin","leaveMax"].forEach(function(id){
      var input=document.getElementById(id),field=input&&input.closest(".business-field"),suffix=input&&input.closest(".input-with-suffix")&&input.closest(".input-with-suffix").querySelector(".input-suffix");
      if(suffix){suffix.textContent="小时";}
      if(field){
        var tip="用于校验一张休假单汇总后的休假工时。",required=id==="leaveMin"?'<span class="required">*</span>':"";
        field.querySelector(".form-label").innerHTML=required+(id==="leaveMin"?"单次最小时长":"单次最大时长")+' <span class="hint" data-tip="'+tip+'">?</span>';
      }
    });
    var dayMax=document.getElementById("dayMax"),dayField=dayMax&&dayMax.closest(".business-field");
    if(dayField){var dailyTip='同一天最多计入的休假小时数；每日试算结果不得超过该上限。';dayField.querySelector(".form-label").innerHTML='<span class="required">*</span>日最大时长 <span class="hint" data-tip="'+dailyTip+'">?</span>';}
    var summary=document.getElementById("unitLinkageSummary");
    if(summary){summary.textContent=isHour?"员工按小时申请；单次最小、单次最大和日最大时长均按小时校验。":"员工按天申请；单次最小、单次最大和日最大时长均按小时校验。";}
  }
  function applyUnitChange(nextUnit,intervalState){
    var linkageResult=LeaveUnitLinkage.clearUnitDependentValues(ruleData,intervalState,nextUnit);
    syncDirectChoiceValue("leaveUnit",nextUnit);
    clearUnitDependentAttachmentValues(linkageResult.ruleData);
    var intervalValue=document.getElementById("intervalValue"),intervalUnit=document.getElementById("intervalUnit");
    if(intervalValue){intervalValue.value=linkageResult.interval.value;}
    if(intervalUnit){intervalUnit.value=linkageResult.interval.unit;}
    leave.unit=nextUnit;
    previousUnit=nextUnit;
    syncUnitPresentation();
    refreshEntitlementDetail(key,leave,ruleData);
    document.querySelectorAll(".attachment-config-row").forEach(function(row){syncAttachmentRuleRow(row,leave);});
    var intervalSelect=document.getElementById("intervalUnit");
    if(intervalSelect){var units=intervalUnitOptions(leave.unit),current=units.indexOf(intervalSelect.value)>-1?intervalSelect.value:"自然日";intervalSelect.innerHTML=optionListHtml(units,current);}
    markLeaveFormDirty();
  }
  unit.onchange=function(){
    var nextUnit=this.value,dirtyBefore=leaveFormDirty;
    if(nextUnit===previousUnit){return;}
    var intervalState=currentIntervalUnitState();
    ruleData.attachmentRules=collectAttachmentRules();
    var hasAffectedValues=LeaveUnitLinkage.hasUnitDependentValues(ruleData,intervalState,nextUnit);
    if(hasAffectedValues){
      syncDirectChoiceValue("leaveUnit",previousUnit);
      setTimeout(function(){leaveFormDirty=dirtyBefore;},0);
      openConfirm("修改计量单位","修改计量单位后，使用原计量单位配置的时长值将被清空，系统不会自动进行天、小时换算。是否继续？",function(){applyUnitChange(nextUnit,intervalState);},{confirmText:"确认修改",cancelText:"取消"});
      return;
    }
    applyUnitChange(nextUnit,intervalState);
  };
  syncUnitPresentation();}
  var pre=document.getElementById("preposHolidayGroup"),strong=document.getElementById("unifiedStrongControl");
  if(pre&&strong){var controlRow=document.getElementById("preleaveControlRow"),sync=function(){var hidden=checkedValues("preposHolidayGroup").length===0;if(hidden){strong.checked=false;}if(controlRow){controlRow.style.display=hidden?"none":"flex";}};pre.querySelectorAll("input").forEach(function(x){x.onchange=sync;});sync();}
  bindEntitlement(key,leave,ruleData);bindConditionRows();bindDateRules();bindAttachmentRules(leave);bindConfigMode();bindFormulaEditors();bindQualificationFormulaActions();bindSimpleRemoveActions();
}
function bindSimpleRemoveActions(){document.querySelectorAll(".remove-application-field").forEach(function(btn){btn.onclick=function(){btn.closest("tr").remove();};});}

function fieldValue(id,fallback){var x=document.getElementById(id);return x?x.value:fallback;}
function checkedValues(id){var group=document.getElementById(id);return group?Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map(function(x){return x.value;}):[];}
function moduleEnabled(target){var btn=document.querySelector('[data-target="'+target+'"]');return !!(btn&&btn.classList.contains("on"));}
function selectedConfigMode(name,fallback){var active=document.querySelector('.config-mode-switch[data-mode="'+name+'"] .config-mode-option.active');return active?active.dataset.value:fallback;}
function collectConditionControlValue(control){if(!control){return "";}if(control.classList.contains("gestation-control")){return control.dataset.value;}if(control.multiple){return Array.from(control.selectedOptions).map(function(x){return x.value;}).join("、");}return control.value;}
function collectConditionSet(container){if(!container){return [];}return Array.from(container.querySelectorAll(":scope > .structured-condition-row")).map(function(row){var control=row.querySelector(".condition-value"),value=collectConditionControlValue(control);return {field:row.querySelector(".condition-field").value,operator:row.querySelector(".condition-operator").value,value:value};}).filter(function(x){return x.field&&(!conditionNeedsValue(x.operator)||x.value!=="");});}
function collectDurationRules(leave,mode){return Array.from(document.querySelectorAll("#durationRuleRows .duration-rule-row")).map(function(row){var editor=row.querySelector(".duration-condition-editor"),scope=row.querySelector(".duration-scope-mode"),logic=editor&&editor.querySelector(".condition-logic"),conditions=scope&&scope.value==="满足条件时"?collectConditionSet(editor.querySelector(".duration-condition-list")):[],base={kind:durationRuleKind(mode),logic:logic?logic.value:"同时满足全部条件（且）",conditions:conditions};if(mode==="按周期限制使用"){var limitType=row.querySelector(".period-limit-type").value;if(limitType==="申请次数＋单次时长"){return Object.assign(base,{cycle:row.querySelector(".period-cycle").value,limitType:limitType,maxTimes:row.querySelector(".period-max-times").value,singleDuration:row.querySelector(".period-single-duration").value,unit:leave.unit,duration:""});}return Object.assign(base,{cycle:row.querySelector(".period-cycle").value,limitType:limitType,duration:row.querySelector(".period-cap-value").value,unit:leave.unit,maxTimes:"",singleDuration:""});}return Object.assign(base,{duration:row.querySelector(".duration-value").value,unit:leave.unit});});}
function collectDateRules(){return Array.from(document.querySelectorAll(".date-rule-row")).map(function(row){return {target:row.querySelector(".date-target").value,relation:row.querySelector(".date-relation").value,reference:row.querySelector(".date-reference").value,offset:row.querySelector(".date-offset").value,unit:row.querySelector(".date-unit").value};});}
function collectUnifiedRule(previous,leave){
  var next=Object.assign(defaultRule(),previous||{}),mode=fieldValue("entitlementMode",next.entitlementMode);
  next.entitlementMode=mode;next.durationMode=(activeLeaveRuleDraft&&activeLeaveRuleDraft.durationMode)||next.durationMode||"规则表";next.durationRules=["按总可休时长控制","按周期限制使用"].indexOf(mode)>-1?(previous.durationRules||[]):[];next.durationFormula=(activeLeaveRuleDraft&&activeLeaveRuleDraft.durationFormula)||"";
  next.applicationFields=[];next.conditionEnabled=moduleEnabled("applicationConditionBody");next.conditionMode=selectedConfigMode("conditionMode","常规条件");
  var eligibility=document.querySelector(".eligibility-condition-list");
  next.conditionLogic=eligibility&&eligibility.closest("#conditionStandardPanel")?eligibility.closest("#conditionStandardPanel").querySelector(".condition-logic").value:next.conditionLogic;next.conditions=eligibility?collectConditionSet(eligibility):[];next.conditionFormula=(activeLeaveRuleDraft&&activeLeaveRuleDraft.conditionFormula)||next.conditionFormula;
  next.leaveDateEnabled=moduleEnabled("leaveDateRuleBody");next.leaveDateRules=next.leaveDateEnabled?collectDateRules():[];
  delete next.submissionEnabled;delete next.allowRetroactive;delete next.retroDeadlineMode;delete next.retroRef;delete next.retroValue;delete next.retroUnit;
  next.usageMode=fieldValue("mustCompleteOnce","可分次申请")==="必须一次申请完"?"必须一次性休完":"允许分次休完";next.continuousLeave=next.usageMode==="必须一次性休完"?"是":"否";delete next.linkedLeaveEnabled;delete next.linkedLeaveType;
  next.intervalEnabled=moduleEnabled("intervalRuleBody");next.intervalValue=next.intervalEnabled?fieldValue("intervalValue",""):"";next.intervalUnit=next.intervalEnabled?fieldValue("intervalUnit","自然日"):"自然日";
  next.frequencyEnabled=false;next.frequencyLimit="";
  next.attachmentEnabled=moduleEnabled("attachmentRuleBody");next.attachmentRules=next.attachmentEnabled?collectAttachmentRules():[];
  delete next.supplement;delete next.invalidAction;
  next.policyEnabled=moduleEnabled("unifiedPolicyBody");next.policyNotice=fieldValue("unifiedPolicyNotice","");return next;
}

function leaveFieldErrorTarget(el){if(!el){return null;}if(el.type==="hidden"){return document.querySelector('.direct-choice-group[data-value-target="'+el.id+'"]')||el;}return el;}
function clearLeaveFieldError(el){if(!el){return;}var target=leaveFieldErrorTarget(el),field=el.closest(".business-field");if(target){target.classList.remove("input-error");}if(field){field.querySelectorAll(".input-error").forEach(function(item){item.classList.remove("input-error");});field.querySelectorAll(":scope > .field-error-message").forEach(function(message){message.remove();});}}
function showLeaveFieldError(el,message){if(!el){return;}clearLeaveFieldError(el);var target=leaveFieldErrorTarget(el),field=el.closest(".business-field");if(target){target.classList.add("input-error");}if(field){field.insertAdjacentHTML("beforeend",'<div class="field-error-message">'+message+'</div>');}}
function focusFirstLeaveFormError(){var first=document.querySelector("#leaveFormBody .input-error");if(first){first.scrollIntoView({behavior:"smooth",block:"center"});if(typeof first.focus==="function"){first.focus({preventScroll:true});}}}
function clearLeaveFormErrors(){document.querySelectorAll("#leaveFormBody .input-error").forEach(function(el){el.classList.remove("input-error");});document.querySelectorAll("#leaveFormBody .field-error-message").forEach(function(el){el.remove();});}
function requireLeaveField(id){var el=document.getElementById(id);if(!el||!String(el.value||"").trim()||el.value==="请选择"){if(el){showLeaveFieldError(el,"必填项不能为空");}return true;}return false;}
function validateLeaveTypeDuplicate(){var el=document.getElementById("leaveTypeSelect"),value=el&&el.value;if(!el||!value||value==="请选择"){return false;}var duplicate=leaves.some(function(item){return item.key!==editingLeaveKey&&item.name===value;});if(duplicate){showLeaveFieldError(el,"不能重复添加休假类型");return true;}clearLeaveFieldError(el);return false;}
function validateBasicNumericField(id){
  var el=document.getElementById(id),text=el&&String(el.value||"").trim();
  if(!el||text===""){return false;}
  var value=Number(text),message="";
  if(id==="leaveMin"){
    if(!(value>0)){message="单次最小时长必须大于0";}
  }else if(id==="leaveMax"){
    var min=Number(fieldValue("leaveMin",""));
    if(!(value>0)){message="单次最大时长必须大于0";}
    else if(Number.isFinite(min)&&value<min){message="单次最大时长不得小于单次最小时长";}
  }else if(id==="dayMax"&&!(value>0)){message="日最大时长必须大于0";}
  else if(id==="roundingBase"&&!(value>0)){message="舍位基数必须大于0";}
  if(message){showLeaveFieldError(el,message);return true;}
  clearLeaveFieldError(el);return false;
}
function validateLeaveForm(ruleData){
  clearLeaveFormErrors();
  var checks=["leaveTypeSelect","leaveUnit","paidSettingUnified","balanceLimit","leaveMin","calcType","dayMax","entitlementMode"];
  if(fieldValue("leaveUnit","小时")==="小时"){checks.push("roundingBase","roundingType");}
  var hasRequiredError=false;checks.forEach(function(id){if(requireLeaveField(id)){hasRequiredError=true;}});if(hasRequiredError){focusFirstLeaveFormError();return "__INLINE__";}
  if(validateLeaveTypeDuplicate()){focusFirstLeaveFormError();return "__INLINE__";}
  var numericChecks=["leaveMin","leaveMax","dayMax"];
  if(fieldValue("leaveUnit","小时")==="小时"){numericChecks.push("roundingBase");}
  for(var numericIndex=0;numericIndex<numericChecks.length;numericIndex+=1){if(validateBasicNumericField(numericChecks[numericIndex])){focusFirstLeaveFormError();return "__INLINE__";}}
  var entitlementMode=fieldValue("entitlementMode","");
  if(["按总可休时长控制","按周期限制使用"].indexOf(entitlementMode)>-1){if(ruleData.durationMode==="统一公式"){if(!String(ruleData.durationFormula||"").trim()){return "请配置可休时长公式";}}else{var result=checkDurationRuleSet(ruleData.durationRules||[]);if(result.level==="error"){return result.text;}var incomplete=(ruleData.durationRules||[]).find(function(r){if(entitlementMode==="按周期限制使用"&&r.limitType==="申请次数＋单次时长"){return !String(r.maxTimes||"").trim()||!String(r.singleDuration||"").trim();}return !String(r.duration||"").trim();});if(incomplete){return "请完整配置每条规则的“最多可休”";}}}
  if(moduleEnabled("applicationConditionBody")){var mode=selectedConfigMode("conditionMode","常规条件");if(mode==="公式配置"&&!String((activeLeaveRuleDraft&&activeLeaveRuleDraft.conditionFormula)||"").trim()){return "请配置资格公式";}if(mode!=="公式配置"&&!collectConditionSet(document.querySelector(".eligibility-condition-list")).length){return "请完整填写申请资格条件";}}
  if(moduleEnabled("leaveDateRuleBody")){var dateRows=Array.from(document.querySelectorAll(".date-rule-row"));if(!dateRows.length){return "请至少新增一条日期规则";}if(dateRows.some(function(row){return row.querySelector(".date-target").value==="请选择"||row.querySelector(".date-relation").value==="请选择"||row.querySelector(".date-reference").value==="请选择"||!String(row.querySelector(".date-offset").value||"").trim();})){return "请完整填写日期规则";}}
  if(moduleEnabled("intervalRuleBody")){var intervalMessage=requireLeaveField("intervalValue","请填写两次同类休假的最小间隔");if(intervalMessage){return intervalMessage;}intervalMessage=requireLeaveField("intervalUnit","请选择间隔单位");if(intervalMessage){return intervalMessage;}}
  if(moduleEnabled("attachmentRuleBody")){var attachmentRows=Array.from(document.querySelectorAll(".attachment-config-row"));if(!attachmentRows.length){return "请至少新增一条材料规则";}for(var j=0;j<attachmentRows.length;j++){var row=attachmentRows[j],basis=row.querySelector(".attachment-basis").value,valueInput=row.querySelector(".attachment-value"),valueText=String(valueInput.value||"").trim(),materials=arrayValue(row.querySelector(".attachment-material-values").value);if(basis!=="所有申请"&&!valueText){showAttachmentValueError(row,"必填项不能为空");return "__INLINE__";}if(validateAttachmentValue(row,{unit:fieldValue("leaveUnit","小时")})){return "__INLINE__";}if(!materials.length){return "请为每条材料规则至少选择一种附件类型";}var unavailable=materials.find(function(name){var type=attachmentTypeLibrary.find(function(item){return item.name===name;});return !type||type.state!=="启用"||arrayValue(type.businesses).indexOf("考勤")<0;});if(unavailable){return "附件类型“"+unavailable+"”已停用或业务不包含考勤，请替换后再保存";}}}
  if(moduleEnabled("unifiedPolicyBody")&&!String(fieldValue("unifiedPolicyNotice","")).trim()){return "请填写员工申请时展示的政策说明";}return "";
}

function openScopeExplanation(){var drawer=document.getElementById("drawer");document.getElementById("drawerTitle").textContent="适用范围匹配方式";drawer.dataset.context="guide";drawer.classList.remove("option-guide");drawer.classList.add("narrow");document.getElementById("confirmRules").textContent="确定";document.getElementById("drawerMask").style.zIndex="100";document.getElementById("drawerBody").innerHTML='<div class="notice">方案适用范围用于确定员工在指定日期使用哪套假期方案。</div><div class="boundary-text"><b>匹配字段</b><br>按员工类型、用工形式等员工档案字段匹配。<br><br><b>匹配规则</b><br>同一员工在同一日期只能命中一套有效方案。只影响某种休假类型的地区政策，在对应休假类型中维护。</div>';document.getElementById("drawerMask").classList.add("show");}
function closeDrawer(){document.getElementById("drawerMask").classList.remove("show");document.getElementById("drawerMask").style.zIndex="100";var drawer=document.getElementById("drawer");drawer.classList.remove("option-guide","narrow","help-mode");drawer.dataset.context="";document.getElementById("confirmRules").textContent="确定";}
function showToast(text){var t=document.getElementById("toast");t.textContent=text;t.classList.add("show");setTimeout(function(){t.classList.remove("show");},1800);}
function showPlanPageBanner(text){var banner=document.getElementById("planPageBanner");if(!banner){return;}banner.textContent=text;banner.classList.add("show");banner.scrollIntoView({block:"nearest"});}
function hidePlanPageBanner(){var banner=document.getElementById("planPageBanner");if(banner){banner.classList.remove("show");banner.textContent="";}}
function markRuleEditorError(selector){var el=document.querySelector(selector);if(el){el.classList.add("input-error");}}
function clearRuleEditorErrors(){document.querySelectorAll("#ruleEditorBody .input-error").forEach(function(el){el.classList.remove("input-error");});document.querySelectorAll("#ruleEditorBody .field-error-message").forEach(function(el){el.remove();});}
function showRuleEditorFieldError(id,message){var el=document.getElementById(id);if(el){showLeaveFieldError(el,message);}return true;}
function validateDurationRuleNumericField(id){
  if(!activeDurationRuleEditor){return false;}
  var el=document.getElementById(id),text=el&&String(el.value||"").trim();
  if(!el||text===""){return false;}
  var value=Number(text),unit=activeDurationRuleEditor.leave.unit,message="";
  if(id==="ruleMaxTimes"){
    if(!(value>0)&&Number.isFinite(value)||!Number.isInteger(value)){message="申请次数上限必须为正整数";}
  }else if(id==="ruleSingleDuration"){
    if(!(value>0)){message="单次上限必须大于0";}
    else if(unit==="天"&&!Number.isInteger(value)){message="按天计量时，单次上限仅支持整数";}
  }else if(id==="ruleDuration"){
    var label=activeDurationRuleEditor.mode==="按周期限制使用"?"周期上限":"最多可休";
    if(value<0){message=label+"不能小于0";}
    else if(unit==="天"&&!Number.isInteger(value)){message="按天计量时，"+label+"仅支持整数";}
  }
  if(message){return showRuleEditorFieldError(id,message);}
  clearLeaveFieldError(el);return false;
}
function validateEditedDurationRule(edited){
  clearRuleEditorErrors();
  if(edited.scopeType==="conditional"){
    if(edited.conditionMode==="条件公式"){
      var conditionFormulaResult=validateFormulaText(edited.conditionFormula,"condition");
      if(!conditionFormulaResult.ok){markRuleEditorError("#ruleConditionFormula");return conditionFormulaResult.message;}
    }else{
      var incomplete=(edited.conditions||[]).some(function(c){return !c.field||!c.operator||(conditionNeedsValue(c.operator)&&!String(c.value||"").trim());});
      if(incomplete){document.querySelectorAll("#ruleEditorConditions .condition-value").forEach(function(el){if(!String(el.value||"").trim()){el.classList.add("input-error");}});return "请完整填写时长条件";}
    }
  }
  if(edited.resultMode==="公式计算"){
    var durationFormulaResult=validateFormulaText(edited.formula,"duration");
    if(!durationFormulaResult.ok){markRuleEditorError("#ruleDurationFormula");return durationFormulaResult.message;}
  }else if(activeDurationRuleEditor.mode==="按周期限制使用"&&edited.limitType==="申请次数＋单次时长"){
    var countRequired=false;
    if(!String(edited.maxTimes||"").trim()){showRuleEditorFieldError("ruleMaxTimes","必填项不能为空");countRequired=true;}
    if(!String(edited.singleDuration||"").trim()){showRuleEditorFieldError("ruleSingleDuration","必填项不能为空");countRequired=true;}
    if(countRequired){return "__INLINE__";}
    if(validateDurationRuleNumericField("ruleMaxTimes")||validateDurationRuleNumericField("ruleSingleDuration")){return "__INLINE__";}
  }else{
    if(!String(edited.duration||"").trim()){showRuleEditorFieldError("ruleDuration","必填项不能为空");return "__INLINE__";}
    if(validateDurationRuleNumericField("ruleDuration")){return "__INLINE__";}
  }
  var ctx=activeDurationRuleEditor,testRules=ctx.ruleData.durationRules.map(function(r){return JSON.parse(JSON.stringify(r));});
  if(ctx.index>=0){testRules[ctx.index]=edited;}else{testRules.push(edited);}
  normalizeDurationRuleOrder(testRules);
  var result=checkDurationRuleSet(testRules);
  if(result.level==="error"){return result.text;}
  return "";
}

document.querySelectorAll(".tab").forEach(function(tab){tab.onclick=function(){switchTab(tab.dataset.tab);};});
document.getElementById("controlLayerHelp").onclick=function(){openAnnualHelpDrawer("假期方案配置层级",controlLayerHelpHtml());};
var scopeRuleLink=document.querySelector(".rule-link");if(scopeRuleLink){scopeRuleLink.onclick=openScopeExplanation;}
document.querySelectorAll("[data-close='drawer']").forEach(function(x){x.onclick=closeDrawer;});
document.querySelectorAll("[data-close='modal']").forEach(function(x){x.onclick=function(){closeLeaveForm(false);};});
document.querySelectorAll("[data-close='rule-editor']").forEach(function(x){x.onclick=function(){closeDurationRuleEditor(false);};});
document.querySelectorAll("[data-close='formula-config']").forEach(function(x){x.onclick=closeFormulaConfig;});
document.querySelectorAll("[data-close='attachment-type']").forEach(function(x){x.onclick=closeAttachmentTypeSelector;});
document.querySelectorAll("[data-close='attachment-manager']").forEach(function(x){x.onclick=closeAttachmentManager;});
document.getElementById("attachmentTypeSearch").oninput=function(){renderAttachmentTypeOptions(this.value);};
document.getElementById("confirmAttachmentTypes").onclick=applyAttachmentTypeSelection;
document.getElementById("attachmentTypesMenu").onclick=openAttachmentManager;
document.getElementById("addAttachmentType").onclick=function(){openAttachmentTypeEditor(-1);};
document.getElementById("cancelAttachmentTypeEdit").onclick=closeAttachmentManager;
document.getElementById("saveAttachmentTypeEdit").onclick=saveAttachmentTypeEditor;
document.getElementById("attachmentNameLanguageButton").onclick=openAttachmentLanguageEditor;
document.getElementById("closeAttachmentLanguage").onclick=closeAttachmentLanguageEditor;
document.getElementById("cancelAttachmentLanguage").onclick=closeAttachmentLanguageEditor;
document.getElementById("saveAttachmentLanguage").onclick=saveAttachmentLanguageEditor;
document.getElementById("attachmentLanguageMask").onclick=function(e){if(e.target===this){closeAttachmentLanguageEditor();}};
document.getElementById("queryAttachmentTypes").onclick=renderAttachmentManager;
document.getElementById("resetAttachmentFilter").onclick=function(){document.getElementById("attachmentFilterCode").value="";document.getElementById("attachmentFilterName").value="";document.getElementById("attachmentFilterBusiness").value="全部";document.getElementById("attachmentFilterState").value="全部";renderAttachmentManager();};
document.getElementById("exportAttachmentTypes").onclick=function(){showToast("已按当前查询结果导出附件类型");};
document.getElementById("exportAttachmentTypeSettings").onclick=function(){showToast("导出字段：编码、名称、业务、描述、适用状态及创建修改信息");};
document.getElementById("addLeave").onclick=function(){openLeaveForm("");};
document.getElementById("leaveFormBody").addEventListener("input",function(e){clearLeaveFieldError(e.target);});
document.getElementById("leaveFormBody").addEventListener("change",function(e){if(e.target.id==="leaveTypeSelect"){validateLeaveTypeDuplicate();}else{clearLeaveFieldError(e.target);}});
document.getElementById("leaveFormBody").addEventListener("focusout",function(e){if(["leaveMin","leaveMax","dayMax","roundingBase"].indexOf(e.target.id)>-1){validateBasicNumericField(e.target.id);}});
document.getElementById("confirmAdd").onclick=function(){var message=validateLeaveForm(activeLeaveRuleDraft||defaultRule());if(message){if(message!=="__INLINE__"){showToast(message);}return;}var name=fieldValue("leaveTypeSelect",""),isEdit=!!editingLeaveKey,key=isEdit?editingLeaveKey:"custom"+Date.now(),leave=isEdit?leaves.find(function(x){return x.key===key;}):{key:key,name:name,state:"启用",prerequisite:"无",strong:"—"};var prerequisites=checkedValues("preposHolidayGroup"),strong=document.getElementById("unifiedStrongControl");leave.name=name;leave.unit=fieldValue("leaveUnit","小时");leave.min=fieldValue("leaveMin","");leave.max=fieldValue("leaveMax","");leave.calc=fieldValue("calcType","考勤日");leave.daily=fieldValue("dayMax","8");leave.paid=fieldValue("paidSettingUnified","是");leave.balanceLimit=fieldValue("balanceLimit","否");leave.prerequisite=prerequisites.length?prerequisites.join("、"):"无";leave.strong=prerequisites.length?(strong&&strong.checked?"是":"否"):"—";leave.roundBase=fieldValue("roundingBase","0.5");leave.round=fieldValue("roundingType","向上取整");unifiedRules[key]=collectUnifiedRule(activeLeaveRuleDraft||defaultRule(),leave);(unifiedRules[key].durationRules||[]).forEach(function(item){item.unit=leave.unit;});if(!isEdit){leaves.push(leave);}renderLeaves();leaveFormDirty=false;planFormDirty=true;closeLeaveForm(true);showToast(isEdit?"保存成功":"新增成功");};
document.getElementById("saveDurationRule").onclick=function(){if(!activeDurationRuleEditor){return;}var ctx=activeDurationRuleEditor,edited=collectEditedDurationRule(),message=validateEditedDurationRule(edited);if(message){if(message!=="__INLINE__"){showToast(message);}return;}var isEdit=ctx.index>=0;if(isEdit){ctx.ruleData.durationRules[ctx.index]=edited;}else{ctx.ruleData.durationRules.push(edited);}normalizeDurationRuleOrder(ctx.ruleData.durationRules);var key=ctx.key,leave=ctx.leave,ruleData=ctx.ruleData;markLeaveFormDirty();closeDurationRuleEditor(true);refreshEntitlementDetail(key,leave,ruleData);showToast(ruleScopeType(edited)==="all"?"兜底规则已固定在规则列表最后":(isEdit?"条件规则修改已保存":"条件规则已添加"));};
document.getElementById("confirmRules").onclick=function(){var context=document.getElementById("drawer").dataset.context,scope=document.getElementById("drawerBody");if(context&&context.indexOf("annual")===0&&scope.querySelector(".formula-editor")){var checked=checkAllFormulaEditors(scope);if(!checked.ok){showToast("公式检查未通过："+checked.message);return;}}closeDrawer();showToast(context&&context.indexOf("annual")===0?"年假规则配置已保存":"规则说明已关闭");};
document.getElementById("drawerMask").onclick=function(e){if(e.target===this){closeDrawer();}};
document.getElementById("modalMask").onclick=function(e){if(e.target===this){closeLeaveForm(false);}};
document.getElementById("ruleEditorMask").onclick=function(e){if(e.target===this){closeDurationRuleEditor();}};
document.getElementById("formulaConfigMask").onclick=function(e){if(e.target===this){closeFormulaConfig();}};
document.getElementById("attachmentTypeMask").onclick=function(e){if(e.target===this){closeAttachmentTypeSelector();}};
document.getElementById("attachmentManagerMask").onclick=function(e){if(e.target===this){closeAttachmentManager();}};
document.getElementById("navPlans").onclick=function(e){e.preventDefault();if(document.getElementById("attachmentListView").classList.contains("active")){showView("list");return;}cancelPlanEditor();};
document.getElementById("addPlan").onclick=function(){openPlanEditor("",true);};
document.getElementById("savePlan").onclick=savePlan;
document.getElementById("cancelPlanEdit").onclick=cancelPlanEditor;
document.getElementById("planNameLanguageButton").onclick=openPlanLanguageEditor;
document.getElementById("closePlanLanguage").onclick=closePlanLanguageEditor;
document.getElementById("cancelPlanLanguage").onclick=closePlanLanguageEditor;
document.getElementById("savePlanLanguage").onclick=savePlanLanguageEditor;
document.getElementById("planLanguageMask").onclick=function(e){if(e.target===this){closePlanLanguageEditor();}};
document.querySelectorAll(".plan-edit-field,#planRegions input,#planApplyScopes input,#planPersonnelTypes input,#planEmployeeTypes input").forEach(function(x){
  x.oninput=function(){
    if(x.id==="planName"){editingPlanNames.zh_CN=x.value;}
    planFormDirty=true;
  };
  x.onchange=function(){
    if(x.id==="planName"){editingPlanNames.zh_CN=x.value;}
    planFormDirty=true;
  };
});
bindEnumMultiSelect("planRegions");bindEnumMultiSelect("planApplyScopes");bindEnumMultiSelect("planPersonnelTypes");bindEnumMultiSelect("planEmployeeTypes");
document.getElementById("planEditView").addEventListener("input",function(){planFormDirty=true;});document.getElementById("planEditView").addEventListener("change",function(){planFormDirty=true;});
document.getElementById("queryPlans").onclick=renderPlans;
document.getElementById("resetPlanFilter").onclick=function(){document.getElementById("planFilterName").value="";["planFilterRegion","planFilterPersonnel","planFilterEmployee","planFilterState"].forEach(function(id){document.getElementById(id).value="全部";});renderPlans();};
document.querySelectorAll(".table-filter-trigger").forEach(function(btn){btn.onclick=function(e){e.stopPropagation();openLeaveFilterPopover(btn.dataset.filter,btn);};});
document.getElementById("leaveFilterPopover").onclick=function(e){e.stopPropagation();};
document.getElementById("versionPopover").onclick=function(e){e.stopPropagation();};
document.addEventListener("click",function(){closeLeaveFilterPopover();closeVersionPopover();closeEnumMultiSelects();});
document.getElementById("saveFormulaConfig").onclick=function(){if(!activeFormulaConfig||activeFormulaConfig.readonly){return;}var scope=document.getElementById("formulaConfigBody"),editor=scope.querySelector(".formula-editor"),checked=checkFormulaEditor(scope,editor,false);if(!checked.ok){showToast("公式检查未通过："+checked.message);return;}if(activeFormulaConfig.kind==="duration"){var durationValue=fieldValue("durationFormulaDraft","").trim(),formulaRule=activeFormulaConfig.rule,formulaLeave=activeFormulaConfig.leave;formulaRule.durationFormula=durationValue;formulaRule.durationFormulaCheckStatus="通过";markLeaveFormDirty();closeFormulaConfig();refreshEntitlementDetail(editingLeaveKey,formulaLeave,formulaRule);showToast("可休时长公式已检查并保存");return;}var value=fieldValue("qualificationFormulaDraft","").trim();activeLeaveRuleDraft.conditionFormula=value;activeLeaveRuleDraft.conditionFormulaCheckStatus="通过";markLeaveFormDirty();closeFormulaConfig();renderQualificationFormulaSummary();showToast("资格公式已检查并保存");};
document.getElementById("closeConfirm").onclick=closeConfirm;document.getElementById("cancelConfirm").onclick=closeConfirm;document.getElementById("confirmMask").onclick=function(e){if(e.target===this){closeConfirm();}};document.getElementById("confirmAction").onclick=function(){var action=pendingConfirmAction;closeConfirm();if(action){action();}};
renderPlans();renderLeaves();["annual","comp","sick"].forEach(renderBoundary);
