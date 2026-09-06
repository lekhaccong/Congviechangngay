-- Quản lý kho E · Online Phase 2: OT / AMH
create table if not exists public.overtimes (
  id uuid primary key, employee_id uuid not null references public.employees(id), work_date date not null,
  manager_shift_id text not null, start_time text not null, end_time text not null,
  total_minutes integer not null check (total_minutes >= 0), ot_type text not null, note text not null default '',
  rate_percent integer, rate_label text, attendance_confirmed_at timestamptz, attendance_confirmed_by text,
  client_created_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id), server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists overtimes_employee_date_idx on public.overtimes(employee_id, work_date);

create table if not exists public.amhs (
  id uuid primary key, employee_id uuid not null references public.employees(id), work_date date not null,
  manager_shift_id text not null, hours numeric(8,2) not null, status text not null check (status in ('PENDING','APPROVED','REJECTED','DONE')),
  note text not null default '', task_id text, client_created_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists amhs_employee_date_idx on public.amhs(employee_id, work_date);

drop trigger if exists overtimes_sync_stamp on public.overtimes;
create trigger overtimes_sync_stamp before insert or update on public.overtimes for each row execute function public.stamp_synced_row();
drop trigger if exists amhs_sync_stamp on public.amhs;
create trigger amhs_sync_stamp before insert or update on public.amhs for each row execute function public.stamp_synced_row();

alter table public.overtimes enable row level security;
alter table public.amhs enable row level security;
revoke all on public.overtimes, public.amhs from anon;
grant select, insert, update, delete on public.overtimes, public.amhs to authenticated;

drop policy if exists overtimes_read on public.overtimes;
create policy overtimes_read on public.overtimes for select to authenticated using (public.is_active_user());
drop policy if exists overtimes_write on public.overtimes;
create policy overtimes_write on public.overtimes for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists amhs_read on public.amhs;
create policy amhs_read on public.amhs for select to authenticated using (public.is_active_user());
drop policy if exists amhs_write on public.amhs;
create policy amhs_write on public.amhs for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));

do $$ begin
  alter publication supabase_realtime add table public.overtimes, public.amhs;
exception when duplicate_object then null; end $$;
