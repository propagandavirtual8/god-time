import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {defaultLayout} from '../layout-model.js';
test('PostgreSQL: design admin separation, draft privacy, atomic publication and stale-write protection',async()=>{
 const db=new PGlite();const design='00000000-0000-0000-0000-000000000001',message='00000000-0000-0000-0000-000000000002',user='00000000-0000-0000-0000-000000000003';
 try{
  await db.exec("create role anon;create role authenticated;create schema auth;grant usage on schema auth to anon,authenticated;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant execute on function auth.uid()to anon,authenticated;create schema storage;grant usage on schema storage to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert on storage.objects to anon,authenticated;create function storage.foldername(text)returns text[]language sql immutable as $$select string_to_array($1,'/')$$;");
  await db.exec(await readFile(new URL('../supabase/migrations/202610190001_god_time.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610270001_layout_editor.sql',import.meta.url),'utf8'));
  await db.query("insert into auth.users(id,raw_user_meta_data)values($1,'{}'),($2,'{}'),($3,'{}')",[design,message,user]);
  await db.query('insert into god_time_layout_admins(user_id)values($1)',[design]);await db.query("update god_time_roles set role='admin' where user_id=$1",[message]);
  const as=async(role,id='')=>db.exec("reset role;set request.jwt.claim.sub='"+id+"';set role "+role);
  const save=(doc,revision)=>db.query('select public.god_time_save_layout($1::jsonb,$2)as result',[JSON.stringify(doc),revision]);
  await as('authenticated',message);assert.equal((await db.query('select public.god_time_is_layout_admin()as ok')).rows[0].ok,false);
  await assert.rejects(save(defaultLayout(),0),/FORBIDDEN/);
  await assert.rejects(db.query('insert into god_time_layout_admins values($1)',[message]),/permission denied/);
  await as('authenticated',design);assert.equal((await db.query('select public.god_time_role()as role')).rows[0].role,'user');
  assert.equal((await save(defaultLayout(),0)).rows[0].result.revision,1);
  await assert.rejects(save(defaultLayout(),0),/CONFLICT/);
  await assert.rejects(save({nodes:[],site:{}},1),/INVALID_LAYOUT/);
  assert.equal((await db.query('select * from god_time_layout_drafts')).rows.length,1);
  assert.equal((await db.query('select * from god_time_layout_published')).rows.length,0);
  await as('anon');await assert.rejects(db.query('select * from god_time_layout_drafts'),/permission denied/);
  await assert.rejects(db.query('select public.god_time_publish_layout(1,0)'),/permission denied/);
  await as('authenticated',user);assert.equal((await db.query('select * from god_time_layout_drafts')).rows.length,0);
  await assert.rejects(db.query('select public.god_time_publish_layout(1,0)'),/FORBIDDEN/);
  await as('authenticated',design);await db.query('select public.god_time_publish_layout(1,0)');
  await assert.rejects(db.query('select public.god_time_publish_layout(1,0)'),/CONFLICT/);
  await db.query('insert into storage.objects values($1,$2)',['god-time-design-media',design+'/a.png']);
  await assert.rejects(db.query('insert into storage.objects values($1,$2)',['god-time-design-media',message+'/a.png']),/row-level security/);
  await as('authenticated',message);assert.equal((await db.query('select * from god_time_layout_revisions')).rows.length,0);
  await assert.rejects(db.query('insert into storage.objects values($1,$2)',['god-time-design-media',message+'/a.png']),/row-level security/);
  await as('anon');assert.equal((await db.query('select * from god_time_layout_published')).rows[0].revision,1);
  await as('postgres');await db.query('delete from god_time_layout_admins where user_id=$1',[design]);await as('authenticated',design);
  await assert.rejects(save(defaultLayout(),1),/FORBIDDEN/);
 }finally{await db.close();}
});
