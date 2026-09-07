-- Server-side notification outbox. A Database Webhook on INSERT calls the
-- `send-push` Edge Function, so delivery does not depend on another app being open.
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_kind text not null check (event_kind in ('GOODS_EXPORT','GOODS_AIR','DATA','ABNORMALITY','TASK_COMPLETED','SHIFT_CHANGED')),
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  body text not null default '',
  route text not null default '/',
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  delivery_error text
);

create index if not exists notification_events_created_at_idx on public.notification_events(created_at desc);
alter table public.notification_events enable row level security;

drop policy if exists notification_events_read_active on public.notification_events;
create policy notification_events_read_active on public.notification_events
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
);

grant select on public.notification_events to authenticated;

create or replace function public.enqueue_change_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind text;
  notification_title text;
  notification_body text;
  notification_route text;
  actor uuid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
begin
  if tg_table_name = 'goods_items' then
    kind := case when coalesce(new.source_kind, 'SEA') = 'AIR' then 'GOODS_AIR' else 'GOODS_EXPORT' end;
    notification_title := case when kind = 'GOODS_AIR' then 'Hàng Air có thay đổi' else 'Hàng xuất có thay đổi' end;
    notification_body := concat_ws(' · ', nullif(new.invoice, ''), nullif(new.product_code, ''), nullif(new.status, ''));
    notification_route := '/goods';
  elsif tg_table_name = 'data_items' then
    kind := 'DATA'; notification_title := 'DATA có thay đổi';
    notification_body := concat_ws(' · ', nullif(new.product_code, ''), nullif(new.invoice, ''), nullif(new.status, ''));
    notification_route := '/goods';
  elsif tg_table_name = 'abnormalities' then
    kind := 'ABNORMALITY'; notification_title := 'Báo cáo bất thường';
    notification_body := left(coalesce(new.description, new.abnormal_type, 'Có báo cáo mới'), 180);
    notification_route := '/abnormal/' || new.id::text;
  elsif tg_table_name = 'tasks' then
    if tg_op <> 'UPDATE' or new.status <> 'COMPLETED' or old.status = 'COMPLETED' then return new; end if;
    kind := 'TASK_COMPLETED'; notification_title := 'Công việc đã hoàn thành';
    notification_body := coalesce(new.name, 'Một công việc vừa hoàn thành');
    notification_route := '/tasks/' || new.id::text;
  elsif tg_table_name = 'schedule_adjustments' then
    if tg_op = 'UPDATE' and new.status is not distinct from old.status and new.adjusted_shift_code is not distinct from old.adjusted_shift_code then return new; end if;
    kind := 'SHIFT_CHANGED'; notification_title := 'Có thay đổi ca';
    notification_body := concat_ws(' · ', new.work_date::text, nullif(new.original_shift_code, ''), '→ ' || new.adjusted_shift_code);
    notification_route := '/attendance';
  else
    return new;
  end if;

  insert into public.notification_events(event_kind, entity_type, entity_id, title, body, route, actor_id)
  values (kind, tg_table_name, new.id, notification_title, notification_body, notification_route, actor);
  return new;
end;
$$;

drop trigger if exists notify_goods_change on public.goods_items;
create trigger notify_goods_change after insert or update of invoice, product_code, status, source_kind, export_date, quantity on public.goods_items
for each row when (new.deleted_at is null) execute function public.enqueue_change_notification();

drop trigger if exists notify_data_change on public.data_items;
create trigger notify_data_change after insert or update of product_code, invoice, status, quantity on public.data_items
for each row when (new.deleted_at is null) execute function public.enqueue_change_notification();

drop trigger if exists notify_abnormality_change on public.abnormalities;
create trigger notify_abnormality_change after insert or update of status, description, severity, handler_id on public.abnormalities
for each row when (new.deleted_at is null) execute function public.enqueue_change_notification();

drop trigger if exists notify_task_completed on public.tasks;
create trigger notify_task_completed after update of status on public.tasks
for each row when (new.deleted_at is null) execute function public.enqueue_change_notification();

drop trigger if exists notify_shift_change on public.schedule_adjustments;
create trigger notify_shift_change after insert or update of status, adjusted_shift_code on public.schedule_adjustments
for each row when (new.deleted_at is null) execute function public.enqueue_change_notification();

do $$ begin
  alter publication supabase_realtime add table public.notification_events;
exception when duplicate_object then null; end $$;
