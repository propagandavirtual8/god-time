-- Admin design is independent of god_time_roles / message admins.
begin;
create table public.god_time_layout_admins(
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.god_time_layout_admins enable row level security;
revoke all on public.god_time_layout_admins from public,anon,authenticated;
grant select on public.god_time_layout_admins to authenticated;
create policy layout_admin_own_role on public.god_time_layout_admins for select to authenticated using(user_id=(select auth.uid()));

create function public.god_time_is_layout_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.god_time_layout_admins where user_id=auth.uid());
$$;
revoke all on function public.god_time_is_layout_admin() from public;
grant execute on function public.god_time_is_layout_admin() to authenticated;

create table public.god_time_layout_drafts(
 id text primary key check(id='home'),document jsonb not null,
 revision integer not null check(revision>0),updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null
);
create table public.god_time_layout_published(
 id text primary key check(id='home'),document jsonb not null,
 revision integer not null check(revision>0),updated_at timestamptz not null default now()
);
create table public.god_time_layout_revisions(
 revision integer primary key,document jsonb not null,created_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null
);
alter table public.god_time_layout_drafts enable row level security;
alter table public.god_time_layout_published enable row level security;
alter table public.god_time_layout_revisions enable row level security;
revoke all on public.god_time_layout_drafts,public.god_time_layout_published,public.god_time_layout_revisions from public,anon,authenticated;
grant select on public.god_time_layout_drafts,public.god_time_layout_revisions to authenticated;
grant select on public.god_time_layout_published to anon,authenticated;
create policy design_admin_read_draft on public.god_time_layout_drafts for select to authenticated using((select public.god_time_is_layout_admin()));
create policy design_admin_read_history on public.god_time_layout_revisions for select to authenticated using((select public.god_time_is_layout_admin()));
create policy published_design_read on public.god_time_layout_published for select to anon,authenticated using(true);

create function public.god_time_save_layout(p_document jsonb,p_expected integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_revision integer;
begin
 if not public.god_time_is_layout_admin() then raise exception 'FORBIDDEN';end if;
 if p_document is null or jsonb_typeof(p_document)<>'object' or p_document->>'version' is distinct from '1'
 or jsonb_typeof(p_document->'nodes') is distinct from 'array'
 or jsonb_typeof(p_document->'site') is distinct from 'object'
 or octet_length(p_document::text)>2097152 then raise exception 'INVALID_LAYOUT';end if;
 perform pg_advisory_xact_lock(87190261);
 select revision into v_revision from public.god_time_layout_drafts where id='home';
 if p_expected is distinct from coalesce(v_revision,0) then raise exception 'CONFLICT';end if;
 v_revision:=coalesce(v_revision,0)+1;
 insert into public.god_time_layout_drafts(id,document,revision,updated_by)
 values('home',p_document,v_revision,auth.uid())
 on conflict(id) do update set document=excluded.document,revision=excluded.revision,updated_at=now(),updated_by=auth.uid();
 return jsonb_build_object('revision',v_revision);
end;
$$;
create function public.god_time_publish_layout(p_expected integer,p_published_expected integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_draft public.god_time_layout_drafts;v_revision integer;
begin
 if not public.god_time_is_layout_admin() then raise exception 'FORBIDDEN';end if;
 perform pg_advisory_xact_lock(87190261);
 select * into v_draft from public.god_time_layout_drafts where id='home';
 if v_draft.id is null or p_expected is distinct from v_draft.revision then raise exception 'CONFLICT';end if;
 select revision into v_revision from public.god_time_layout_published where id='home';
 if p_published_expected is distinct from coalesce(v_revision,0) then raise exception 'CONFLICT';end if;
 v_revision:=coalesce(v_revision,0)+1;
 insert into public.god_time_layout_published(id,document,revision)values('home',v_draft.document,v_revision)
 on conflict(id)do update set document=excluded.document,revision=excluded.revision,updated_at=now();
 insert into public.god_time_layout_revisions(revision,document,created_by)values(v_revision,v_draft.document,auth.uid());
 return jsonb_build_object('revision',v_revision);
end;
$$;
revoke all on function public.god_time_save_layout(jsonb,integer),public.god_time_publish_layout(integer,integer) from public,anon;
grant execute on function public.god_time_save_layout(jsonb,integer),public.god_time_publish_layout(integer,integer) to authenticated;

-- Dedicated public image bucket; only design admins can add media.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('god-time-design-media','god-time-design-media',true,5242880,array['image/png','image/jpeg','image/webp','image/avif']);
create policy design_media_read on storage.objects for select to anon,authenticated using(bucket_id='god-time-design-media');
create policy design_media_upload on storage.objects for insert to authenticated
with check(bucket_id='god-time-design-media' and (select public.god_time_is_layout_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text);
-- No browser-side overwrite or delete. Existing published image URLs remain stable.
commit;
