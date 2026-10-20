-- Run manually as project owner AFTER the intended Google account has signed in.
-- This is an explicit role grant. Never expose this operation through the browser.
begin;
do $$
declare selected_user uuid;
begin
  select id into strict selected_user from auth.users
    where lower(email) = lower('ehopindonesia@gmail.com')
      and email_confirmed_at is not null;
  if not exists (select 1 from auth.identities where user_id = selected_user and provider = 'google') then
    raise exception 'Akun belum mempunyai identitas Google terverifikasi.';
  end if;
  update public.god_time_roles set role = 'admin' where user_id = selected_user;
  if not found then raise exception 'Migrasi role belum tersedia untuk akun ini.'; end if;
end;
$$;
commit;
