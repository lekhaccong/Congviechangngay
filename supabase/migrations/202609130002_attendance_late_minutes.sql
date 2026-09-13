alter table public.attendance
  add column if not exists late_minutes integer not null default 0
  check (late_minutes >= 0);
