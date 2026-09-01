(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports){module.exports=api;}
  root.LeaveUnitLinkage=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  function hasText(value){return String(value==null?"":value).trim()!=="";}

  function hasUnitDependentValues(ruleData,interval,nextUnit){
    var data=ruleData||{};
    if(hasText(data.durationFormula)){return true;}
    if((data.durationRules||[]).some(function(rule){
      return hasText(rule.duration)||hasText(rule.singleDuration)||hasText(rule.formula);
    })){return true;}
    if((data.attachmentRules||[]).some(function(rule){
      return rule.basis==="本次申请时长"&&hasText(rule.value);
    })){return true;}
    return nextUnit==="天"&&interval&&interval.enabled&&interval.unit==="小时"&&hasText(interval.value);
  }

  function clearUnitDependentValues(ruleData,interval,nextUnit){
    var data=ruleData||{};
    data.durationFormula="";
    data.durationFormulaCheckStatus="未检测";
    (data.durationRules||[]).forEach(function(rule){
      rule.duration="";
      rule.singleDuration="";
      if(hasText(rule.formula)){
        rule.formula="";
        rule.formulaCheckStatus="未检测";
      }
      rule.unit=nextUnit;
    });
    (data.attachmentRules||[]).forEach(function(rule){
      if(rule.basis==="本次申请时长"){rule.value="";}
    });
    var nextInterval={
      enabled:!!(interval&&interval.enabled),
      value:interval&&interval.value!=null?String(interval.value):"",
      unit:interval&&interval.unit?interval.unit:"自然日"
    };
    if(nextUnit==="天"&&nextInterval.unit==="小时"){
      nextInterval.value="";
      nextInterval.unit="自然日";
    }
    return {ruleData:data,interval:nextInterval};
  }

  return {
    hasUnitDependentValues:hasUnitDependentValues,
    clearUnitDependentValues:clearUnitDependentValues
  };
});
