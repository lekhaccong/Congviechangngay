create table if not exists public.monthly_payroll (
  id uuid primary key,
  employee_id uuid not null references public.employees(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  performance_score numeric not null default 0,
  attendance_allowance numeric not null default 0,
  responsibility_allowance numeric not null default 0,
  salary_allowance numeric not null default 0,
  area_allowance numeric not null default 0,
  other_allowance numeric not null default 0,
  advance numeric not null default 0,
  settlement_adjustment numeric not null default 0,
  note text not null default '',
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'),
  deleted_at timestamptz,
  unique(employee_id, month)
);

create index if not exists monthly_payroll_month_idx on public.monthly_payroll(month);
drop trigger if exists monthly_payroll_sync_stamp on public.monthly_payroll;
create trigger monthly_payroll_sync_stamp before insert or update on public.monthly_payroll
for each row execute function public.stamp_synced_row();

alter table public.monthly_payroll enable row level security;
revoke all on public.monthly_payroll from anon;
grant select, insert, update, delete on public.monthly_payroll to authenticated;

drop policy if exists monthly_payroll_read on public.monthly_payroll;
create policy monthly_payroll_read on public.monthly_payroll for select to authenticated
using (public.is_active_user());
drop policy if exists monthly_payroll_write on public.monthly_payroll;
create policy monthly_payroll_write on public.monthly_payroll for all to authenticated
using (public.current_app_role() in ('ADMIN','MANAGER'))
with check (public.current_app_role() in ('ADMIN','MANAGER'));

do $$ begin
  alter publication supabase_realtime add table public.monthly_payroll;
exception when duplicate_object then null;
end $$;
