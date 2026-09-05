alter table public.tenants
  add column if not exists owner_user_id uuid references auth.users(id) on delete restrict;

update public.tenants
set owner_user_id = (
  select tm.user_id
  from public.tenant_members tm
  where tm.tenant_id = tenants.id
    and tm.role = 'barbershop_owner'::public.app_role
  limit 1
)
where owner_user_id is null;

alter table public.tenants
  alter column owner_user_id set not null;

create index if not exists tenants_owner_user_id_idx on public.tenants(owner_user_id);

drop policy if exists tenants_insert_authenticated_owner on public.tenants;
create policy tenants_insert_authenticated_owner
on public.tenants
for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

drop policy if exists tenant_members_insert_owner on public.tenant_members;
create policy tenant_members_insert_owner
on public.tenant_members
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'barbershop_owner'::public.app_role
  and exists (
    select 1
    from public.tenants t
    where t.id = tenant_id
      and t.owner_user_id = (select auth.uid())
  )
);

create or replace function public.create_barbershop_for_current_user(
  barbershop_name text,
  barbershop_slug text,
  owner_full_name text default null,
  owner_phone text default null
)
returns uuid
language plpgsql
security invoker
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

  insert into public.tenants(name, slug, status, owner_user_id)
  values (trim(barbershop_name), lower(trim(barbershop_slug)), 'trial', current_user_id)
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
