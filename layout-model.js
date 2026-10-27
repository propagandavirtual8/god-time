// Declarative design only: no executable HTML, scripts, or arbitrary CSS.
export const widgets = {
 container:{label:'Container',icon:'▣',group:'Dasar'},
 heading:{label:'Judul',icon:'T',group:'Dasar'}, text:{label:'Teks',icon:'≡',group:'Dasar'},
 image:{label:'Gambar',icon:'▧',group:'Dasar'}, button:{label:'Tombol',icon:'▰',group:'Dasar'},
 divider:{label:'Garis',icon:'―',group:'Dasar'}, spacer:{label:'Jarak',icon:'↕',group:'Dasar'},
 message:{label:'Pesan utama',icon:'✦',group:'God Time',native:'#pesan'},
 today:{label:'Tanggal & ayat harian',icon:'☀',group:'God Time',native:'.hero'},
 calendar:{label:'Kalender Yahudi',icon:'▦',group:'God Time',native:'#kalender'},
 months:{label:'12 bulan & suku',icon:'◷',group:'God Time',native:'#bulan'},
 prayers:{label:'Doa Global',icon:'♡',group:'God Time',native:'#doa'},
 learn:{label:'Ruang belajar',icon:'▤',group:'God Time',native:'#belajar'}
};
export const parts={message:{card:['Box pesan','#monthly-message'],title:['Judul pesan','.message-main h3'],body:['Isi pesan','.message-body p'],quote:['Box ayat','.reading-quote']},today:{card:['Box tanggal','.season-card'],date:['Tanggal utama','.season-date'],memory:['Box hafalan','.daily-memory']},calendar:{panel:['Box kalender','.calendar-panel'],day:['Box catatan tanggal','.day-panel'],title:['Judul bulan','.calendar-toolbar h3'],cell:['Kotak tanggal','.calendar-cell']},months:{cards:['Kartu bulan','.month-button'],profile:['Box profil bulan','.month-profile']},prayers:{cards:['Box pokok doa','.prayer-card']},learn:{cards:['Kotak materi','details']}};
export const devices=['desktop','tablet','mobile'];
export const styleKeys={
 width:'length',maxWidth:'length',minHeight:'length',padding:'space',margin:'space',gap:'length',
 backgroundColor:'color',color:'color',backgroundImage:'image',backgroundSize:'cover|contain|auto',
 backgroundPosition:'center|top|bottom|left|right',borderColor:'color',borderWidth:'length',
 borderRadius:'length',fontSize:'length',fontWeight:'300|400|500|600|700|800|900',
 textAlign:'left|center|right',direction:'row|column',alignItems:'stretch|flex-start|center|flex-end',
 justifyContent:'flex-start|center|flex-end|space-between|space-around',columns:'1|2|3|4',
 layout:'flex|grid',display:'show|hide',shadow:'none|soft|deep',opacity:'opacity'
};
export function safeUrl(value, image=false){
 if(typeof value!=='string'||value.length>750000)return '';
 const s=value.trim();
 if(!s)return '';
 if(image&&/^data:image\/(png|jpeg|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(s))return s;
 if(/^[A-Za-z0-9][A-Za-z0-9_./-]*$/.test(s)&&!s.includes('..')&&!s.includes('//'))return s;
 if(!image&&/^#[A-Za-z][\w-]*$/.test(s))return s;
 try{const u=new URL(s);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}
 return '';
}
export function validStyle(key,value){
 const rule=Object.hasOwn(styleKeys,key)?styleKeys[key]:null;if(!rule||typeof value!=='string')return false;
 if(rule==='length')return /^(auto|0|\d{1,4}(\.\d{1,2})?(px|%|rem|vh|vw))$/.test(value);
 if(rule==='space')return value.split(/\s+/).length<=4&&value.split(/\s+/).every(x=>/^(auto|0|\d{1,4}(\.\d{1,2})?(px|%|rem))$/.test(x));
 if(rule==='color')return /^(#[a-fA-F0-9]{3}|#[a-fA-F0-9]{4}|#[a-fA-F0-9]{6}|#[a-fA-F0-9]{8}|transparent)$/.test(value);
 if(rule==='image')return !value||!!safeUrl(value,true);
 if(rule==='opacity')return /^(0(\.\d{1,2})?|1(\.0{1,2})?)$/.test(value);
 return rule.split('|').includes(value);
}
export function id(){return 'n'+crypto.randomUUID().replaceAll('-','');}
export function createNode(type){
 if(!Object.hasOwn(widgets,type))throw Error('Widget tidak dikenal.');
 const n={id:id(),type,label:widgets[type].label,props:{},styles:{desktop:{},tablet:{},mobile:{}},children:[]};
 if(type==='container')n.styles.desktop={layout:'flex',direction:'column',gap:'20px',padding:'24px',width:'100%'};
 if(type==='heading'){n.props={text:'Judul baru',tag:'h2'};n.styles.desktop.fontSize='32px';}
 if(type==='text')n.props={text:'Tulis keterangan atau pengantar di sini.'};
 if(type==='image')n.props={src:'',alt:'Jelaskan isi gambar'};
 if(type==='button')n.props={text:'Jelajahi kalender',href:'#kalender'};
 if(type==='spacer')n.styles.desktop.minHeight='40px';
 return n;
}
export function defaultLayout(){
 return {version:1,site:{background:'#fff4e3',color:'#42232a',accent:'#741f35',font:'DM Sans',logo:'logo-ehop.png',logoAlt:'El-Bethel House of Prayer',logoWidth:224,headerBackground:'#fff4e3'},
 nodes:['message','today','calendar','months','prayers','learn'].map(type=>{const n=createNode(type);n.id='native-'+type;n.styles.desktop={width:'100%',maxWidth:'1216px',margin:'0 auto'};return n;})};
}
export function validateLayout(input){
 if(!input||input.version!==1||!Array.isArray(input.nodes)||input.nodes.length>150)throw Error('Format layout tidak didukung.');
 const seen=new Set(),native=new Set();let count=0;
 const text=(v,max=30000)=>typeof v==='string'?v.slice(0,max):'';
 const check=(raw,depth)=>{
  if(!raw||depth>8||++count>150||!Object.hasOwn(widgets,raw.type)||!/^[a-zA-Z][\w-]{0,79}$/.test(raw.id)||seen.has(raw.id))throw Error('Struktur layout tidak valid (maksimal 150 elemen, 8 tingkat).');
  seen.add(raw.id);
  if(widgets[raw.type].native){if(native.has(raw.type))throw Error('Widget aplikasi hanya boleh dipasang sekali: '+widgets[raw.type].label);native.add(raw.type);}
  const n={id:raw.id,type:raw.type,label:text(raw.label,100)||widgets[raw.type].label,props:{},styles:{},parts:{},children:[]};
  const p=raw.props||{};
  if(['heading','text','button'].includes(n.type))n.props.text=text(p.text);
  if(n.type==='heading')n.props.tag=['h1','h2','h3','h4','h5','h6'].includes(p.tag)?p.tag:'h2';
  if(n.type==='button'){if(p.href&&!safeUrl(p.href))throw Error('Tautan harus HTTPS atau anchor halaman.');n.props.href=safeUrl(p.href)||'#beranda';}
  if(n.type==='image'){if(p.src&&!safeUrl(p.src,true))throw Error('Format URL gambar tidak diizinkan.');n.props.src=safeUrl(p.src,true);n.props.alt=text(p.alt,300);}
  for(const device of devices){n.styles[device]={};for(const [k,v] of Object.entries(raw.styles?.[device]||{})){if(!validStyle(k,v))throw Error('Nilai tampilan tidak valid: '+k);n.styles[device][k]=v;}}
  for(const [part,deviceStyles] of Object.entries(raw.parts||{})){if(!Object.hasOwn(parts[n.type]||{},part))throw Error('Bagian widget tidak dikenal.');n.parts[part]={};for(const d of devices){n.parts[part][d]={};for(const [key,value] of Object.entries(deviceStyles[d]||{})){if(!validStyle(key,value))throw Error('Gaya box tidak valid: '+key);n.parts[part][d][key]=value;}}}
  if(raw.children?.length&&n.type!=='container')throw Error('Hanya container yang dapat memiliki anak.');
  n.children=(raw.children||[]).map(c=>check(c,depth+1));return n;
 };
 const s=input.site||{};
 if(s.logo&&!safeUrl(s.logo,true))throw Error('Logo harus berupa URL gambar yang valid.');
 return {version:1,site:{background:validStyle('color',s.background)?s.background:'#fff4e3',color:validStyle('color',s.color)?s.color:'#42232a',accent:validStyle('color',s.accent)?s.accent:'#741f35',headerBackground:validStyle('color',s.headerBackground)?s.headerBackground:'#fff4e3',font:['DM Sans','Arial','Verdana','Trebuchet MS'].includes(s.font)?s.font:'DM Sans',logo:safeUrl(s.logo||'logo-ehop.png',true),logoAlt:text(s.logoAlt,300)||'Logo',logoWidth:Math.min(400,Math.max(60,Number(s.logoWidth)||224))},nodes:input.nodes.map(n=>check(n,0))};
}
export function locate(nodes,id,parent=null){for(let i=0;i<nodes.length;i++){const node=nodes[i];if(node.id===id)return{node,list:nodes,index:i,parent};const hit=locate(node.children,id,node);if(hit)return hit;}return null;}
export function moveNode(layout,sourceId,targetId,position='before'){
 const source=locate(layout.nodes,sourceId),target=targetId?locate(layout.nodes,targetId):null;
 if(!source||sourceId===targetId||target&&locate([source.node],targetId))return false;
 if(position==='inside'&&target?.node.type!=='container')return false;
 const moved=source.list.splice(source.index,1)[0];
 const fresh=targetId?locate(layout.nodes,targetId):null;
 if(!fresh)layout.nodes.push(moved);
 else if(position==='inside')fresh.node.children.push(moved);
 else fresh.list.splice(fresh.index+(position==='after'?1:0),0,moved);
 return true;
}
export function insertNode(layout,node,targetId,inside=false){
 const hit=locate(layout.nodes,targetId);
 if(inside&&hit?.node.type==='container')hit.node.children.push(node);
 else if(hit)hit.list.splice(hit.index+1,0,node);else layout.nodes.push(node);
}
export function cloneNode(node){const copy=structuredClone(node);const walk=n=>{n.id=id();n.children.forEach(walk);};walk(copy);return copy;}
function declarations(style,type,important=false){
 const map={direction:'flex-direction',columns:'grid-template-columns',layout:'display',shadow:'box-shadow'};
 return Object.entries(style).filter(([key])=>key!=='display').map(([key,v])=>{
  if(key==='backgroundImage')return v?'background-image:url("'+v.replaceAll('"','%22')+'")':'background-image:none';
  if(key==='columns')v='repeat('+v+',minmax(0,1fr))';
  if(key==='shadow')v={none:'none',soft:'0 8px 30px #00000012',deep:'0 16px 45px #00000028'}[v];
  return (map[key]||key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))+':'+v;
 }).concat(style.display==='hide'?['display:none!important']:style.display==='show'?['display:'+(type==='container'?(style.layout||'flex'):'block')+'!important']:[]).map(x=>important&&!x.endsWith('!important')?x+'!important':x).join(';');
}
export function layoutCSS(document){
 const doc=validateLayout(document),rules=[];
 const add=(selector,styles,type,important=false)=>{
  for(const device of devices){
   const values={...styles[device]};
   if(important&&values.backgroundColor&&!values.backgroundImage)values.backgroundImage='';
   const css=selector+'{'+declarations(values,type,important)+'}';
   rules.push(device==='desktop'?css:'@media(max-width:'+(device==='tablet'?1024:740)+'px){'+css+'}');
  }
 };
 const walk=n=>{
  add('[data-layout-id="'+n.id+'"]',n.styles,n.type);
  for(const [part,styles]of Object.entries(n.parts||{}))add('[data-layout-id="'+n.id+'"] '+parts[n.type][part][1],styles,n.type,true);
  n.children.forEach(walk);
 };
 doc.nodes.forEach(walk);
 return rules.join('\n');
}
