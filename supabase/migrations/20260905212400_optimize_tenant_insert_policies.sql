drop policy if exists tenants_insert_authenticated_owner on public.tenants;
drop policy if exists tenants_insert_super_admin on public.tenants;
create policy tenants_insert_authenticated
on public.tenants
for insert
to authenticated
with check (
  private.is_super_admin()
  or owner_user_id = (select auth.uid())
);

drop policy if exists tenant_members_insert_owner on public.tenant_members;
drop policy if exists tenant_members_insert_admin on public.tenant_members;
create policy tenant_members_insert_authenticated
on public.tenant_members
for insert
to authenticated
with check (
  private.is_super_admin()
  or (
    user_id = (select auth.uid())
    and role = 'barbershop_owner'::public.app_role
    and exists (
      select 1
      from public.tenants t
      where t.id = tenant_id
        and t.owner_user_id = (select auth.uid())
    )
  )
);