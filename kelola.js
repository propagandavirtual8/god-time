import {hebrew,todayJakarta} from './calendar.js';
const $=s=>document.querySelector(s),form=$('#message-form');
let records=[],output='',loaded=false;
const h=hebrew(todayJakarta());$('#year').value=h.year;$('#month').value=h.key;
const ids=['title','subtitle','verse','verseText','author','body','memoryVerse','memoryText'];
function loadSelection(){const record=records.find(m=>m.year===Number($('#year').value)&&m.month===$('#month').value);for(const id of ids)$('#'+id).value=record?.[id]||'';$('#published').checked=record?.published===true;invalidate();}
function invalidate(){output='';$('#download').disabled=true;$('#copy').disabled=true;$('#output').textContent='';$('#preview').hidden=true;}
function assertMonth(){const year=Number($('#year').value),month=$('#month').value,leap=[0,3,6,8,11,14,17].includes(year%19);return leap?month!=='adar':!['adar1','adar2'].includes(month);}
form.addEventListener('input',invalidate);
$('#year').addEventListener('change',loadSelection);$('#month').addEventListener('change',loadSelection);
form.addEventListener('submit',e=>{e.preventDefault();if(!loaded){$('#status').textContent='Data pesan belum berhasil dimuat. Muat ulang halaman agar pesan yang sudah ada tetap terjaga.';return;}if(!assertMonth()){$('#status').textContent='Bulan Adar tidak sesuai tahun ini. Gunakan Adar I/II pada tahun kabisat, atau Adar pada tahun biasa.';return;}
 const entry={year:Number($('#year').value),month:$('#month').value,published:$('#published').checked};for(const id of ids)entry[id]=$('#'+id).value.trim();
 records=records.filter(m=>!(m.year===entry.year&&m.month===entry.month));records.push(entry);output=JSON.stringify({version:1,messages:records},null,2)+'\n';
 $('#output').textContent=output;$('#download').disabled=false;$('#copy').disabled=false;$('#preview-title').textContent=entry.title;$('#preview-subtitle').textContent=entry.subtitle;$('#preview-verse').textContent='Bacaan: '+entry.verse;$('#preview-verse-text').textContent=entry.verseText;$('#preview-body').textContent=entry.body;$('#preview').hidden=false;$('#status').textContent='Pesan disiapkan. Simpan melalui GitHub untuk memperbarui website. Data bulan lain tetap disertakan.';
});
$('#download').addEventListener('click',()=>{if(!output)return;const url=URL.createObjectURL(new Blob([output],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='messages.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('#copy').addEventListener('click',async()=>{if(!output)return;try{await navigator.clipboard.writeText(output);window.open('https://github.com/propagandavirtual8/god-time/edit/main/messages.json','_blank','noopener,noreferrer');$('#status').textContent='Data disalin. Di GitHub, ganti seluruh isi messages.json dengan data ini, lalu Commit changes. Jika tab tidak terbuka, buka tautan editor dari panduan repository.';}catch{$('#status').textContent='Clipboard tidak tersedia. Unduh data pesan, lalu salin isinya ke messages.json melalui editor GitHub.';}});
try{const response=await fetch('./messages.json',{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.messages))throw new Error();records=data.messages;loaded=true;loadSelection();$('#status').textContent='Data termuat. Pilih bulan dan tahun, lalu isi pesan. Saat menerbitkan, gunakan data terbaru dan satu pengelola pada satu waktu.';}catch{$('#status').textContent='Data pesan gagal dimuat. Muat ulang sebelum menyimpan agar arsip pesan tidak tertimpa.';}
