import { civilDate, iso, plusDays, todayJakarta, hebrew, monthStart, monthDays, shiftMonth, yearMonths, holidays } from './calendar.js';
import { months, lessons, globalPrayers, mainSource, tribeSource } from './content.js';
import { selectMessage } from './messages.js';
import { sunsetJakarta, afterSunsetJakarta, formatJakartaTime } from './time.js';
let messageRecords=[];
function renderMainMessage(){
 const date=chosenToday(),h=hebrew(date),p=profile(date),entry=selectMessage(messageRecords,h),days=monthDays(date);
 const title=entry?.title||p.title,verse=entry?.verse||p.verse,body=entry?.body||p.reflection;
 const range=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',timeZone:'UTC'});
 $('#message-status').textContent=entry?'Pesan bulan ini':'Renungan pengantar';
 $('#monthly-message').innerHTML=`<article class="message-main"><header class="message-heading"><p class="eyebrow">ROSH CHODESH ${escape(h.name.toUpperCase())} ${h.year}</p><p class="message-period">${range.format(days[0])} – ${range.format(days.at(-1))}</p><h3>${escape(title)}</h3>${entry?.subtitle?`<p class="message-subtitle">“${escape(entry.subtitle)}”</p>`:''}</header><p class="verse">Bacaan: ${escape(verse)}</p>${entry?.verseText?`<blockquote class="reading-quote">“${escape(entry.verseText)}”</blockquote>`:''}<div class="message-body">${body.split(/\n\s*\n/).map(t=>`<p>${escape(t).replaceAll('\n','<br>')}</p>`).join('')}</div>${entry?.author?`<p class="message-author">${escape(entry.author)}</p>`:''}</article>`;
 $('#memory-reference').textContent=entry?.memoryVerse||verse;
 $('#memory-text').textContent=entry?.memoryText||entry?.verseText||'Baca dan hafalkan bagian firman ini hari ini.';
 $('#sunset-info').textContent='Estimasi matahari terbenam hari ini: '+formatJakartaTime(sunsetJakarta(todayJakarta()))+' WIB · Jakarta';
}
async function loadMessages(){try{const response=await fetch('./messages.json',{cache:'no-store'});if(!response.ok)throw new Error('Data pesan belum tersedia');const data=await response.json();messageRecords=Array.isArray(data.messages)?data.messages:[];}catch{messageRecords=[];}renderMainMessage();}

const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateFmt=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const shortFmt=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',timeZone:'UTC'});
let civil=todayJakarta(), selected=civil, view=monthStart(selected), mode='israel', afterSunset=afterSunsetJakarta(), manualSunset=false;
const shapes={
 lion:'<path d="M9 12 6 8l5-3 5 2 5-2 5 3-3 4v8l-7 7-7-7Z"/><path d="m12 14 2 1m6-1-2 1m-4 4 2 2 2-2m-2 2v3M5 14l-2 3 3 3m21-6 2 3-3 3"/>',
 sun:'<circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3"/>',
 ship:'<path d="m3 21 4 7h18l4-7ZM16 3v18M14 6 5 18h9m5-10 7 10h-7"/>',
 water:'<path d="M3 12q3-4 7 0t9 0 10 0M3 19q3-4 7 0t9 0 10 0M3 26q3-4 7 0t9 0 10 0"/>',
 gate:'<path d="M6 28V10l10-5 10 5v18M3 28h26M11 28V17a5 5 0 0 1 10 0v11M6 10h20M3 6h26"/>',
 tent:'<path d="m3 27 13-22 13 22ZM16 5v22m0-12-7 12m7-12 7 12M9 3l7 2 7-2"/>',
 grain:'<path d="M16 29V7m0 6c-8 0-8-8-8-8s8 0 8 8Zm0 8c-8 0-9-8-9-8s9 0 9 8Zm0-4c8 0 9-8 9-8s-9 0-9 8Zm0 9c8 0 9-8 9-8s-9 0-9 8Z"/>',
 branch:'<path d="M6 27 24 7M14 18C4 18 5 8 5 8s11 0 9 10Zm5-5c-1-10 9-10 9-10s0 10-9 10Zm-9 10c10 3 14-6 14-6s-10-3-14 6Z"/>',
 wolf:'<path d="M7 5 15 10l6-2 6 5-1 8-10 7-8-6-4-8ZM7 5l2 13 7 6 8-7M13 15h2m6-1h2m-7 8 2-2 2 1"/>',
 scales:'<path d="M16 4v24M8 28h16M5 9h22M7 9l-5 11h10Zm18 0-5 11h10ZM2 20q5 7 10 0m8 0q5 7 10 0"/>',
 tree:'<path d="M16 29V15m0 8-7-5m7 2 7-6M6 22a6 6 0 0 1-2-11 7 7 0 0 1 13-6 7 7 0 0 1 10 8 6 6 0 0 1-4 11M10 29h12"/>',
 deer:'<path d="M11 14 9 9l2-6m-2 6L4 6M21 14l2-5-2-6m2 6 5-3M10 13l6 3 6-3-2 11-4 5-4-5ZM13 19h1m5 0h-1m-3 5h2"/>'
};
function icon(name){return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]||shapes.branch}</svg>`;}
function profile(d){return months.find(x=>x.key===hebrew(d).base);}
function chosenToday(){return plusDays(todayJakarta(),afterSunset?1:0);}
function renderToday(){renderMainMessage();const date=chosenToday(),h=hebrew(date);$('#today-hebrew').textContent=`${h.day} ${h.name} ${h.year}`;$('#today-civil').textContent=dateFmt.format(todayJakarta())+(afterSunset?' · sesudah matahari terbenam':' · tanggal sipil');$('#today-season').textContent=profile(date).season+' di Israel';$('#after-sunset').checked=afterSunset;}
function renderCalendar(){
 const h=hebrew(view), days=monthDays(view), p=profile(view), current=iso(chosenToday());
 $('#month-title').textContent=`${h.name} ${h.year}`;
 $('#month-kicker').textContent=`BULAN KE-${p.number} DARI NISAN${h.key==='adar1'||h.key==='adar2'?' · TAHUN KABISAT':''}`;
 $('#month-range').textContent=`${dateFmt.format(days[0])} – ${dateFmt.format(days.at(-1))}`;
 const blanks=Array.from({length:days[0].getUTCDay()},()=>'<span class="calendar-cell empty" aria-hidden="true"></span>').join('');
 $('#calendar-grid').innerHTML=blanks+days.map(d=>{
  const day=hebrew(d),events=holidays(d,mode), date=iso(d), isToday=date===current, isSelected=date===iso(selected);
  const label=`${day.day} ${day.name} ${day.year}, ${dateFmt.format(d)}${events.length?', '+events.map(e=>e.title).join(', '):''}`;
  return `<button type="button" class="calendar-cell${isToday?' today':''}${isSelected?' selected':''}" data-date="${date}" aria-label="${escape(label)}" aria-pressed="${isSelected}"${isToday?' aria-current="date"':''}><span class="hebrew-number">${day.day}</span><span class="civil-number">${escape(shortFmt.format(d))}</span>${events.length?'<span class="event-dot" aria-hidden="true"></span>':''}</button>`;
 }).join('');
 const previous=shiftMonth(view,-1),next=shiftMonth(view,1);
 $('#prev-month').disabled=iso(previous)<'1900-01-01';$('#next-month').disabled=iso(next)>'2100-12-31';
 $('#day-heading').textContent=`${hebrew(selected).day} ${hebrew(selected).name}`;
 $('#day-civil').textContent=dateFmt.format(selected);
 const events=holidays(selected,mode);
 $('#day-events').innerHTML=events.length?events.map(e=>`<article class="event-card"><span class="event-label">${escape(e.kind)}</span><h4>${escape(e.title)}</h4><p>${escape(e.detail)}</p><small>${escape(e.ref)}</small></article>`).join(''):'<div class="empty-event"><strong>Ruang untuk bertumbuh.</strong><p>Tidak ada hari peringatan yang ditandai pada tanggal ini. Kamu tetap dapat membaca kisah dan merenungkan firman untuk bulan pilihan.</p></div>';
 $('#mini-icon').innerHTML=icon(p.icon);$('#mini-month').textContent=h.name;$('#mini-tribe').textContent=`Suku ${p.tribe} · menurut tradisi`;
 const list=yearMonths(view);
 $('#month-buttons').innerHTML=months.map(m=>{
 const matching=list.filter(d=>hebrew(d).base===m.key);
 const dateInfo=matching.map(start=>{const end=monthDays(start).at(-1),eve=plusDays(start,-1);return `<small class="month-dates">${matching.length>1?escape(hebrew(start).name)+': ':''}${shortFmt.format(start)}${start.getUTCFullYear()!==end.getUTCFullYear()?` ${start.getUTCFullYear()}`:""} – ${shortFmt.format(end)} ${end.getUTCFullYear()}</small><small class="month-start">Mulai ${shortFmt.format(eve)} · ≈${formatJakartaTime(sunsetJakarta(eve))} WIB</small>`;}).join('');
 return `<button type="button" class="month-button${p.key===m.key?' active':''}" data-month="${m.key}" aria-pressed="${p.key===m.key}" aria-label="Pelajari ${m.name}, suku ${m.tribe}">${icon(m.icon)}<strong>${m.name}</strong><span>${m.tribe}</span>${dateInfo}</button>`;
 }).join('');
 let adarControls='';
 if(p.key==='adar'&&list.some(d=>hebrew(d).key==='adar1')) adarControls='<div class="month-controls" style="margin-bottom:15px"><button class="light-button" data-adar="adar1">Buka Adar I</button><button class="light-button" data-adar="adar2">Buka Adar II</button></div>';
 $('#month-profile').innerHTML=`<div><div class="profile-heading"><h3>${escape(h.name)}</h3><span lang="he" dir="rtl">${p.hebrew}</span></div><p class="profile-meta">Bulan ke-${p.number} · ${escape(p.season)} di Israel · sekitar ${p.approx}</p>${adarControls}<p class="profile-summary">${escape(p.summary)}</p><a class="inline-link" href="${p.url}" target="_blank" rel="noopener noreferrer">Rujukan bulan ${p.name} <span aria-hidden="true">↗</span></a></div><div><p class="timeline-title">PERISTIWA & PERINGATAN</p>${p.events.map(e=>`<article class="timeline-item"><small>${escape(e[0])}</small><span class="type-tag">${escape(e[3])}</span><h4>${escape(e[1])}</h4><p>${escape(e[2])}</p></article>`).join('')}</div>`;

}
function choose(date, updateInput=true){selected=date;view=monthStart(date);if(updateInput){civil=plusDays(date,afterSunset?-1:0);$('#date-picker').value=iso(civil);}renderCalendar();}
$('#calendar-grid').addEventListener('click',e=>{const b=e.target.closest('[data-date]');if(b)choose(civilDate(b.dataset.date));});
$('#prev-month').addEventListener('click',()=>choose(shiftMonth(view,-1)));
$('#next-month').addEventListener('click',()=>choose(shiftMonth(view,1)));
$('#today-button').addEventListener('click',()=>choose(chosenToday()));
$('#month-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-month]');if(!b)return;const candidates=yearMonths(view).filter(d=>hebrew(d).base===b.dataset.month);choose(candidates.at(-1));});
$('#month-profile').addEventListener('click',e=>{const b=e.target.closest('[data-adar]');if(b)choose(yearMonths(view).find(d=>hebrew(d).key===b.dataset.adar));});
$('#date-picker').addEventListener('change',e=>{try{const date=civilDate(e.target.value);if(iso(date)<'1900-01-01'||iso(date)>'2100-12-31')throw new RangeError();civil=date;choose(plusDays(civil,afterSunset?1:0),false);e.target.setCustomValidity('');}catch{e.target.setCustomValidity('Pilih tanggal antara 1 Januari 1900 dan 31 Desember 2100.');e.target.reportValidity();}});
$('#after-sunset').addEventListener('change',e=>{manualSunset=true;afterSunset=e.target.checked;choose(plusDays(civil,afterSunset?1:0),false);renderToday();});
$('#observance').addEventListener('change',e=>{mode=e.target.value;renderCalendar();});
$('#prayer-cards').innerHTML=globalPrayers.map((p,i)=>`<article class="prayer-card panel"><h3>${escape(p[0])}</h3><p>${escape(p[1])}</p><small>${escape(p[2])}</small></article>`).join('');
$('#lessons').innerHTML=lessons.map(l=>`<details><summary>${escape(l[0])}</summary><p>${escape(l[1])}</p><small>${escape(l[2])}</small></details>`).join('');
$('#root-source').href=mainSource;
$('#source-list').innerHTML=`<p class="source-link-row"><a href="${mainSource}" target="_blank" rel="noopener noreferrer">Hebrew for Christians · Rosh Chodesh</a></p><div class="source-links">${months.map(m=>`<a href="${m.url}" target="_blank" rel="noopener noreferrer">Materi ${m.name} ↗</a>`).join('')}</div><p class="source-link-row"><a href="${tribeSource}" target="_blank" rel="noopener noreferrer">Rujukan tambahan: variasi hubungan bulan–suku</a></p><p class="source-link-row"><a href="https://www.hebcal.com/converter" target="_blank" rel="noopener noreferrer">Hebcal · pembanding konversi tanggal</a></p>`;
const dialog=$('#source-dialog');
for(const id of ['#source-button','#footer-sources'])$(id).addEventListener('click',()=>dialog.showModal());
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#date-picker').value=iso(civil);renderToday();renderCalendar();loadMessages();
let dayKey=iso(todayJakarta())+'|'+afterSunset;
setInterval(()=>{if(!manualSunset)afterSunset=afterSunsetJakarta();const next=iso(todayJakarta())+'|'+afterSunset;if(next!==dayKey){dayKey=next;renderToday();renderCalendar();loadMessages();}},60000);
