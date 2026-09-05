create schema if not exists private;

create or replace function private.is_super_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.user_global_roles
    where user_id = target_user_id
      and role = 'super_admin'::public.app_role
  );
$function$;

create or replace function private.is_tenant_member(
  target_tenant_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select private.is_super_admin(target_user_id)
    or exists (
      select 1
      from public.tenant_members
      where tenant_id = target_tenant_id
        and user_id = target_user_id
    );
$function$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function private.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop policy if exists profiles_select_self_or_tenant_member on public.profiles;
create policy profiles_select_self_or_tenant_member
on public.profiles
for select
to authenticated
using (
  (id = (select auth.uid()))
  or private.is_super_admin()
  or exists (
    select 1
    from public.tenant_members tm
    where tm.user_id = profiles.id
      and private.is_tenant_member(tm.tenant_id)
  )
);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
on public.profiles
for update
to authenticated
using ((id = (select auth.uid())) or private.is_super_admin())
with check ((id = (select auth.uid())) or private.is_super_admin());

drop policy if exists tenant_members_select_member_or_admin on public.tenant_members;
create policy tenant_members_select_member_or_admin
on public.tenant_members
for select
to authenticated
using (
  (user_id = (select auth.uid()))
  or private.is_tenant_member(tenant_id)
);

drop policy if exists tenant_members_insert_admin on public.tenant_members;
create policy tenant_members_insert_admin
on public.tenant_members
for insert
to authenticated
with check (private.is_super_admin());

drop policy if exists tenant_members_update_admin on public.tenant_members;
create policy tenant_members_update_admin
on public.tenant_members
for update
to authenticated
using (private.is_super_admin())
with check (private.is_super_admin());

drop policy if exists tenant_members_delete_admin on public.tenant_members;
create policy tenant_members_delete_admin
on public.tenant_members
for delete
to authenticated
using (private.is_super_admin());

drop policy if exists tenants_select_member_or_admin on public.tenants;
create policy tenants_select_member_or_admin
on public.tenants
for select
to authenticated
using (private.is_tenant_member(id));

drop policy if exists tenants_insert_super_admin on public.tenants;
create policy tenants_insert_super_admin
on public.tenants
for insert
to authenticated
with check (private.is_super_admin());

drop policy if exists tenants_update_super_admin on public.tenants;
create policy tenants_update_super_admin
on public.tenants
for update
to authenticated
using (private.is_super_admin())
with check (private.is_super_admin());

drop policy if exists tenants_delete_super_admin on public.tenants;
create policy tenants_delete_super_admin
on public.tenants
for delete
to authenticated
using (private.is_super_admin());

drop policy if exists global_roles_select_self_or_admin on public.user_global_roles;
create policy global_roles_select_self_or_admin
on public.user_global_roles
for select
to authenticated
using (
  (user_id = (select auth.uid()))
  or private.is_super_admin()
);

drop policy if exists global_roles_insert_admin on public.user_global_roles;
create policy global_roles_insert_admin
on public.user_global_roles
for insert
to authenticated
with check (private.is_super_admin());

drop policy if exists global_roles_update_admin on public.user_global_roles;
create policy global_roles_update_admin
on public.user_global_roles
for update
to authenticated
using (private.is_super_admin())
with check (private.is_super_admin());

drop policy if exists global_roles_delete_admin on public.user_global_roles;
create policy global_roles_delete_admin
on public.user_global_roles
for delete
to authenticated
using (private.is_super_admin());

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_super_admin(uuid) from public, anon, authenticated;
revoke all on function public.is_tenant_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_super_admin(uuid) to authenticated;
grant execute on function private.is_tenant_member(uuid, uuid) to authenticated;

drop function public.handle_new_user();
drop function public.is_super_admin(uuid);
drop function public.is_tenant_member(uuid, uuid);
drop function public.set_updated_at();