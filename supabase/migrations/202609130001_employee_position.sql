alter table public.employees
  add column if not exists position text not null default '';
