-- Quản lý kho E · Online Phase 4B: DATA, Air, Hàng xuất, Lot/Invoice và ảnh.
create table if not exists public.data_items (
  id uuid primary key, product_code text not null, design_code text not null default '', received_at timestamptz not null,
  invoice text not null default '', lot text not null default '', quantity numeric not null default 0,
  status text not null default 'NEW' check (status in ('NEW','PROCESSING','ENOUGH','MISSING','PUSHED','COMPLETED')), note text not null default '', completed_at timestamptz,
  client_created_at timestamptz, client_updated_at timestamptz, created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists data_items_received_at_idx on public.data_items(received_at desc);
create index if not exists data_items_status_idx on public.data_items(status);
create index if not exists data_items_product_code_idx on public.data_items(product_code);
create index if not exists data_items_invoice_idx on public.data_items(invoice);
create index if not exists data_items_lot_idx on public.data_items(lot);

create table if not exists public.goods_items (
  id uuid primary key, invoice text not null default '', item_code text not null default '', product_code text not null default '', lot text not null default '',
  quantity numeric not null default 0, export_date date not null,
  status text not null default 'WAITING' check (status in ('WAITING','PREPARING','ENOUGH','MISSING','PROCESSING','COMPLETED')),
  source_kind text not null default 'SEA' check (source_kind in ('SEA','AIR')), destination text not null default '', confirmation text not null default '',
  container_count integer not null default 0, loose_quantity text not null default '', warehouse text not null default '', note text not null default '',
  client_created_at timestamptz, client_updated_at timestamptz, created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists goods_items_export_date_idx on public.goods_items(export_date desc);
create index if not exists goods_items_invoice_idx on public.goods_items(invoice);
create index if not exists goods_items_product_code_idx on public.goods_items(product_code);
create index if not exists goods_items_lot_idx on public.goods_items(lot);
create index if not exists goods_items_status_idx on public.goods_items(status);
create index if not exists goods_items_source_kind_idx on public.goods_items(source_kind);
create index if not exists goods_items_date_source_idx on public.goods_items(export_date, source_kind);

create table if not exists public.lots (
  id uuid primary key, lot_code text not null, invoice text not null default '', product_code text not null default '', work_date date not null,
  quantity numeric not null default 0, status text not null default 'OPEN' check (status in ('OPEN','PROCESSING','ENOUGH','CLOSED')),
  client_created_at timestamptz, created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists lots_work_date_idx on public.lots(work_date desc);
create index if not exists lots_invoice_idx on public.lots(invoice);
create index if not exists lots_lot_code_idx on public.lots(lot_code);
create index if not exists lots_status_idx on public.lots(status);

create table if not exists public.lot_closures (
  id uuid primary key, lot_id uuid not null references public.lots(id) on delete cascade, closed_by_name text not null default '', closed_at timestamptz not null,
  note text not null default '', local_photo_id uuid, client_created_at timestamptz, created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists lot_closures_lot_id_idx on public.lot_closures(lot_id);
create index if not exists lot_closures_closed_at_idx on public.lot_closures(closed_at desc);

create table if not exists public.goods_photos (
  id uuid primary key, owner_module text not null check (owner_module in ('dataItems','goodsItems','lots')), owner_id uuid not null,
  storage_path text not null unique, mime_type text not null default 'image/jpeg', photo_kind text not null default 'Hàng', note text not null default '',
  client_created_at timestamptz, created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists goods_photos_owner_idx on public.goods_photos(owner_module, owner_id);
create index if not exists goods_photos_created_at_idx on public.goods_photos(created_at desc);

drop trigger if exists data_items_sync_stamp on public.data_items;
create trigger data_items_sync_stamp before insert or update on public.data_items for each row execute function public.stamp_synced_row();
drop trigger if exists goods_items_sync_stamp on public.goods_items;
create trigger goods_items_sync_stamp before insert or update on public.goods_items for each row execute function public.stamp_synced_row();
drop trigger if exists lots_sync_stamp on public.lots;
create trigger lots_sync_stamp before insert or update on public.lots for each row execute function public.stamp_synced_row();
drop trigger if exists lot_closures_sync_stamp on public.lot_closures;
create trigger lot_closures_sync_stamp before insert or update on public.lot_closures for each row execute function public.stamp_synced_row();
drop trigger if exists goods_photos_sync_stamp on public.goods_photos;
create trigger goods_photos_sync_stamp before insert or update on public.goods_photos for each row execute function public.stamp_synced_row();

grant usage, select on sequence public.sync_version_seq to authenticated;
alter table public.data_items enable row level security;
alter table public.goods_items enable row level security;
alter table public.lots enable row level security;
alter table public.lot_closures enable row level security;
alter table public.goods_photos enable row level security;
revoke all on public.data_items, public.goods_items, public.lots, public.lot_closures, public.goods_photos from anon;
grant select, insert, update, delete on public.data_items, public.goods_items, public.lots, public.lot_closures, public.goods_photos to authenticated;

drop policy if exists data_items_read on public.data_items;
create policy data_items_read on public.data_items for select to authenticated using (public.is_active_user());
drop policy if exists data_items_write on public.data_items;
create policy data_items_write on public.data_items for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists goods_items_read on public.goods_items;
create policy goods_items_read on public.goods_items for select to authenticated using (public.is_active_user());
drop policy if exists goods_items_write on public.goods_items;
create policy goods_items_write on public.goods_items for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists lots_read on public.lots;
create policy lots_read on public.lots for select to authenticated using (public.is_active_user());
drop policy if exists lots_write on public.lots;
create policy lots_write on public.lots for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists lot_closures_read on public.lot_closures;
create policy lot_closures_read on public.lot_closures for select to authenticated using (public.is_active_user());
drop policy if exists lot_closures_write on public.lot_closures;
create policy lot_closures_write on public.lot_closures for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists goods_photos_read on public.goods_photos;
create policy goods_photos_read on public.goods_photos for select to authenticated using (public.is_active_user());
drop policy if exists goods_photos_write on public.goods_photos;
create policy goods_photos_write on public.goods_photos for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('goods-photos','goods-photos',false,10485760,array['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists goods_storage_read on storage.objects;
create policy goods_storage_read on storage.objects for select to authenticated using (bucket_id='goods-photos' and public.is_active_user());
drop policy if exists goods_storage_insert on storage.objects;
create policy goods_storage_insert on storage.objects for insert to authenticated with check (bucket_id='goods-photos' and public.current_app_role() in ('ADMIN','MANAGER') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists goods_storage_update on storage.objects;
create policy goods_storage_update on storage.objects for update to authenticated using (bucket_id='goods-photos' and public.current_app_role() in ('ADMIN','MANAGER')) with check (bucket_id='goods-photos' and public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists goods_storage_delete on storage.objects;
create policy goods_storage_delete on storage.objects for delete to authenticated using (bucket_id='goods-photos' and public.current_app_role() in ('ADMIN','MANAGER'));

do $$ begin alter publication supabase_realtime add table public.data_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.goods_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.lots; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.lot_closures; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.goods_photos; exception when duplicate_object then null; end $$;
