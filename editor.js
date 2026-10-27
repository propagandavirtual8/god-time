import {widgets,parts,devices,defaultLayout,validateLayout,createNode,locate,moveNode,insertNode,cloneNode} from './layout-model.js';
import {configured,managerClient} from './supabase-client.js';
import {finishOAuth} from './auth.js';
import {layoutStore} from './layout-store.js';
const $=s=>document.querySelector(s),frame=$('#canvas');
let sessionGeneration=0,sessionUserId=null;
let fieldEditing=false;
const pendingInputs=new Set();
function flushPending(){for(const apply of [...pendingInputs])apply();}
document.addEventListener('pointerdown',flushPending,true);
let documentModel=defaultLayout(),selected=null,styleTarget='',device='desktop',panel='widgets',demo=false,active=false,busy=false,dirty=false,ready=false,live=false,client,store,userKey='local',revision=0,publishedRevision=0,undoStack=[],future=[],mediaTarget=null;
const say=text=>{$('#status').textContent=text;};
const gateSay=text=>{$('#gate-status').textContent=text;};
const node=()=>selected?locate(documentModel.nodes,selected)?.node:null;
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function post(type,data={}){if(ready)frame.contentWindow.postMessage({source:'god-time-editor',type,...data},location.origin);}
function checkpoint(change){
 if(busy||!active)return;
 const before=structuredClone(documentModel);
 try{change();documentModel=validateLayout(documentModel);undoStack.push(before);if(undoStack.length>60)undoStack.shift();future=[];dirty=true;refresh(fieldEditing);say('Perubahan belum disimpan.');}
 catch(e){documentModel=before;say(e.message);refresh();}
}
function buttons(){
 $('#save').disabled=!active||busy;
 $('#publish').disabled=!active||demo||busy;
 $('#publish').title=demo?'Mode lokal tidak dapat menerbitkan ke website.':'Simpan dan terbitkan tampilan';
 $('#undo').disabled=busy||!undoStack.length;$('#redo').disabled=busy||!future.length;
 $('#dirty-badge').textContent=dirty?'Belum disimpan':demo?'Draf lokal':'Draf tersimpan';
 $('#save').textContent=busy?'Memproses…':demo?'Simpan lokal':'Simpan draf';
 $('#history').disabled=demo||busy;$('#reload-design').disabled=demo||busy;
}
function refresh(preserveFields=false){
 const focused=document.activeElement;const focusLabel=focused?.getAttribute('aria-label');const focusStart=focused?.selectionStart,focusEnd=focused?.selectionEnd;const scrolls=[...document.querySelectorAll('.panel')].map(e=>[e,e.scrollTop]);
 renderPalette();renderTree();if(!preserveFields){renderInspector();renderSite();}buttons();
 post('render',{document:documentModel});post('select',{id:selected||''});
 if(focusLabel){const replacement=[...document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label')===focusLabel&&e.offsetParent);if(replacement){replacement.focus({preventScroll:true});if(typeof focusStart==='number'&&replacement.setSelectionRange)try{replacement.setSelectionRange(focusStart,focusEnd);}catch{}}}for(const [e,top]of scrolls)e.scrollTop=top;
 let count=0;const walk=nodes=>nodes.forEach(n=>{count++;walk(n.children)});walk(documentModel.nodes);
 $('#element-count').textContent=count+' elemen · '+device;
}
function openPanel(next){panel=next;for(const name of ['widgets','settings','site']){$('#'+name+'-panel').hidden=name!==panel;document.querySelector('[data-panel="'+name+'"]').classList.toggle('active',name===panel);}}
function select(id){if(id!==selected)styleTarget='';selected=id;openPanel('settings');renderInspector();renderTree();post('select',{id});}
function add(type,target=selected,position='auto'){
 checkpoint(()=>{
  const n=createNode(type);
  if(position==='before'){const hit=locate(documentModel.nodes,target);if(hit)hit.list.splice(hit.index,0,n);else documentModel.nodes.push(n);}
  else insertNode(documentModel,n,target,position==='inside'||position==='auto'&&locate(documentModel.nodes,target)?.node.type==='container');
  selected=n.id;
 });
 openPanel('settings');
}
function renderPalette(){
 const list=$('#widget-list');list.replaceChildren();const query=$('#widget-search').value.toLowerCase();
 for(const group of ['Dasar','God Time']){
  const entries=Object.entries(widgets).filter(([,w])=>w.group===group&&w.label.toLowerCase().includes(query));
  if(!entries.length)continue;
  list.append(element('h2','widget-group-title',group==='God Time'?'WIDGET GOD TIME':'ELEMEN DASAR'));
  const grid=element('div','widget-grid');
  for(const [type,w] of entries){
   const b=element('button','widget-card');b.dataset.native=!!w.native;b.append(element('span','',w.icon),element('strong','',w.label));b.draggable=true;
   const exists=w.native&&!!findType(documentModel.nodes,type);b.disabled=exists;
   b.title=exists?'Sudah dipasang. Pilih dari struktur untuk mengatur.':'Tambah '+w.label;
   b.onclick=()=>add(type);b.ondragstart=e=>e.dataTransfer.setData('text/plain',JSON.stringify({widget:type}));grid.append(b);
  }list.append(grid);
 }
}
function findType(nodes,type){for(const n of nodes){if(n.type===type)return n;const result=findType(n.children,type);if(result)return result;}return null;}
function renderTree(){
 const tree=$('#tree');tree.replaceChildren();
 function draw(nodes,root){for(const n of nodes){
  const wrap=element('div','tree-node'),row=element('div','tree-row'+(n.id===selected?' active':''));row.draggable=true;row.dataset.id=n.id;
  const selectButton=element('button','name',widgets[n.type].icon+'  '+n.label);selectButton.title='Pilih '+n.label;selectButton.onclick=()=>select(n.id);
  row.append(element('span','grip','⠿'),selectButton);
  const actions=element('span','tree-actions');for(const [label,dir] of [['↑',-1],['↓',1]]){const b=element('button','',label);b.setAttribute('aria-label',(dir<0?'Naikkan ':'Turunkan ')+n.label);b.onclick=()=>shift(n.id,dir);actions.append(b);}row.append(actions);
  row.ondragstart=e=>{e.stopPropagation();e.dataTransfer.setData('text/plain',JSON.stringify({id:n.id}));};
  row.ondragover=e=>{e.preventDefault();row.classList.add('tree-drop');};row.ondragleave=()=>row.classList.remove('tree-drop');
  row.ondrop=e=>{e.preventDefault();e.stopPropagation();row.classList.remove('tree-drop');try{const data=JSON.parse(e.dataTransfer.getData('text/plain'));drop({...data,target:n.id,position:'before'});}catch{}};
  wrap.append(row);if(n.children.length){const child=element('div','tree-children');draw(n.children,child);wrap.append(child);}root.append(wrap);
 }}draw(documentModel.nodes,tree);
}
function shift(id,delta){checkpoint(()=>{const hit=locate(documentModel.nodes,id);const next=hit.index+delta;if(next<0||next>=hit.list.length)return;[hit.list[hit.index],hit.list[next]]=[hit.list[next],hit.list[hit.index]];});}
function drop(data){if(data.widget)add(data.widget,data.target,data.position);else checkpoint(()=>{moveNode(documentModel,data.id,data.target,data.position);selected=data.id;});}
function bindInput(input,change){let timer,last=input.value;const apply=()=>{clearTimeout(timer);pendingInputs.delete(apply);if(input.value===last)return;last=input.value;fieldEditing=true;try{change(input.value);}finally{fieldEditing=false;}};if(input.tagName==='SELECT')input.addEventListener('change',apply);else{input.addEventListener('input',()=>{clearTimeout(timer);pendingInputs.add(apply);timer=setTimeout(apply,300);});input.addEventListener('blur',apply);input.addEventListener('change',apply);}}
function field(parent,label,value,change,{type='text',options=null,placeholder='',note=''}={}){
 const wrapper=element('label','field');wrapper.append(element('span','',label));
 let input;
 if(options){input=element('select');for(const option of options){const [v,t]=Array.isArray(option)?option:[option,option];const o=element('option','',t);o.value=v;input.append(o);}}
 else input=element(type==='textarea'?'textarea':'input');
 if(input.tagName==='INPUT')input.type=type;
 input.value=value??'';input.placeholder=placeholder;input.setAttribute('aria-label',label);bindInput(input,change);
 wrapper.append(input);if(note)wrapper.append(element('small','',note));parent.append(wrapper);return input;
}
function colorField(parent,label,value,change){
 const wrapper=element('div','field');const labelEl=element('label','',label);const row=element('div','color-row');
 const picker=element('input');picker.type='color';picker.value=/^#[0-9a-f]{6}$/i.test(value||'')?value:'#ffffff';picker.setAttribute('aria-label',label+' warna');
 const text=element('input');text.type='text';text.value=value||'';text.placeholder='Warisan';text.setAttribute('aria-label',label);labelEl.append(row);row.append(picker,text);wrapper.append(labelEl);
 bindInput(text,change);bindInput(picker,change);parent.append(wrapper);
}
function mediaField(parent,label,value,change,target){
 field(parent,label,value,change,{placeholder:'https://… atau nama-file.png'});
 parent.append(element('p','muted','Gambar yang diunggah memiliki URL publik.'));const b=element('button','secondary','↑ Unggah gambar');b.onclick=()=>{mediaTarget={...target,apply:change};$('#media-file').click();};parent.append(b);
}
function renderInspector(){
 const n=node();$('#inspector-empty').hidden=!!n;$('#inspector').hidden=!n;
 if(!n)return;
 const root=$('#inspector');root.replaceChildren();
 const title=element('div','inspector-heading');title.append(element('span','',widgets[n.type].icon));const caption=element('div');caption.append(element('h2','','Edit '+widgets[n.type].label),element('small','',n.label));title.append(caption);root.append(title);
 field(root,'Nama elemen',n.label,v=>checkpoint(()=>node().label=v));
 const tools=element('div','inspector-tools');
 for(const [label,action] of [
 ['↑',()=>shift(n.id,-1)],['↓',()=>shift(n.id,1)],
 ['Duplikat',()=>checkpoint(()=>{const copy=cloneNode(node());insertNode(documentModel,copy,selected);selected=copy.id;})],
 ['Hapus',()=>checkpoint(()=>{const hit=locate(documentModel.nodes,selected);hit.list.splice(hit.index,1);selected=null;})]
 ]){const b=element('button',label==='Hapus'?'danger':'',label);b.onclick=action;tools.append(b);}root.append(tools);
 if(widgets[n.type].native)root.append(element('p','muted',n.type==='message'?'Isi pesan mengikuti Kelola Pesan. Editor ini mengatur tampilannya.':'Widget aplikasi aktif. Data dan fungsi tetap dikelola God Time.'));
 function prop(key,val){checkpoint(()=>{const target=locate(documentModel.nodes,n.id)?.node;if(target)target.props[key]=val;});}
 if(['heading','text','button'].includes(n.type))field(root,'Teks',n.props.text,v=>prop('text',v),{type:n.type==='text'?'textarea':'text'});
 if(n.type==='heading')field(root,'Tingkat judul',n.props.tag,v=>prop('tag',v),{options:['h1','h2','h3','h4','h5','h6']});
 if(n.type==='button')field(root,'Tautan',n.props.href,v=>prop('href',v),{placeholder:'https://… atau #kalender'});
 if(n.type==='image'){mediaField(root,'URL gambar',n.props.src,v=>prop('src',v),{kind:'prop',id:n.id,key:'src'});field(root,'Deskripsi gambar',n.props.alt,v=>prop('alt',v));}
 root.append(element('div','device-note','Mengedit '+device.toUpperCase()+' · Kosongkan nilai untuk mengikuti perangkat yang lebih besar.'));
 if(parts[n.type])field(root,'Bagian yang diatur',styleTarget,v=>{styleTarget=v;renderInspector();},{options:[['','Container luar'],...Object.entries(parts[n.type]).map(([k,p])=>[k,p[0]])]});else styleTarget='';
 const editingDevice=device,editingPart=styleTarget;
 const getStyles=()=>{const target=locate(documentModel.nodes,n.id)?.node;if(!target)throw Error('Elemen tidak ditemukan.');if(!editingPart)return target.styles[editingDevice];target.parts??={};target.parts[editingPart]??={desktop:{},tablet:{},mobile:{}};return target.parts[editingPart][editingDevice];};
 const styles=styleTarget?(n.parts?.[styleTarget]?.[device]||{}):n.styles[device];const update=(key,value)=>checkpoint(()=>{const target=getStyles();if(value==='')delete target[key];else target[key]=value;});
 const section=(name)=>{const e=element('div','style-section');e.append(element('h3','',name));root.append(e);return e;};
 const sizes=section('Tata letak & ukuran'),grid=element('div','style-grid');sizes.append(grid);
 for(const [key,label] of [['width','Lebar'],['maxWidth','Lebar maksimal'],['minHeight','Tinggi minimal'],['gap','Jarak elemen']])field(grid,label,styles[key],v=>update(key,v),{placeholder:key==='width'?'100%':'24px'});
 if(n.type==='container'){
  for(const [key,label,options] of [
   ['layout','Sistem layout',[['','Warisan'],['flex','Flexbox'],['grid','Grid']]],
   ['direction','Arah',[['','Warisan'],['column','Vertikal'],['row','Horizontal']]],
   ['columns','Kolom',[['','Warisan'],'1','2','3','4']],
   ['alignItems','Rata silang',[['','Warisan'],['stretch','Rentangkan'],['flex-start','Awal'],['center','Tengah'],['flex-end','Akhir']]],
   ['justifyContent','Distribusi',[['','Warisan'],['flex-start','Awal'],['center','Tengah'],['flex-end','Akhir'],['space-between','Antar elemen'],['space-around','Sekitar elemen']]]
  ])field(sizes,label,styles[key],v=>update(key,v),{options});
 }
 const appearance=section('Warna & latar belakang');
 colorField(appearance,'Warna box',styles.backgroundColor,v=>update('backgroundColor',v));colorField(appearance,'Warna teks',styles.color,v=>update('color',v));
 mediaField(appearance,'Gambar latar',styles.backgroundImage,v=>update('backgroundImage',v),{kind:'style',id:n.id,key:'backgroundImage',device,part:styleTarget});
 field(appearance,'Ukuran latar',styles.backgroundSize,v=>update('backgroundSize',v),{options:[['','Warisan'],'cover','contain','auto']});
 field(appearance,'Posisi latar',styles.backgroundPosition,v=>update('backgroundPosition',v),{options:[['','Warisan'],'center','top','bottom','left','right']});
 const type=section('Tipografi');field(type,'Ukuran huruf',styles.fontSize,v=>update('fontSize',v),{placeholder:'18px'});
 field(type,'Ketebalan',styles.fontWeight,v=>update('fontWeight',v),{options:[['','Warisan'],'300','400','500','600','700','800','900']});
 field(type,'Perataan teks',styles.textAlign,v=>update('textAlign',v),{options:[['','Warisan'],['left','Kiri'],['center','Tengah'],['right','Kanan']]});
 const spacing=section('Jarak, garis & efek');
 field(spacing,'Padding',styles.padding,v=>update('padding',v),{placeholder:'24px 20px',note:'Urutan: atas, kanan, bawah, kiri. px, %, atau rem.'});
 field(spacing,'Margin',styles.margin,v=>update('margin',v),{placeholder:'0 auto'});
 field(spacing,'Sudut box',styles.borderRadius,v=>update('borderRadius',v),{placeholder:'12px'});
 field(spacing,'Tebal garis',styles.borderWidth,v=>update('borderWidth',v),{placeholder:'1px'});
 colorField(spacing,'Warna garis',styles.borderColor,v=>update('borderColor',v));
 field(spacing,'Bayangan',styles.shadow,v=>update('shadow',v),{options:[['','Warisan'],['none','Tanpa'],['soft','Lembut'],['deep','Tegas']]});
 field(spacing,'Opasitas',styles.opacity,v=>update('opacity',v),{placeholder:'0.8'});
 field(spacing,'Visibilitas',styles.display,v=>update('display',v),{options:[['','Warisan'],['show','Tampilkan'],['hide','Sembunyikan']]});
 const reset=element('button','secondary','Reset gaya '+device);reset.onclick=()=>checkpoint(()=>{if(styleTarget)delete node().parts[styleTarget];else node().styles[device]={};});root.append(reset);
}
function renderSite(){
 const root=$('#site-fields');root.replaceChildren();const s=documentModel.site;const update=(key,v)=>checkpoint(()=>documentModel.site[key]=v);
 mediaField(root,'Logo website',s.logo,v=>update('logo',v),{kind:'site',key:'logo'});
 field(root,'Deskripsi logo',s.logoAlt,v=>update('logoAlt',v));
 field(root,'Lebar logo (px)',s.logoWidth,v=>update('logoWidth',Number(v)),{type:'number'});
 colorField(root,'Warna halaman',s.background,v=>update('background',v));colorField(root,'Warna teks global',s.color,v=>update('color',v));colorField(root,'Warna aksen',s.accent,v=>update('accent',v));colorField(root,'Warna header',s.headerBackground,v=>update('headerBackground',v));
 field(root,'Font sans-serif',s.font,v=>update('font',v),{options:['DM Sans','Arial','Verdana','Trebuchet MS']});
}
async function enter(isDemo,session,request=sessionGeneration){
 if(isDemo)++sessionGeneration;sessionUserId=session?.user.id||null;
 demo=isDemo;active=true;userKey=demo?'local':session.user.id;
 $('#gate').hidden=true;$('#studio').hidden=false;requestAnimationFrame(sizeCanvas);
 $('#account-name').textContent=demo?'Mode lokal · tanpa publikasi':session.user.email;
 $('#mode-label').textContent=demo?'Mode lokal · belum terhubung':'Admin tampilan';
 undoStack=[];future=[];selected=null;dirty=false;revision=0;publishedRevision=0;
 try{
  if(!demo){store=layoutStore(client);const loaded=await store.load();if(request!==sessionGeneration||demo)return;documentModel=validateLayout(loaded.draft?.document||loaded.published?.document||defaultLayout());revision=loaded.draft?.revision||0;publishedRevision=loaded.published?.revision||0;}
  else {const saved=localStorage.getItem('god-time-design-local');documentModel=saved?validateLayout(JSON.parse(saved)):defaultLayout();}
  refresh();say(demo?'Mode lokal: perubahan hanya tersimpan di browser ini.':'Draf server dimuat. Isi Pesan Utama tetap terpisah.');
 }catch(e){if(!isDemo&&request!==sessionGeneration)return;active=false;$('#studio').hidden=true;$('#gate').hidden=false;gateSay('Editor belum dapat dibuka: '+e.message);}
}
async function cloudSession(session){
 if(demo||active&&session?.user.id===sessionUserId)return;const request=++sessionGeneration;
 if(!session){active=false;$('#studio').hidden=true;$('#gate').hidden=false;return;}
 try{store=layoutStore(client);const allowed=await store.allowed();if(request!==sessionGeneration||demo)return;if(!allowed){active=false;$('#studio').hidden=true;$('#gate').hidden=false;gateSay('Akun ini belum memiliki akses admin desain. Hak admin pesan tidak otomatis memberikan akses desain.');return;}await enter(false,session,request);}
 catch{gateSay('Akses desain belum tersedia. Pastikan migrasi editor dan akun admin desain telah disiapkan.');}
}
async function saveDraft(){
 flushPending();
 if(busy||!active)return false;
 busy=true;buttons();const snapshot=validateLayout(documentModel);
 try{
  if(demo)localStorage.setItem('god-time-design-local',JSON.stringify(snapshot));
  else {const result=await store.save(snapshot,revision);revision=result.revision;}
  dirty=false;say(demo?'Draf lokal tersimpan di browser ini.':'Draf tersimpan. Website publik belum berubah.');return true;
 }catch(e){say('Gagal menyimpan: '+e.message+' Ekspor JSON untuk menyimpan salinan.');return false;}
 finally{busy=false;buttons();}
}
$('#save').onclick=saveDraft;
$('#publish').onclick=async()=>{
 if(demo||busy||!active)return;
 if(!confirm('Terbitkan tampilan ini untuk seluruh pengunjung? Isi Pesan Utama tidak berubah.'))return;
 if(!await saveDraft())return;
 busy=true;buttons();
 try{const result=await store.publish(revision,publishedRevision);publishedRevision=result.revision;say('Tampilan berhasil diterbitkan. Pengunjung melihatnya saat memuat ulang halaman.');}
 catch(e){say('Belum berhasil menerbitkan: '+e.message);}finally{busy=false;buttons();}
};
$('#undo').onclick=()=>{if(!undoStack.length||busy)return;future.push(structuredClone(documentModel));documentModel=undoStack.pop();if(!locate(documentModel.nodes,selected))selected=null;dirty=true;refresh();say('Perubahan diurungkan.');};
$('#redo').onclick=()=>{if(!future.length||busy)return;undoStack.push(structuredClone(documentModel));documentModel=future.pop();dirty=true;refresh();};
$('#preview').onclick=()=>{live=!live;$('#preview').setAttribute('aria-pressed',String(live));$('#canvas-mode').textContent=live?'PREVIEW INTERAKTIF':'EDIT CANVAS';post('interactive',{value:live});};
for(const b of document.querySelectorAll('[data-device]'))b.onclick=()=>{device=b.dataset.device;$('#frame-shell').dataset.device=device;$('#viewport-label').textContent={desktop:'Desktop · Responsif',tablet:'Tablet · hingga 768px',mobile:'Mobile · hingga 390px'}[device];for(const t of document.querySelectorAll('[data-device]'))t.classList.toggle('active',t===b);renderInspector();buttons();sizeCanvas();};
for(const b of document.querySelectorAll('[data-panel]'))b.onclick=()=>openPanel(b.dataset.panel);
$('#widget-search').oninput=renderPalette;$('#add-container').onclick=()=>add('container');
$('#toggle-structure').onclick=()=>{const e=$('#structure');if(innerWidth<=1150){e.classList.toggle('visible');$('#toggle-structure').setAttribute('aria-expanded',String(e.classList.contains('visible')));}else{e.hidden=!e.hidden;$('.workspace').style.gridTemplateColumns=e.hidden?'300px minmax(0,1fr)':'';$('#toggle-structure').setAttribute('aria-expanded',String(!e.hidden));}};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(validateLayout(documentModel),null,2)],{type:'application/json'});const a=element('a');a.href=URL.createObjectURL(blob);a.download='god-time-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);say('Layout diekspor.');};
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('JSON maksimal 2 MB.');const parsed=validateLayout(JSON.parse(await file.text()));checkpoint(()=>{documentModel=parsed;selected=null;});say('Layout diimpor sebagai draf.');}catch(error){say('Impor ditolak: '+error.message);}e.target.value='';};
$('#media-file').onchange=async e=>{
 const file=e.target.files[0],target=mediaTarget;if(!file||!target)return;
 try{
  if(!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type))throw Error('Gunakan PNG, JPG, WebP, atau AVIF.');
  say('Mengunggah gambar…');let url;
  if(demo){if(file.size>500000)throw Error('Mode lokal: gambar maksimal 500 KB. Login untuk unggah hingga 5 MB.');url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
  else url=await store.upload(file);
  checkpoint(()=>{
   if(target.kind==='site')documentModel.site[target.key]=url;
   else {const n=locate(documentModel.nodes,target.id)?.node;if(!n)throw Error('Elemen gambar sudah dihapus.');if(target.kind==='prop')n.props[target.key]=url;else if(target.part){n.parts??={};n.parts[target.part]??={desktop:{},tablet:{},mobile:{}};n.parts[target.part][target.device][target.key]=url;}else n.styles[target.device][target.key]=url;}
  });say('Gambar ditambahkan ke draf.');
 }catch(error){say('Gambar belum diunggah: '+error.message);}e.target.value='';
};
$('#history').onclick=async()=>{
 try{
  const records=await store.history(),list=$('#history-list');list.replaceChildren();
  if(!records.length)list.append(element('p','muted','Belum ada versi yang diterbitkan.'));
  for(const r of records){const row=element('div','history-row'),info=element('div');info.append(element('strong','','Versi '+r.revision),element('small','',new Date(r.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB'));const b=element('button','','Pulihkan ke draf');b.onclick=()=>{checkpoint(()=>{documentModel=validateLayout(r.document);selected=null;});$('#history-dialog').close();say('Versi '+r.revision+' dipulihkan ke draf.');};row.append(info,b);list.append(row);}$('#history-dialog').showModal();
 }catch(e){say('Riwayat gagal dimuat: '+e.message);}
};
$('#close-history').onclick=()=>$('#history-dialog').close();
$('#reload-design').onclick=async()=>{if(dirty&&!confirm('Abaikan perubahan lokal dan muat draf server?'))return;const {data:{session}}=await client.auth.getSession();await enter(false,session);};
$('#local-demo').onclick=()=>enter(true);
$('#logout').onclick=async()=>{if(dirty&&!confirm('Keluar dan abaikan perubahan yang belum disimpan?'))return;const wasDemo=demo;++sessionGeneration;sessionUserId=null;demo=false;active=false;documentModel=defaultLayout();undoStack=[];future=[];$('#studio').hidden=true;$('#gate').hidden=false;if(!wasDemo)await client.auth.signOut({scope:'local'});gateSay('Sesi editor ditutup.');};
$('#google-login').onclick=async()=>{if(!configured)return;const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('editor.html',location.href).href}});if(error)gateSay('Login Google belum berhasil. Coba lagi.');};
$('#email-login').onsubmit=async e=>{e.preventDefault();if(!configured)return;gateSay('Memeriksa akun…');const {data,error}=await client.auth.signInWithPassword({email:$('#email').value,password:$('#password').value});$('#password').value='';if(error)gateSay('Email atau kata sandi tidak sesuai, atau login email belum diaktifkan.');else await cloudSession(data.session);};
addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.source!=='god-time-layout')return;
 if(e.data.type==='ready'){ready=true;post('render',{document:documentModel});}
 if(!active)return;
 if(e.data.type==='select')select(e.data.id);
 if(e.data.type==='drop')drop(e.data);
 if(e.data.type==='error')say('Preview: '+e.data.message);
});
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'#redo':'#undo').click();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveDraft();}});
addEventListener('beforeunload',e=>{if(active&&dirty){e.preventDefault();e.returnValue='';}});
if(configured){
 client=managerClient();
 try{await finishOAuth(client,location,window.history);const {data:{session}}=await client.auth.getSession();if(session)await cloudSession(session);}catch(e){gateSay(e.message);}
 client.auth.onAuthStateChange((event,session)=>{if(demo)return;if(event==='SIGNED_OUT'){++sessionGeneration;sessionUserId=null;active=false;documentModel=defaultLayout();post('render',{document:documentModel});$('#studio').hidden=true;$('#gate').hidden=false;}else if(event==='SIGNED_IN'&&session?.user.id!==sessionUserId)setTimeout(()=>cloudSession(session),0);});
}else{$('#google-login').disabled=true;$('#email-login').hidden=true;gateSay('Koneksi server belum dikonfigurasi. Editor lokal tersedia untuk menyiapkan layout.');}

function sizeCanvas(){const scroller=$('.canvas-scroller'),shell=$('#frame-shell');const target={desktop:1280,tablet:768,mobile:390}[device];const cs=getComputedStyle(scroller);const available=scroller.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);if(available<1)return;const width=Math.min(available,target),scale=width/target;shell.style.width=width+'px';frame.style.width=target+'px';frame.style.height=(shell.clientHeight/scale)+'px';frame.style.transform='scale('+scale+')';frame.style.transformOrigin='top left';}
new ResizeObserver(sizeCanvas).observe($('.canvas-scroller'));
