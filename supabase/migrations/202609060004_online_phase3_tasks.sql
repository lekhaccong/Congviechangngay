-- Quản lý kho E · Online Phase 3: Công việc (không gồm ảnh và 3S/3D)
-- Sửa constraint AMH Phase 2 để khớp enum local hiện hành.
alter table public.amhs drop constraint if exists amhs_status_check;
alter table public.amhs add constraint amhs_status_check check (status in ('DECLARED','APPROVED','REJECTED','DONE'));

create table if not exists public.work_blocks (
  id text primary key, name text not null, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create table if not exists public.checklists (
  id text primary key, block_id text not null references public.work_blocks(id), name text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create table if not exists public.tasks (
  id uuid primary key, name text not null, block_id text not null references public.work_blocks(id), assignee_id uuid references public.employees(id),
  work_date date not null, manager_shift_id text not null, estimated_minutes integer not null default 0, deadline timestamptz, reminder_time timestamptz,
  status text not null check (status in ('TODO','IN_PROGRESS','PAUSED','COMPLETED','OVERDUE')), progress integer not null check (progress between 0 and 100),
  note text not null default '', client_created_at timestamptz, client_updated_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);
create index if not exists tasks_date_shift_idx on public.tasks(work_date, manager_shift_id);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);
create table if not exists public.checklist_items (
  id uuid primary key, checklist_id text not null references public.checklists(id), task_id uuid references public.tasks(id) on delete cascade,
  label text not null, done boolean not null default false, completed_at timestamptz, completed_by text, note text not null default '', sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id),
  server_version bigint not null default nextval('public.sync_version_seq'), deleted_at timestamptz
);

drop trigger if exists work_blocks_sync_stamp on public.work_blocks;
create trigger work_blocks_sync_stamp before insert or update on public.work_blocks for each row execute function public.stamp_synced_row();
drop trigger if exists checklists_sync_stamp on public.checklists;
create trigger checklists_sync_stamp before insert or update on public.checklists for each row execute function public.stamp_synced_row();
drop trigger if exists tasks_sync_stamp on public.tasks;
create trigger tasks_sync_stamp before insert or update on public.tasks for each row execute function public.stamp_synced_row();
drop trigger if exists checklist_items_sync_stamp on public.checklist_items;
create trigger checklist_items_sync_stamp before insert or update on public.checklist_items for each row execute function public.stamp_synced_row();

alter table public.work_blocks enable row level security;
alter table public.checklists enable row level security;
alter table public.tasks enable row level security;
alter table public.checklist_items enable row level security;
revoke all on public.work_blocks, public.checklists, public.tasks, public.checklist_items from anon;
grant select, insert, update, delete on public.work_blocks, public.checklists, public.tasks, public.checklist_items to authenticated;

create or replace function public.can_manage_task(target_assignee uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select public.current_app_role() in ('ADMIN','MANAGER') or target_assignee = public.my_employee_id()
$$;
revoke all on function public.can_manage_task(uuid) from public;
grant execute on function public.can_manage_task(uuid) to authenticated;

drop policy if exists work_blocks_read on public.work_blocks;
create policy work_blocks_read on public.work_blocks for select to authenticated using (public.is_active_user());
drop policy if exists work_blocks_write on public.work_blocks;
create policy work_blocks_write on public.work_blocks for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists checklists_read on public.checklists;
create policy checklists_read on public.checklists for select to authenticated using (public.is_active_user());
drop policy if exists checklists_write on public.checklists;
create policy checklists_write on public.checklists for all to authenticated using (public.current_app_role() in ('ADMIN','MANAGER')) with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated using (public.is_active_user());
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated using (public.can_manage_task(assignee_id)) with check (public.can_manage_task(assignee_id));
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated using (public.current_app_role() in ('ADMIN','MANAGER'));
drop policy if exists checklist_items_read on public.checklist_items;
create policy checklist_items_read on public.checklist_items for select to authenticated using (public.is_active_user());
drop policy if exists checklist_items_write on public.checklist_items;
create policy checklist_items_write on public.checklist_items for all to authenticated
using (public.current_app_role() in ('ADMIN','MANAGER') or exists(select 1 from public.tasks t where t.id = task_id and t.assignee_id = public.my_employee_id()))
with check (public.current_app_role() in ('ADMIN','MANAGER') or exists(select 1 from public.tasks t where t.id = task_id and t.assignee_id = public.my_employee_id()));

do $$ begin alter publication supabase_realtime add table public.work_blocks; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.checklists; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.tasks; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.checklist_items; exception when duplicate_object then null; end $$;
