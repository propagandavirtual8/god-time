import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { importSQL } from '../scripts/prepare-import.mjs';

test('PostgreSQL: RLS, role protection, CRUD, revision conflicts, non-destructive import', async t => {
  const db = new PGlite();
  const admin = '00000000-0000-0000-0000-000000000001', user = '00000000-0000-0000-0000-000000000002';
  try {
    // Only Supabase-owned auth scaffolding is simulated; migration/policies run in real PostgreSQL.
    await db.exec(`create role anon; create role authenticated;
      create schema auth; grant usage on schema auth to anon, authenticated;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb, email text, email_confirmed_at timestamptz);
      create table auth.identities(user_id uuid references auth.users(id), provider text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant execute on function auth.uid() to anon, authenticated;`);
    await db.exec(await readFile(new URL('../supabase/migrations/202610190001_god_time.sql', import.meta.url), 'utf8'));
    await db.exec(`insert into auth.users(id,raw_user_meta_data) values ('${admin}', '{}'), ('${user}', '{"role":"admin"}');
      update public.god_time_roles set role='admin' where user_id='${admin}';`);
    const asRole = async (role, id = '') => {
      await db.exec(`reset role; set request.jwt.claim.sub='${id}'; set role ${role};`);
    };
    const fixture = async (year, month, title, published, from, until) => db.query(`insert into public.god_time_messages
      (year,month,title,verse,body,published,visible_from,visible_until) values ($1,$2,$3,'Ayat','Isi',$4,now()+$5::interval,now()+$6::interval) returning *`, [year,month,title,published,from,until]);
    await fixture(5787, 'cheshvan', 'current', true, '-1 day', '28 days');
    await fixture(5787, 'kislev', 'future', true, '40 days', '69 days');
    await fixture(5787, 'tevet', 'draft', false, '-1 day', '28 days');
    await fixture(5786, 'cheshvan', 'past', true, '-60 days', '-31 days');

    await t.test('anon sees only active published rows, even when directly requesting future/draft rows', async () => {
      await asRole('anon');
      assert.deepEqual((await db.query('select title from public.god_time_messages')).rows, [{title:'current'}]);
      assert.equal((await db.query("select * from public.god_time_messages where title in ('future','draft','past')")).rows.length, 0);
      await assert.rejects(db.query('select * from public.god_time_roles'), /permission denied/);
      await assert.rejects(fixture(5787,'nisan','attack',true,'-1 day','28 days'), /permission denied/);
    });
    await t.test('user metadata cannot grant admin and users cannot change roles or any message', async () => {
      await asRole('authenticated', user);
      assert.equal((await db.query('select public.god_time_role() as role')).rows[0].role, 'user');
      assert.equal((await db.query('select * from public.god_time_roles')).rows.length, 1);
      assert.equal((await db.query('select * from public.god_time_messages')).rows.length, 1);
      await assert.rejects(db.exec("update public.god_time_roles set role='admin'"), /permission denied/);
      await assert.rejects(fixture(5787,'nisan','attack',true,'-1 day','28 days'), /row-level security/);
      assert.equal((await db.query("update public.god_time_messages set title='attack' returning id")).rows.length, 0);
      assert.equal((await db.query('delete from public.god_time_messages returning id')).rows.length, 0);
      await assert.rejects(db.query('select public.god_time_new_user()'), /permission denied/);
    });
    await t.test('admin CRUD works; stale saves/deletes affect zero rows and revisions cannot be forged', async () => {
      await asRole('authenticated', admin);
      assert.equal((await db.query('select * from public.god_time_messages')).rows.length, 4);
      await assert.rejects(db.exec("update public.god_time_roles set role='admin'"), /permission denied/);
      const inserted = (await fixture(5787,'nisan','new',false,'-1 day','28 days')).rows[0];
      assert.equal(inserted.created_by, admin);
      const updated = (await db.query('update public.god_time_messages set title=$1,revision=99 where id=$2 and revision=$3 returning *', ['edited',inserted.id,1])).rows[0];
      assert.equal(updated.revision, 2);
      assert.equal(updated.updated_by, admin);
      assert.equal((await db.query("update public.god_time_messages set title='stale' where id=$1 and revision=1 returning id",[inserted.id])).rows.length, 0);
      assert.equal((await db.query('delete from public.god_time_messages where id=$1 and revision=1 returning id',[inserted.id])).rows.length, 0);
      await assert.rejects(db.query("update public.god_time_messages set month='iyar' where id=$1",[inserted.id]), /Identitas/);
      assert.equal((await db.query('delete from public.god_time_messages where id=$1 and revision=2 returning id',[inserted.id])).rows.length, 1);
      await assert.rejects(fixture(5787,'adar','invalid',false,'-1 day','28 days'), /check constraint/);
    });
    await t.test('role revocation takes effect without waiting for JWT refresh', async () => {
      await asRole('postgres');
      await db.query("update public.god_time_roles set role='user' where user_id=$1", [admin]);
      await asRole('authenticated', admin);
      assert.equal((await db.query('select * from public.god_time_messages')).rows.length, 1);
      await assert.rejects(fixture(5787,'nisan','denied',false,'-1 day','28 days'), /row-level security/);
    });
    await t.test('public window includes start and excludes end; unpublish removes access', async () => {
      await asRole('postgres');
      await db.exec("update public.god_time_messages set published=false");
      await db.transaction(async tx => {
        await tx.exec("update public.god_time_messages set published=true, visible_from=now(), visible_until=now()+interval '29 days' where title='current'; set local role anon;");
        assert.equal((await tx.query('select * from public.god_time_messages')).rows.length, 1);
      });
      await asRole('postgres');
      await db.transaction(async tx => {
        await tx.exec("update public.god_time_messages set visible_from=now()-interval '29 days',visible_until=now() where title='current'; set local role anon;");
        assert.equal((await tx.query('select * from public.god_time_messages')).rows.length, 0);
      });
    });
    await t.test('legacy import preserves every field, skips occupied periods and is idempotent', async () => {
      await asRole('postgres');
      const source = await readFile(new URL('../messages.json', import.meta.url), 'utf8');
      const sql = importSQL(source), legacy = JSON.parse(source).messages;
      const before = (await db.query('select * from public.god_time_messages where year=5787 and month=\'cheshvan\'')).rows[0];
      await db.exec(sql); await db.exec(sql);
      assert.deepEqual((await db.query('select * from public.god_time_messages where id=$1',[before.id])).rows[0], before);
      await db.exec('delete from public.god_time_messages');
      await db.exec(sql); await db.exec(sql);
      const rows = (await db.query('select * from public.god_time_messages')).rows;
      assert.equal(rows.length, legacy.length);
      for (const entry of legacy) {
        const saved = rows.find(m => m.year === entry.year && m.month === entry.month);
        for (const key of Object.keys(entry)) assert.equal(saved[key], entry[key], key);
      }
    });
    await t.test('bootstrap admin requires a confirmed Google identity and assigns only the intended account', async () => {
      await asRole('postgres');
      const bootstrap = await readFile(new URL('../supabase/bootstrap-admin.sql', import.meta.url), 'utf8');
      await assert.rejects(db.exec(bootstrap), /no rows/); await db.exec('rollback');
      await db.query("update auth.users set email='ehopindonesia@gmail.com', email_confirmed_at=now() where id=$1",[admin]);
      await assert.rejects(db.exec(bootstrap), /Google/); await db.exec('rollback');
      await db.query("insert into auth.identities values ($1,'google')",[admin]);
      await db.exec(bootstrap);
      assert.equal((await db.query('select role from public.god_time_roles where user_id=$1',[admin])).rows[0].role,'admin');
      assert.equal((await db.query('select role from public.god_time_roles where user_id=$1',[user])).rows[0].role,'user');
    });
  } finally { await db.close(); }
});
