/* Fictional rows for reviewing step-two presentation. */
const STAFF_DEMO=[
 {id:'e1',name:'张三',no:'E0001',org:'b',job:'产品专员',grade:'P2-1'},
 {id:'e2',name:'Alejandro Maximiliano Fernández de la Cruz',no:'E0002',org:'b',job:'Senior Director of International Commercial Operations and Strategic Partnerships',grade:'P4-1'},
 {id:'e3',name:'李四',no:'E0003',org:'p',job:'产品经理',grade:'P3-1'},
 {id:'e4',name:'Alexandra Catherine Montgomery-Williams',no:'E0004',org:'t',job:'Regional Technology Enablement and Transformation Manager',grade:'P3-2'},
 {id:'e5',name:'王五',no:'E0005',org:'o',job:'项目专员',grade:'P2-2'},
 {id:'e6',name:'赵六',no:'E0006',org:'s',job:'业务主管',grade:'P4-1'}
];
const GRADES=['P1-1','P1-2','P1-3','P2-1','P2-2','P2-3','P3-1','P3-2','P3-3','P4-1','P4-2','P4-3'];
function initialHeadcounts(){
 const records=STAFF_DEMO.map((p,i)=>({id:'hc'+(i+1),code:'HC00'+(i+1),person:p.id,org:p.org,job:i===0?'产品经理':p.job,grade:i===0?'P3-1':p.grade,overseas:i===1||i===3,place:i===1?'London, United Kingdom — Canary Wharf International Office':i===3?'Singapore — Regional Technology Office':'深圳',arrival:''}));
 records.push({id:'hc7',code:'HC007',person:null,org:'b',job:'产品经理',grade:'P3-1',overseas:false,place:'深圳',arrival:'7月'},
 {id:'hc8',code:'HC008',person:null,org:'t',job:'Regional Technology Enablement and Transformation Manager',grade:'P3-1',overseas:true,place:'Singapore — Regional Technology Office',arrival:'10月'},
 {id:'hc9',code:'HC009',person:null,org:'o',job:'项目专员',grade:'P2-1',overseas:false,place:'深圳',arrival:'7月'});
 return records;
}
function initialPositions(records){const positions=[];for(const r of records){if(!positions.some(p=>p.org===r.org&&p.name===r.job))positions.push({id:'pos'+positions.length,org:r.org,name:r.job,min:'P1-1',max:'P4-3'});}positions.push({id:'pos-empty',org:'s',name:'数据分析专员',min:'P2-1',max:'P4-3'});return positions;}
