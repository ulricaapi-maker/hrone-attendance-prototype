/* Mirror the inspected OEHR decision order. Sample clock windows are supplied separately. */
(function(root){
 'use strict';
 function resolve(start,end,days){
  const [previous,today,next]=days;
  if(!today||!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return null;
  if(today.working&&start>=today.from&&end<=today.to)return today.date;
  const hit=day=>!!day&&start<=day.to&&end>=day.from;
  const p=hit(previous),t=hit(today),n=hit(next);
  if(p&&t)return previous.date;
  if(t&&n)return today.date;
  if(p&&!n)return previous.date;
  if(!p&&!t&&n)return next.date;
  if(!p)return today.date;
  return null;
 }
 root.OvertimeVestingDate={resolve};
})(typeof window==='undefined'?globalThis:window);
