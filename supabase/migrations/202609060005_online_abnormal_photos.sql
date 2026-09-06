-- Quản lý kho E · Online: báo cáo bất thường và ảnh minh chứng private.
create table if not exists public.abnormalities (
  id uuid primary key, abnormal_type text not null, description text not null default '',
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  detected_by text not null default '', detected_at timestamptz not null,
  handler_id uuid references public.employees(id) on update cascade on delete set null,
  deadline timestamptz, status text not null default 'NEW' check (status in ('NEW','PROCESSING','RESOLVED','CLOSED')),
  linked_module text, linked_id text, client_created_at timestamptz, client_updated_at timestamptz,
  created_by uuid references auth.users(id) on update cascade on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists abnormalities_status_idx on public.abnormalities(status);
create index if not exists abnormalities_detected_at_idx on public.abnormalities(detected_at desc);
create index if not exists abnormalities_handler_idx on public.abnormalities(handler_id);
create index if not exists abnormalities_linked_record_idx on public.abnormalities(linked_module, linked_id);

create table if not exists public.abnormal_photos (
  id uuid primary key, abnormality_id uuid not null references public.abnormalities(id) on update cascade on delete cascade,
  storage_path text not null unique, mime_type text not null default 'image/jpeg', photo_kind text not null default 'Bất thường', note text not null default '',
  client_created_at timestamptz, created_by uuid references auth.users(id) on update cascade on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists abnormal_photos_abnormality_idx on public.abnormal_photos(abnormality_id);
create index if not exists abnormal_photos_created_at_idx on public.abnormal_photos(created_at desc);

drop trigger if exists abnormalities_sync_stamp on public.abnormalities;
create trigger abnormalities_sync_stamp before insert or update on public.abnormalities for each row execute function public.stamp_synced_row();
drop trigger if exists abnormal_photos_sync_stamp on public.abnormal_photos;
create trigger abnormal_photos_sync_stamp before insert or update on public.abnormal_photos for each row execute function public.stamp_synced_row();
grant usage, select on sequence public.sync_version_seq to authenticated;

alter table public.abnormalities enable row level security;
alter table public.abnormal_photos enable row level security;
revoke all on public.abnormalities, public.abnormal_photos from anon;
grant select, insert, update, delete on public.abnormalities, public.abnormal_photos to authenticated;

drop policy if exists abnormalities_read on public.abnormalities;
create policy abnormalities_read on public.abnormalities for select to authenticated using (public.is_active_user());
drop policy if exists abnormalities_insert on public.abnormalities;
create policy abnormalities_insert on public.abnormalities for insert to authenticated with check (public.is_active_user() and (created_by = auth.uid() or created_by is null));
drop policy if exists abnormalities_update on public.abnormalities;
create policy abnormalities_update on public.abnormalities for update to authenticated
using (public.is_active_user() and (created_by = auth.uid() or public.current_app_role() in ('ADMIN','MANAGER')))
with check (public.is_active_user() and (created_by = auth.uid() or public.current_app_role() in ('ADMIN','MANAGER')));
drop policy if exists abnormalities_delete on public.abnormalities;
create policy abnormalities_delete on public.abnormalities for delete to authenticated using (public.current_app_role() in ('ADMIN','MANAGER'));

drop policy if exists abnormal_photos_read on public.abnormal_photos;
create policy abnormal_photos_read on public.abnormal_photos for select to authenticated using (public.is_active_user());
drop policy if exists abnormal_photos_insert on public.abnormal_photos;
create policy abnormal_photos_insert on public.abnormal_photos for insert to authenticated with check (public.is_active_user() and (created_by = auth.uid() or created_by is null));
drop policy if exists abnormal_photos_update on public.abnormal_photos;
create policy abnormal_photos_update on public.abnormal_photos for update to authenticated
using (public.is_active_user() and (created_by = auth.uid() or public.current_app_role() in ('ADMIN','MANAGER')))
with check (public.is_active_user() and (created_by = auth.uid() or public.current_app_role() in ('ADMIN','MANAGER')));
drop policy if exists abnormal_photos_delete on public.abnormal_photos;
create policy abnormal_photos_delete on public.abnormal_photos for delete to authenticated using (created_by = auth.uid() or public.current_app_role() in ('ADMIN','MANAGER'));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('abnormal-photos','abnormal-photos',false,10485760,array['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists abnormal_storage_read on storage.objects;
create policy abnormal_storage_read on storage.objects for select to authenticated using (bucket_id = 'abnormal-photos' and public.is_active_user());
drop policy if exists abnormal_storage_insert on storage.objects;
create policy abnormal_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'abnormal-photos' and public.is_active_user() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists abnormal_storage_update on storage.objects;
create policy abnormal_storage_update on storage.objects for update to authenticated
using (bucket_id = 'abnormal-photos' and public.is_active_user() and (owner_id = auth.uid()::text or public.current_app_role() in ('ADMIN','MANAGER')))
with check (bucket_id = 'abnormal-photos' and public.is_active_user());
drop policy if exists abnormal_storage_delete on storage.objects;
create policy abnormal_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'abnormal-photos' and (owner_id = auth.uid()::text or public.current_app_role() in ('ADMIN','MANAGER')));

do $$ begin alter publication supabase_realtime add table public.abnormalities; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.abnormal_photos; exception when duplicate_object then null; end $$;
