import test from 'node:test';
import assert from 'node:assert/strict';
import {civilDate as d, hebrew, iso, plusDays, todayJakarta, monthDays, shiftMonth, yearMonths, holidays} from './calendar.js';
import {months} from './content.js';
test('konversi pembanding Hebcal: tanggal hari ini, tahun baru, dan Adar I–II',()=>{
 for(const [date,key,day,year] of [['2026-10-16','cheshvan',5,5787],['2026-09-12','tisyri',1,5787],['2027-02-08','adar1',1,5787],['2027-03-10','adar2',1,5787],['2027-03-11','adar2',2,5787]]){
  const h=hebrew(d(date));assert.equal(h.key,key);assert.equal(h.day,day);assert.equal(h.year,year);
 }
});
test('tanggal sipil konsisten dalam zona WIB, termasuk pergantian hari UTC',()=>{
 assert.equal(iso(todayJakarta(new Date('2026-10-15T18:00:00Z'))),'2026-10-16');
 assert.equal(iso(todayJakarta(new Date('2026-10-15T16:59:00Z'))),'2026-10-15');
});
test('tanggal tidak valid ditolak',()=>{for(const s of ['','2026-02-30','abc','2026-13-01'])assert.throws(()=>d(s),RangeError);});
test('tahun biasa 12 bulan dan tahun kabisat 13 bulan, meliputi seluruh rentang aplikasi',()=>{
 for(let year=1900;year<=2100;year++){
  const anchor=d(`${year}-10-16`), list=yearMonths(anchor), hy=hebrew(anchor).year;
  const leap=[0,3,6,8,11,14,17].includes(hy%19);
  assert.equal(list.length,leap?13:12);
  assert.equal(hebrew(list[0]).key,'tisyri');
  for(const date of list){assert.equal(hebrew(date).year,hy);assert.ok([29,30].includes(monthDays(date).length));assert.equal(iso(shiftMonth(shiftMonth(date,1),-1)),iso(date));assert.ok(months.some(m=>m.key===hebrew(date).base));}
 }
});
test('Hanukkah selalu delapan hari, termasuk saat Kislev 29 atau 30 hari',()=>{
 for(let year=2020;year<=2040;year++){
  const list=yearMonths(d(`${year}-12-01`)),kislev=list.find(date=>hebrew(date).key==='kislev');
  let count=0;for(let n=24;n<40;n++){const date=plusDays(kislev,n);count+=holidays(date).some(e=>e.title.startsWith('Hanukkah'))?1:0;}
  assert.equal(count,8);
 }
});
test('Purim pada Adar II, Purim Katan pada Adar I',()=>{
 assert.ok(holidays(d('2027-03-23')).some(e=>e.title==='Purim'));
 assert.ok(holidays(d('2027-02-21')).some(e=>e.title==='Purim Katan'));
 assert.ok(!holidays(d('2027-02-21')).some(e=>e.title==='Purim'));
});
test('perbedaan Israel–diaspora dan Rosh Chodesh Tisyri',()=>{
 const list=yearMonths(d('2026-10-16')),tishri=list[0],nisan=list.find(x=>hebrew(x).key==='nisan'),sivan=list.find(x=>hebrew(x).key==='sivan');
 assert.ok(!holidays(tishri).some(x=>x.title==='Rosh Chodesh'));
 assert.ok(!holidays(plusDays(nisan,21),'israel').some(x=>x.title.startsWith('Pesakh ·')));
 assert.ok(holidays(plusDays(nisan,21),'diaspora').some(x=>x.title.startsWith('Pesakh ·')));
 assert.ok(!holidays(plusDays(sivan,6),'israel').some(x=>x.title.startsWith('Shavuot')));
 assert.ok(holidays(plusDays(sivan,6),'diaspora').some(x=>x.title.startsWith('Shavuot')));
});
test('puasa 9 Av ditunda dari Sabat ke Minggu',()=>{
 const av=yearMonths(d('2022-08-01')).find(x=>hebrew(x).key==='av');
 assert.equal(plusDays(av,8).getUTCDay(),6);
 assert.ok(!holidays(plusDays(av,8)).some(x=>x.title==='Tisha BeAv'));
 assert.ok(holidays(plusDays(av,9)).some(x=>x.title==='Tisha BeAv'));
});
