-- Apply once after reviewing the target and taking a backup.
-- Existing names intentionally fail: never silently replace live objects.
begin;
create table public.god_time_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin'))
);
alter table public.god_time_roles enable row level security;
revoke all on public.god_time_roles from public, anon, authenticated;
grant select on public.god_time_roles to authenticated;
create policy own_role on public.god_time_roles for select to authenticated
  using (user_id = (select auth.uid()));
create function public.god_time_role() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select role from public.god_time_roles where user_id = auth.uid()), 'user');
$$;
revoke all on function public.god_time_role() from public;
grant execute on function public.god_time_role() to anon, authenticated;
create function public.god_time_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.god_time_roles(user_id, role) values (new.id, 'user');
  return new;
end;
$$;
revoke all on function public.god_time_new_user() from public, anon, authenticated;
create trigger god_time_user_created after insert on auth.users
  for each row execute function public.god_time_new_user();
insert into public.god_time_roles(user_id) select id from auth.users on conflict do nothing;
create table public.god_time_messages (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 5600 and 6000),
  month text not null check (month in ('nisan','iyar','sivan','tamuz','av','elul','tisyri','cheshvan','kislev','tevet','shevat','adar','adar1','adar2')),
  published boolean not null default false,
  title text not null check (char_length(trim(title)) between 1 and 180),
  subtitle text not null default '' check (char_length(subtitle) <= 250),
  verse text not null check (char_length(trim(verse)) between 1 and 300),
  "verseText" text not null default '' check (char_length("verseText") <= 6000),
  author text not null default '' check (char_length(author) <= 150),
  body text not null check (char_length(trim(body)) between 1 and 30000),
  "memoryVerse" text not null default '' check (char_length("memoryVerse") <= 300),
  "memoryText" text not null default '' check (char_length("memoryText") <= 6000),
  visible_from timestamptz not null,
  visible_until timestamptz not null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique(year, month),
  check (visible_until > visible_from and visible_until - visible_from between interval '28 days' and interval '31 days'),
  check (case when year % 19 in (0,3,6,8,11,14,17) then month <> 'adar' else month not in ('adar1','adar2') end)
);
alter table public.god_time_messages enable row level security;
revoke all on public.god_time_messages from public, anon, authenticated;
grant select on public.god_time_messages to anon, authenticated;
grant insert, update, delete on public.god_time_messages to authenticated;
create policy current_published_message on public.god_time_messages
  for select to anon, authenticated using (published and visible_from <= now() and visible_until > now());
create policy admin_read on public.god_time_messages
  for select to authenticated using ((select public.god_time_role()) = 'admin');
create policy admin_insert on public.god_time_messages
  for insert to authenticated with check ((select public.god_time_role()) = 'admin');
create policy admin_update on public.god_time_messages
  for update to authenticated using ((select public.god_time_role()) = 'admin')
  with check ((select public.god_time_role()) = 'admin');
create policy admin_delete on public.god_time_messages
  for delete to authenticated using ((select public.god_time_role()) = 'admin');
create function public.god_time_stamp_message() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.year <> old.year or new.month <> old.month then
      raise exception 'Identitas dan periode pesan tidak dapat diubah; buat pesan baru.';
    end if;
    new.revision := old.revision + 1;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  else
    new.revision := 1;
    new.created_at := now();
    new.created_by := auth.uid();
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
revoke all on function public.god_time_stamp_message() from public, anon, authenticated;
create trigger god_time_message_stamp before insert or update on public.god_time_messages
  for each row execute function public.god_time_stamp_message();
commit;
