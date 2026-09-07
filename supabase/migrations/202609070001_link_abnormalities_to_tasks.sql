-- Liên kết bất thường với khối/công việc/ngày/ca mà không thay đổi dữ liệu cũ.
alter table public.abnormalities
  add column if not exists work_block_id text references public.work_blocks(id) on update cascade on delete restrict,
  add column if not exists task_id uuid references public.tasks(id) on update cascade on delete set null,
  add column if not exists work_date date,
  add column if not exists manager_shift_id text;

create index if not exists abnormalities_work_block_idx on public.abnormalities(work_block_id);
create index if not exists abnormalities_task_idx on public.abnormalities(task_id);
create index if not exists abnormalities_date_shift_idx on public.abnormalities(work_date, manager_shift_id);
