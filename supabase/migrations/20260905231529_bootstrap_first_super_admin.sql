-- Secure first Super Admin bootstrap.
-- The bootstrap is only available while the Auth user table is empty.

create or replace function private.bootstrap_first_super_admin(p_full_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_count bigint;
  v_has_super_admin boolean;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select count(*) into v_user_count from auth.users;
  if v_user_count <> 1 then raise exception 'initial super admin setup is closed'; end if;
  select exists(select 1 from public.user_global_roles where role = 'super_admin') into v_has_super_admin;
  if v_has_super_admin then raise exception 'super admin already configured'; end if;
  insert into public.user_global_roles(user_id, role)
  values (v_user_id, 'super_admin')
  on conflict (user_id) do update set role = excluded.role;
  update public.profiles
  set full_name = nullif(trim(p_full_name), ''), updated_at = now()
  where id = v_user_id;
  insert into public.admin_audit_logs(actor_user_id, action, target_type, target_id, metadata)
  values (v_user_id, 'initial_super_admin_created', 'user', v_user_id,
          jsonb_build_object('full_name', nullif(trim(p_full_name), '')));
  return true;
end;
$$;
revoke all on function private.bootstrap_first_super_admin(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.bootstrap_first_super_admin(text) to authenticated;

create or replace function public.bootstrap_first_super_admin(p_full_name text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin return private.bootstrap_first_super_admin(p_full_name); end;
$$;
revoke all on function public.bootstrap_first_super_admin(text) from public;
revoke execute on function public.bootstrap_first_super_admin(text) from anon;
grant execute on function public.bootstrap_first_super_admin(text) to authenticated;

create or replace function private.is_initial_super_admin_setup_available()
returns boolean language sql security definer set search_path = '' stable as $$
  select not exists (select 1 from auth.users);
$$;
revoke all on function private.is_initial_super_admin_setup_available() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_initial_super_admin_setup_available() to anon, authenticated;

create or replace function public.is_initial_super_admin_setup_available()
returns boolean language sql security invoker set search_path = '' stable as $$
  select private.is_initial_super_admin_setup_available();
$$;
revoke all on function public.is_initial_super_admin_setup_available() from public;
grant execute on function public.is_initial_super_admin_setup_available() to anon, authenticated;
