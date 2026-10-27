-- Ganti email ini dengan akun admin DESAIN yang sudah terdaftar dan terkonfirmasi.
-- Jalankan setelah 202610270001_layout_editor.sql.
-- Tidak memberikan atau mencabut hak admin pesan.
do $$
declare chosen_email text := 'GANTI_EMAIL_ADMIN_DESAIN';target_user uuid;
begin
 if chosen_email='GANTI_EMAIL_ADMIN_DESAIN' then raise exception 'Isi email admin desain terlebih dahulu.';end if;
 select id into strict target_user from auth.users where lower(email)=lower(chosen_email) and email_confirmed_at is not null;
 insert into public.god_time_layout_admins(user_id)values(target_user)on conflict do nothing;
end $$;
