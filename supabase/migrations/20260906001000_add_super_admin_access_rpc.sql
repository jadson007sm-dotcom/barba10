create or replace function public.has_current_user_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_global_roles
    where user_id = auth.uid()
      and role::text = 'super_admin'
  );
$$;

revoke all on function public.has_current_user_super_admin() from public;
grant execute on function public.has_current_user_super_admin() to authenticated, anon;
