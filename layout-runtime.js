import {validateLayout,layoutCSS,widgets} from './layout-model.js';
import {publicClient} from './supabase-client.js';
const preview=new URL(location.href).searchParams.get('layout-preview')==='1'&&window.parent!==window;
let originals,parking,style,selected='',interactive=false,current;
function prepare(){
 if(originals)return;
 originals={};
 for(const [type,widget] of Object.entries(widgets))if(widget.native)originals[type]=document.querySelector(widget.native);
 parking=document.createElement('div');parking.hidden=true;parking.id='layout-parking';document.body.append(parking);
 style=document.createElement('style');style.id='layout-rules';document.head.append(style);
 document.querySelector('main>.section-divider')?.remove();
}
function send(type,data={}){if(preview)parent.postMessage({source:'god-time-layout',type,...data},location.origin);}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function renderNode(n){
 const box=el('div','gt-layout-node gt-'+n.type);box.dataset.layoutId=n.id;box.dataset.layoutLabel=n.label;
 if(widgets[n.type].native){const native=originals[n.type];if(native)box.append(native);}
 else if(n.type==='container')n.children.forEach(c=>box.append(renderNode(c)));
 else if(n.type==='heading'){box.append(el(n.props.tag,'gt-heading',n.props.text));}
 else if(n.type==='text')box.append(el('p','gt-text',n.props.text));
 else if(n.type==='image'){if(n.props.src){const image=el('img','gt-image');image.src=n.props.src;image.alt=n.props.alt;image.loading='lazy';box.append(image);}else if(preview)box.append(el('div','gt-image-empty','▧ Pilih gambar di panel pengaturan'));}
 else if(n.type==='button'){const link=el('a','primary-button',n.props.text);link.href=n.props.href;box.append(link);}
 else if(n.type==='divider')box.append(el('hr','gt-divider'));
 if(preview&&!interactive){
  box.tabIndex=0;box.setAttribute('role','group');box.setAttribute('aria-label','Edit '+n.label);box.draggable=true;
  box.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();send('select',{id:n.id});});
  box.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send('select',{id:n.id});}});
  box.addEventListener('dragstart',e=>{e.stopPropagation();e.dataTransfer.setData('text/plain',JSON.stringify({id:n.id}));});
  box.addEventListener('dragover',e=>{e.preventDefault();e.stopPropagation();box.classList.add('gt-drop');});
  box.addEventListener('dragleave',()=>box.classList.remove('gt-drop'));
  box.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();box.classList.remove('gt-drop');try{const source=JSON.parse(e.dataTransfer.getData('text/plain'));const r=box.getBoundingClientRect();send('drop',{...source,target:n.id,position:n.type==='container'&&e.clientY>r.top+20&&e.clientY<r.bottom-20?'inside':e.clientY>r.top+r.height/2?'after':'before'});}catch{}});
 }
 return box;
}
export function applyLayout(input){
 const doc=validateLayout(input);prepare();current=doc;
 // Keep every application's original DOM in-document, including hidden widgets.
 for(const native of Object.values(originals))if(native)parking.append(native);
 const main=document.querySelector('main');
 main.replaceChildren(...doc.nodes.map(renderNode));main.classList.add('gt-layout-page');
 style.textContent=layoutCSS(doc);
 const s=doc.site;
 for(const [key,val] of Object.entries({'--paper':s.background,'--ink':s.color,'--green':s.accent,'--sans':'"'+s.font+'",Arial,sans-serif','--serif':'"'+s.font+'",Arial,sans-serif'}))document.documentElement.style.setProperty(key,val);
 const logo=document.querySelector('.brand-ehop img'),brand=document.querySelector('.brand-ehop');
 if(logo){logo.src=s.logo;logo.alt=s.logoAlt;}
 if(brand)brand.style.width=s.logoWidth+'px';
 const header=document.querySelector('.site-header');if(header)header.style.background=s.headerBackground;
 document.body.classList.toggle('gt-edit-mode',preview&&!interactive);
 mark(selected);
}
function mark(id){selected=id;for(const e of document.querySelectorAll('[data-layout-id]'))e.classList.toggle('gt-selected',e.dataset.layoutId===id);}
export async function startLayout(){
 if(preview){
  addEventListener('message',e=>{
   if(e.origin!==location.origin||e.source!==parent||e.data?.source!=='god-time-editor')return;
   try{
    if(e.data.type==='render'){applyLayout(e.data.document);send('rendered');}
    if(e.data.type==='select'){mark(e.data.id);document.querySelector('[data-layout-id="'+selected+'"]')?.scrollIntoView({block:'nearest',behavior:'smooth'});}
    if(e.data.type==='interactive'){interactive=!!e.data.value;if(current)applyLayout(current);}
   }catch(error){send('error',{message:error.message});}
  });
  send('ready');return;
 }
 const client=publicClient();if(!client)return;
 try{
  const {data,error}=await client.from('god_time_layout_published').select('document').eq('id','home').maybeSingle();
  if(!error&&data?.document)applyLayout(data.document);
 }catch{/* Preserve the original homepage on missing config, migration, or network errors. */}
}
