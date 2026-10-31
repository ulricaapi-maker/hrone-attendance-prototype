/* A list view entry opens the existing read-only result preview. */
if(new URLSearchParams(location.search).get('view')==='readonly'){
 const backToList=()=>location.assign('../编制规划列表/index.html');
 $('#close-planning-result').textContent='返回列表';$('#close-planning-result').onclick=backToList;
 resultDialog.addEventListener('cancel',event=>{event.preventDefault();backToList();});
 previewButton.onclick();resultOrg=resultRoot();$('#result-children').checked=true;renderPlanningResult();
}
