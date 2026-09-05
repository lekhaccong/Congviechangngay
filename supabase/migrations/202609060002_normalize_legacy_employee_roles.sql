-- Accept payloads restored from pre-Phase-1 backups while keeping the cloud
-- constraint limited to the four current roles.
create or replace function public.normalize_legacy_employee_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.local_role := case upper(coalesce(new.local_role, ''))
    when 'ADMIN' then 'ADMIN'
    when 'MANAGER' then 'MANAGER'
    when 'LEADER' then 'MANAGER'
    when 'VIEWER' then 'VIEWER'
    when 'USER' then 'EMPLOYEE'
    else 'EMPLOYEE'
  end;
  return new;
end;
$$;

drop trigger if exists employees_normalize_legacy_role on public.employees;
create trigger employees_normalize_legacy_role
before insert or update of local_role on public.employees
for each row execute function public.normalize_legacy_employee_role();
