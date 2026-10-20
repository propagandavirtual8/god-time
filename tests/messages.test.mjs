import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPublicMessage } from '../messages.js';
import { messagePeriod, validateMessage } from '../message-model.js';
import { civilDate, hebrew, plusDays } from '../calendar.js';
import { hebrewDayJakarta } from '../time.js';
import { publicConfig } from '../configuration.mjs';
import { finishOAuth } from '../auth.js';
import { messageStore, ConflictError } from '../message-store.js';

const entry = {year:5787,month:'cheshvan',title:'Title',body:'Body',verse:'Ayat',published:true};
function queryClient(result, calls = []) {
  const chain = new Proxy({}, {get(_target,key) { return (...args) => { calls.push([key,...args]); return key === 'maybeSingle' ? Promise.resolve(result) : chain; }; }});
  return {from:table=>{calls.push(['from',table]);return chain;}};
}
test('database responses and fallback never resurrect withdrawn messages', async () => {
  const h = {year:5787,key:'cheshvan'};
  const failFetch = () => { throw new Error('Legacy fallback must not be requested'); };
  for (const result of [{data:null,error:null},{data:null,error:{code:'offline'}},{data:{...entry,published:false},error:null},{data:{...entry,year:5786},error:null},{data:{...entry,verseText:{}},error:null}]) {
    assert.equal((await loadPublicMessage({client:queryClient(result),h,fetcher:failFetch})).entry,null);
  }
  const calls=[];
  assert.equal((await loadPublicMessage({client:queryClient({data:entry,error:null},calls),h})).entry,entry);
  assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='year'&&c[2]===5787));
  assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='month'&&c[2]==='cheshvan'));
  assert.equal((await loadPublicMessage({client:null,h,fetcher:async()=>({ok:true,json:async()=>({messages:[entry]})})})).entry.title,'Title');
  assert.equal((await loadPublicMessage({client:null,h,fetcher:async()=>({ok:false})})).entry,null);
});
test('calendar release windows track Jakarta sunset, Hebrew years and leap Adars', () => {
  for (const year of [5600,5786,5787,5788,6000]) {
    const leap=[0,3,6,8,11,14,17].includes(year%19);
    for (const month of ['nisan','tisyri','cheshvan',...(leap?['adar1','adar2']:['adar'])]) {
      const p=messagePeriod(year,month), start=new Date(p.visible_from), end=new Date(p.visible_until);
      assert.equal(hebrew(hebrewDayJakarta(start)).year,year);
      assert.equal(hebrew(hebrewDayJakarta(start)).key,month);
      assert.equal(hebrew(hebrewDayJakarta(new Date(+end-1))).key,month);
      assert.notEqual(hebrew(hebrewDayJakarta(end)).key,month);
      assert.equal(hebrew(plusDays(civilDate(start.toISOString().slice(0,10)),1)).day,1);
    }
  }
  assert.throws(()=>validateMessage({...entry,month:'adar'}));
  assert.throws(()=>validateMessage({...entry,title:'x'.repeat(181)}));
  assert.throws(()=>validateMessage({...entry,published:'true'}));
});
test('build config accepts only public credentials and HTTPS origins', () => {
  assert.deepEqual(publicConfig({}),{url:'',key:''});
  assert.throws(()=>publicConfig({SUPABASE_URL:'https://example.com'}));
  for(const key of ['sb_secret_bad','ey.'+Buffer.from('{"role":"service_role"}').toString('base64url')+'.x']) assert.throws(()=>publicConfig({SUPABASE_URL:'https://example.com',SUPABASE_PUBLISHABLE_KEY:key}));
  assert.throws(()=>publicConfig({SUPABASE_URL:'https://example.com/path',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}));
  assert.equal(publicConfig({SUPABASE_URL:'https://example.com',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}).url,'https://example.com');
});
test('PKCE callback exchanges a code once, removes it and does not follow redirect parameters', async () => {
  let called=0, cleaned;
  const client={auth:{exchangeCodeForSession:async code=>{called++;assert.equal(code,'abc');return {error:null};}}};
  await finishOAuth(client,{href:'https://example.com/kelola.html?code=abc&next=https://evil.example'},{replaceState:(_a,_b,url)=>cleaned=url});
  assert.equal(called,1); assert.equal(cleaned,'/kelola.html?next=https%3A%2F%2Fevil.example');
  await assert.rejects(finishOAuth(client,{href:'https://example.com/kelola.html?error=denied&error_description=secret'},{replaceState:(_a,_b,url)=>cleaned=url}),/dibatalkan/);
  assert.equal(cleaned,'/kelola.html'); assert.equal(called,1);
  await finishOAuth({auth:{exchangeCodeForSession:async(code,options)=>{assert.equal(code,'second');assert.deepEqual(options,{flowId:'flow-123'});return {error:null};}}},{href:'https://example.com/kelola.html?code=second&sb_flow_id=flow-123'},{replaceState:(_a,_b,url)=>cleaned=url});
  assert.equal(cleaned,'/kelola.html');
});
test('CRUD uses inserts for new periods and compare-and-set for update/delete', async () => {
  const previous={...entry,id:'id1',revision:2},calls=[];
  const store=messageStore(queryClient({data:previous,error:null},calls));
  await store.save(entry); assert.ok(calls.some(c=>c[0]==='insert'));
  calls.length=0; await store.save(entry,previous);
  assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='revision'&&c[2]===2));
  assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]==='id1'));
  await store.remove(previous);
  await assert.rejects(messageStore(queryClient({data:null,error:null})).save(entry,previous),ConflictError);
  await assert.rejects(messageStore(queryClient({data:null,error:{code:'23505'}})).save(entry),ConflictError);
  await assert.rejects(messageStore(queryClient({data:null,error:null})).remove(previous),ConflictError);
});
