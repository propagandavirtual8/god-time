// ICU's Hebrew calendar provides the fixed Hebrew calendar, including leap months.
// All arithmetic uses UTC noon; Asia/Jakarta is used only to choose the civil date.
const DAY = 86400000;
const fmt = new Intl.DateTimeFormat('en-u-ca-hebrew', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' });
export const monthNames = ['Nisan','Iyar','Sivan','Tamuz','Av','Elul','Tisyri','Cheshvan','Kislev','Tevet','Shevat','Adar'];
const canonical = { Nisan:'nisan', Iyar:'iyar', Sivan:'sivan', Tamuz:'tamuz', Tammuz:'tamuz', Av:'av', Elul:'elul', Tishri:'tisyri', Tishrei:'tisyri', Heshvan:'cheshvan', Cheshvan:'cheshvan', Kislev:'kislev', Tevet:'tevet', Shevat:'shevat', Adar:'adar', 'Adar I':'adar1', 'Adar II':'adar2' };
export function civilDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Tanggal tidak valid');
  const d = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(+d) || d.toISOString().slice(0,10) !== value) throw new RangeError('Tanggal tidak valid');
  return d;
}
export function iso(d) { return d.toISOString().slice(0,10); }
export function plusDays(d,n) { return new Date(+d+n*DAY); }
export function todayJakarta(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Jakarta'}).formatToParts(now).map(x=>[x.type,x.value]));
  return civilDate(`${p.year}-${p.month}-${p.day}`);
}
export function hebrew(d) {
  const p = Object.fromEntries(fmt.formatToParts(d).map(x=>[x.type,x.value]));
  const key = canonical[p.month];
  if (!key) throw new Error(`Bulan kalender tidak dikenal: ${p.month}`);
  const base = key.startsWith('adar') ? 'adar' : key;
  const name = key === 'adar1' ? 'Adar I' : key === 'adar2' ? 'Adar II' : monthNames[['nisan','iyar','sivan','tamuz','av','elul','tisyri','cheshvan','kislev','tevet','shevat','adar'].indexOf(base)];
  return {day:Number(p.day),year:Number(p.year),key,base,name};
}
export function monthStart(d) { return plusDays(d,1-hebrew(d).day); }
export function monthDays(d) {
  const start = monthStart(d), h=hebrew(start), days=[];
  for (let i=0;i<30;i++) { const date=plusDays(start,i); if (hebrew(date).key!==h.key) break; days.push(date); }
  return days;
}
export function shiftMonth(d, step) {
  const start=monthStart(d);
  return step<0 ? monthStart(plusDays(start,-1)) : plusDays(start,monthDays(start).length);
}
export function yearMonths(d) {
  let cursor=monthStart(d); const year=hebrew(d).year;
  for(let i=0;i<13 && hebrew(plusDays(cursor,-1)).year===year;i++) cursor=shiftMonth(cursor,-1);
  const list=[];
  for(let i=0;i<13 && hebrew(cursor).year===year;i++){ list.push(cursor); cursor=shiftMonth(cursor,1); }
  return list;
}
export function holidays(d, mode='israel') {
  const h=hebrew(d), n=h.day, m=h.key, out=[];
  const add=(title,kind,ref,detail)=>out.push({title,kind,ref,detail});
  if((n===1 && m!=='tisyri') || n===30) add('Rosh Chodesh','Awal bulan','Bilangan 28:11–15','Awal bulan; bila bulan sebelumnya 30 hari, peringatannya mencakup dua hari.');
  if(m==='nisan' && n===14) add('Persiapan Pesakh','Alkitab','Imamat 23:5','Korban Paskah pada tanggal 14; perayaan dimulai pada malam memasuki tanggal 15.');
  if(m==='nisan' && n>=15 && n<=(mode==='diaspora'?22:21)) add('Pesakh · Paskah Yahudi','Alkitab','Keluaran 12; Imamat 23:6–8','Mengenang keluarnya Israel dari Mesir; Hari Raya Roti Tidak Beragi.');
  if(m==='iyar' && n===14) add('Pesakh Sheni','Alkitab','Bilangan 9:9–12','Kesempatan merayakan Paskah pada bulan kedua bagi yang berhalangan menurut ketentuan Taurat.');
  if(m==='iyar' && n===18) add('Lag BaOmer','Tradisi','Tradisi penghitungan Omer','Hari ke-33 penghitungan Omer.');
  if(m==='sivan' && (n===6 || (mode==='diaspora' && n===7))) add('Shavuot · Hari Raya Tujuh Minggu','Alkitab & tradisi','Imamat 23:15–21; Kisah Para Rasul 2','Hari raya setelah tujuh minggu; dalam tradisi Yahudi dikaitkan dengan pemberian Taurat.');
  if(m==='tamuz' && ((n===17&&d.getUTCDay()!==6)||(n===18&&d.getUTCDay()===0))) add('Puasa 17 Tamuz','Tradisi','Zakharia 8:19','Awal masa tiga minggu perkabungan; puasa ditunda bila tanggal 17 jatuh pada Sabat.');
  if(m==='av' && ((n===9&&d.getUTCDay()!==6)||(n===10&&d.getUTCDay()===0))) add('Tisha BeAv','Tradisi','Ratapan; Zakharia 8:19','Peringatan kehancuran Bait Suci; puasa ditunda bila tanggal 9 jatuh pada Sabat.');
  if(m==='av' && n===15) add('Tu BeAv','Tradisi','Tradisi Yahudi','Hari sukacita dalam tradisi Yahudi.');
  if(m==='tisyri' && n<=2) add('Rosh Hashanah · Tahun Baru Yahudi','Alkitab & tradisi','Imamat 23:23–25; Bilangan 29:1','Tanggal 1 adalah Yom Teruah dalam Taurat; Rosh Hashanah diperingati dua hari dalam kalender Yahudi.');
  if(m==='tisyri' && ((n===3&&d.getUTCDay()!==6)||(n===4&&d.getUTCDay()===0))) add('Puasa Gedalya','Tradisi','2 Raja-raja 25:22–26','Peringatan wafatnya Gedalya.');
  if(m==='tisyri' && n===10) add('Yom Kippur · Hari Pendamaian','Alkitab','Imamat 16; 23:26–32','Waktu merendahkan diri dan mengingat pendamaian.');
  if(m==='tisyri' && n>=15 && n<=21) add(n===21?'Sukkot · Hoshana Rabbah':'Sukkot · Hari Raya Pondok Daun','Alkitab & tradisi','Imamat 23:33–43','Tujuh hari mengingat pemeliharaan Tuhan atas Israel di padang gurun.');
  if(m==='tisyri' && n===22) add(mode==='diaspora'?'Shemini Atzeret':'Shemini Atzeret · Simchat Torah','Alkitab & tradisi','Imamat 23:36','Pertemuan hari kedelapan; Simchat Torah merayakan siklus pembacaan Taurat.');
  if(m==='tisyri' && n===23 && mode==='diaspora') add('Simchat Torah','Tradisi','Siklus pembacaan Taurat','Dirayakan terpisah dari Shemini Atzeret dalam kebiasaan diaspora.');
  if(m==='kislev' && n>=25) add('Hanukkah · Hari Raya Penahbisan','Sejarah & tradisi','Yohanes 10:22','Delapan hari peringatan penahbisan kembali Bait Suci.');
  if(m==='tevet') {
    const kislevDays=monthDays(plusDays(monthStart(d),-1)).length;
    if(n<=8-(kislevDays-24)) add('Hanukkah · Hari Raya Penahbisan','Sejarah & tradisi','Yohanes 10:22','Kelanjutan delapan hari perayaan yang dimulai pada 25 Kislev.');
    if(n===10) add('Puasa 10 Tevet','Tradisi','2 Raja-raja 25:1; Yehezkiel 24:1–2','Mengenang dimulainya pengepungan Yerusalem.');
  }
  if(m==='shevat' && n===15) add('Tu BiShevat','Tradisi','Tradisi tahun baru pepohonan','Penanda tahun untuk pepohonan dalam tradisi Yahudi.');
  if(m==='adar1' && n===14) add('Purim Katan','Tradisi','Tradisi tahun kabisat','Peringatan kecil; Purim utama berlangsung pada Adar II.');
  if((m==='adar'||m==='adar2') && n===14) add('Purim','Alkitab','Ester 9:20–22','Mengenang pembebasan orang Yahudi dalam kisah Ester, dengan sukacita dan pemberian kepada yang membutuhkan.');
  if((m==='adar'||m==='adar2') && n===15) add('Shushan Purim','Alkitab & tradisi','Ester 9:18–19','Tanggal perayaan di kota bertembok tertentu, termasuk Yerusalem.');
  return out;
}
