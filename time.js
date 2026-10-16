import {todayJakarta,plusDays} from './calendar.js';
// NOAA fractional-year approximation; Jakarta city centre, sea-level apparent sunset.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function sunsetJakarta(date){
 const year=date.getUTCFullYear(),n=Math.floor((Date.UTC(year,date.getUTCMonth(),date.getUTCDate())-Date.UTC(year,0,1))/86400000)+1;
 const days=(year%4===0&&(year%100!==0||year%400===0))?366:365,g=2*Math.PI/days*(n-1),rad=Math.PI/180;
 const eq=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
 const dec=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
 const lat=-6.2088*rad,ha=Math.acos((Math.cos(90.833*rad)/(Math.cos(lat)*Math.cos(dec)))-Math.tan(lat)*Math.tan(dec))/rad;
 const localMinutes=720-4*106.8456-eq+420+4*ha;
 return new Date(Date.UTC(year,date.getUTCMonth(),date.getUTCDate())+(localMinutes-420)*60000);
}
export function afterSunsetJakarta(now=new Date()){return +now>=+sunsetJakarta(todayJakarta(now));}
export function hebrewDayJakarta(now=new Date()){return plusDays(todayJakarta(now),afterSunsetJakarta(now)?1:0);}
export function formatJakartaTime(date){return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta',hourCycle:'h23'}).format(date);}
