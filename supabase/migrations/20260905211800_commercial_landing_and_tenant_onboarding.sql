create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view','cta_signup_click','signup_started','signup_completed')),
  path text not null,
  session_id text not null,
  referrer text,
  source text,
  device_type text not null default 'unknown' check (device_type in ('mobile','tablet','desktop','unknown')),
  created_at timestamptz not null default now()
);

create index if not exists site_events_created_at_idx on public.site_events(created_at desc);
create index if not exists site_events_type_created_at_idx on public.site_events(event_type, created_at desc);

alter table public.site_events enable row level security;

drop policy if exists site_events_insert_anon on public.site_events;
create policy site_events_insert_anon on public.site_events
for insert to anon
with check (true);

drop policy if exists site_events_insert_authenticated on public.site_events;
create policy site_events_insert_authenticated on public.site_events
for insert to authenticated
with check (true);

drop policy if exists site_events_select_super_admin on public.site_events;
create policy site_events_select_super_admin on public.site_events
for select to authenticated
using (private.is_super_admin());

create or replace function public.create_barbershop_for_current_user(
  barbershop_name text,
  barbershop_slug text,
  owner_full_name text default null,
  owner_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  new_tenant_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if length(trim(barbershop_name)) < 2 or length(trim(barbershop_name)) > 120 then
    raise exception 'invalid_name';
  end if;

  if trim(barbershop_slug) !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$' then
    raise exception 'invalid_slug';
  end if;

  if exists (select 1 from public.tenants where slug = lower(trim(barbershop_slug))) then
    raise exception 'slug_unavailable';
  end if;

  insert into public.tenants(name, slug, status)
  values (trim(barbershop_name), lower(trim(barbershop_slug)), 'trial')
  returning id into new_tenant_id;

  insert into public.tenant_members(tenant_id, user_id, role)
  values (new_tenant_id, current_user_id, 'barbershop_owner');

  update public.profiles
  set full_name = coalesce(nullif(trim(owner_full_name), ''), full_name),
      phone = coalesce(nullif(trim(owner_phone), ''), phone)
  where id = current_user_id;

  return new_tenant_id;
end;
$function$;

revoke all on function public.create_barbershop_for_current_user(text,text,text,text) from public, anon;
grant execute on function public.create_barbershop_for_current_user(text,text,text,text) to authenticated;
