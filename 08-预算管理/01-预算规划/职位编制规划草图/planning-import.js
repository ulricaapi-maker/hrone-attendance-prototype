/* Toolbar actions; import details are intentionally outside this prototype. */
const importButton=document.createElement('button');importButton.id='open-planning-import';importButton.textContent='导入';
const batchTools=document.createElement('div');batchTools.id='main-batch-tools';batchTools.className='buttons';
for(const id of ['positions','add-hc','arrange','edit-hc'])$('#active-tools').appendChild($('#'+id));
$('#active-tools').appendChild($('#batch-stop-hc'));$('#active-tools').appendChild(importButton);$('#add-position').hidden=true;
importButton.onclick=()=>notify('导入功能待完善');
const renderBeforeToolbar=render;render=function(){renderBeforeToolbar();importButton.hidden=sourceView();};
