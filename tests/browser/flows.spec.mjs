import { test, expect } from '@playwright/test';
import { hebrew } from '../../calendar.js';
import { hebrewDayJakarta } from '../../time.js';

const userId='00000000-0000-0000-0000-000000000001';
const h=hebrew(hebrewDayJakarta());
const base={id:'message-1',year:h.year,month:h.key,revision:1,published:true,title:'Pesan dari database',subtitle:'Subjudul',verse:'Ayat 1:1',verseText:'Teks ayat',author:'Penulis',body:'Paragraf pertama.\n\nParagraf kedua.',memoryVerse:'Ayat 1:1',memoryText:'Hafalan'};
const jwt=()=> ['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:userId,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'signature'].join('.');
const session=()=>({access_token:jwt(),refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:userId,email:'admin@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'google'},user_metadata:{},created_at:new Date().toISOString()}});
async function login(page) {
  await page.addInitScript(data=>localStorage.setItem('sb-test-project-auth-token',JSON.stringify(data)),session());
}
async function mockAPI(page,{role='admin',initial=[base],fail=false,conflict=false}={}) {
  let rows=structuredClone(initial); const requests=[];
  await page.route('https://test-project.supabase.co/**',async route=>{
    const request=route.request(),url=new URL(request.url()),method=request.method();
    requests.push({url,method,body:request.postDataJSON(),headers:request.headers()});
    const reply=(status,json)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(json)});
    if(url.pathname==='/rest/v1/rpc/god_time_role') return reply(200,role);
    if(url.pathname==='/auth/v1/logout') return reply(200,{});
    if(url.pathname==='/auth/v1/token') return reply(200,session());
    if(!url.pathname.endsWith('/god_time_messages')) return reply(400,{message:'Unexpected endpoint'});
    if(fail) return reply(503,{message:'Unavailable'});
    const matching=row=>['id','revision','year','month','published'].every(key=> !url.searchParams.has(key)||String(row[key])===url.searchParams.get(key).slice(3));
    if(method==='GET') {
      const found=rows.filter(matching);
      return reply(200,found);
    }
    if(method==='POST') {
      const entry=request.postDataJSON();
      if(rows.some(r=>r.year===entry.year&&r.month===entry.month)) return reply(409,{code:'23505'});
      const saved={...entry,id:'new-id',revision:1}; rows.push(saved); return reply(201,[saved]);
    }
    if(conflict) return reply(200,[]);
    const record=rows.find(matching);
    if(!record) return reply(200,[]);
    if(method==='PATCH') {Object.assign(record,request.postDataJSON(),{revision:record.revision+1});return reply(200,[record]);}
    if(method==='DELETE') {rows=rows.filter(r=>r.id!==record.id);return reply(200,[{id:record.id}]);}
    return reply(400,{});
  });
  return {requests,rows:()=>rows};
}
test('logged-out manager is locked and Google sign-in starts PKCE with a fixed local callback',async({page})=>{
  await mockAPI(page);
  await page.goto('/kelola.html');
  await expect(page.locator('#message-form')).toBeHidden();
  await expect(page.locator('#status')).toContainText('Masuk dengan Google');
  let authURL;
  await page.route('https://test-project.supabase.co/auth/v1/authorize**',route=>{authURL=new URL(route.request().url());return route.fulfill({body:'OAuth started'});});
  await page.getByRole('button',{name:'Masuk dengan Google'}).click();
  await expect.poll(()=>authURL?.searchParams.get('provider')).toBe('google');
  expect(authURL.searchParams.get('redirect_to')).toBe('http://127.0.0.1:4183/kelola.html');
  expect(authURL.searchParams.get('code_challenge_method')).toBe('s256');
});
test('user role cannot open the editor or request the archive',async({page})=>{
  await login(page); const api=await mockAPI(page,{role:'user'});
  await page.goto('/kelola.html');
  await expect(page.locator('#status')).toContainText('hanya tersedia untuk admin');
  await expect(page.locator('#message-form')).toBeHidden();
  expect(api.requests.some(r=>r.url.pathname.endsWith('/god_time_messages'))).toBe(false);
});
test('admin can preview safely, update, create, reload and delete without GitHub export',async({page})=>{
  await login(page); const api=await mockAPI(page);
  page.on('dialog',dialog=>dialog.accept());
  await page.goto('/kelola.html');
  // Manager chooses civil-day month, so use the loaded archive explicitly near a sunset boundary.
  await expect(page.locator('#record-list option')).toHaveCount(2);
  await page.locator('#record-list').selectOption(base.id);
  const hostile='<img src=x onerror="window.pwned=true">';
  await page.locator('#body').fill(hostile);
  await page.getByRole('button',{name:'Pratinjau',exact:true}).click();
  await expect(page.locator('#preview-body')).toHaveText(hostile);
  await expect(page.locator('#preview-body img')).toHaveCount(0);
  await page.locator('#save').click();
  await expect(page.locator('#status')).toContainText('Pesan disimpan');
  expect(api.rows()[0].revision).toBe(2);
  const update=api.requests.find(r=>r.method==='PATCH');
  expect(update.url.searchParams.get('revision')).toBe('eq.1');
  expect(update.url.searchParams.get('id')).toBe('eq.message-1');
  await page.locator('#reload').click();
  await expect(page.locator('#body')).toHaveValue(hostile);
  await page.locator('#month').selectOption(base.month==='nisan'?'iyar':'nisan');
  await page.locator('#title').fill('Pesan baru');await page.locator('#verse').fill('Ayat');await page.locator('#body').fill('Isi baru');
  await page.locator('#save').click();
  await expect(page.locator('#status')).toContainText('Draf disimpan');
  expect(api.rows()).toHaveLength(2);
  await page.locator('#delete').click();
  await expect(page.locator('#status')).toContainText('Pesan dihapus');
  expect(api.rows()).toHaveLength(1);
  await page.locator('#logout').click();
  await expect(page.locator('#message-form')).toBeHidden();
  await expect(page.locator('#preview')).toBeHidden();
});
test('stale save preserves the form and requires an explicit reload',async({page})=>{
  await login(page);await mockAPI(page,{conflict:true});
  await page.goto('/kelola.html');
  await expect(page.locator('#record-list option')).toHaveCount(2);await page.locator('#record-list').selectOption(base.id);
  await page.locator('#body').fill('Perubahan lokal yang harus terjaga');await page.locator('#save').click();
  await expect(page.locator('#status')).toContainText('Muat ulang');
  await expect(page.locator('#body')).toHaveValue('Perubahan lokal yang harus terjaga');
  await expect(page.locator('#save')).toBeDisabled();
});
test('public DB content is escaped and never inherits an admin session',async({page})=>{
  await login(page);const api=await mockAPI(page,{initial:[{...base,title:'<script>window.pwned=1</script>',body:'<img src=x onerror="window.pwned=1">'}]});
  await page.goto('/');
  await expect(page.locator('#monthly-message h3')).toHaveText('<script>window.pwned=1</script>');
  await expect(page.locator('#monthly-message img,#monthly-message script')).toHaveCount(0);
  expect(await page.evaluate(()=>window.pwned)).toBeUndefined();
  const request=api.requests.find(r=>r.url.pathname.endsWith('/god_time_messages'));
  expect(request.headers.authorization || '').not.toContain('signature');
  await expect(page.locator('#calendar-grid button')).not.toHaveCount(0);
});
test('DB failure or empty content falls back to introductory content without requesting stale JSON',async({page})=>{
  await mockAPI(page,{fail:true});let legacyRequests=0;
  page.on('request',request=>{if(request.url().endsWith('/messages.json'))legacyRequests++;});
  await page.goto('/');
  await expect(page.locator('#message-status')).toHaveText('Renungan pengantar');
  await expect(page.locator('#monthly-message h3')).not.toBeEmpty();
  await expect(page.locator('#calendar-grid button')).not.toHaveCount(0);
  expect(legacyRequests).toBe(0);
});
test('OAuth callback exchanges the code and removes it from the URL',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sb-test-project-auth-token-code-verifier',JSON.stringify('test-verifier')));
  const api=await mockAPI(page);
  await page.goto('/kelola.html?code=test-code');
  await expect(page.locator('#account')).toContainText('admin');
  expect(new URL(page.url()).searchParams.has('code')).toBe(false);
  const token=api.requests.find(r=>r.url.pathname==='/auth/v1/token');
  expect(token.url.searchParams.get('grant_type')).toBe('pkce');
  expect(token.body.auth_code).toBe('test-code');
  expect(token.body.code_verifier).toBe('test-verifier');
});
test('development server never exposes configuration, SQL or private source',async({request})=>{
  for(const path of ['/.env.local','/supabase/legacy-import.sql','/.git/config','/node_modules/@supabase/supabase-js/package.json','/configuration.mjs']) expect((await request.get(path)).status()).toBe(404);
  expect((await (await request.get('/messages.json')).json()).messages).toEqual([]);
});
