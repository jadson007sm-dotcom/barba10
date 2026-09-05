create table if not exists public.admin_audit_logs (
 id uuid primary key default gen_random_uuid(),
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 action text not null,
 target_type text not null,
 target_id uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);
create index if not exists admin_audit_logs_target_idx on public.admin_audit_logs(target_type,target_id);
create index if not exists admin_audit_logs_actor_user_id_idx on public.admin_audit_logs(actor_user_id);
alter table public.admin_audit_logs enable row level security;
create policy "Super admins can read audit logs" on public.admin_audit_logs for select to authenticated using ((select private.is_super_admin()));

create or replace function public.power_set_tenant_status(p_tenant_id uuid,p_status public.tenant_status)
returns public.tenants language plpgsql security invoker set search_path = '' as $$
declare v_tenant public.tenants;
begin
 if not (select private.is_super_admin()) then raise exception 'not authorized'; end if;
 update public.tenants set status=p_status,updated_at=now() where id=p_tenant_id returning * into v_tenant;
 if v_tenant.id is null then raise exception 'tenant not found'; end if;
 insert into public.admin_audit_logs(actor_user_id,action,target_type,target_id,metadata) values((select auth.uid()),'tenant_status_changed','tenant',p_tenant_id,jsonb_build_object('status',p_status::text));
 return v_tenant;
end; $$;
revoke all on function public.power_set_tenant_status(uuid,public.tenant_status) from public;
grant execute on function public.power_set_tenant_status(uuid,public.tenant_status) to authenticated;

create or replace function public.power_set_member_role(p_membership_id uuid,p_role public.app_role)
returns public.tenant_members language plpgsql security invoker set search_path = '' as $$
declare v_member public.tenant_members; v_old public.app_role;
begin
 if not (select private.is_super_admin()) then raise exception 'not authorized'; end if;
 if p_role='super_admin' then raise exception 'global role cannot be assigned as tenant role'; end if;
 select role into v_old from public.tenant_members where id=p_membership_id;
 update public.tenant_members set role=p_role where id=p_membership_id returning * into v_member;
 if v_member.id is null then raise exception 'membership not found'; end if;
 insert into public.admin_audit_logs(actor_user_id,action,target_type,target_id,metadata) values((select auth.uid()),'member_role_changed','tenant_member',p_membership_id,jsonb_build_object('from',v_old::text,'to',p_role::text,'tenant_id',v_member.tenant_id));
 return v_member;
end; $$;
revoke all on function public.power_set_member_role(uuid,public.app_role) from public;
grant execute on function public.power_set_member_role(uuid,public.app_role) to authenticated;

create or replace function public.power_create_barbershop(p_name text,p_slug text,p_owner_user_id uuid,p_status public.tenant_status default 'trial')
returns public.tenants language plpgsql security invoker set search_path = '' as $$
declare v_tenant public.tenants;
begin
 if not (select private.is_super_admin()) then raise exception 'not authorized'; end if;
 if length(trim(p_name))<2 then raise exception 'invalid name'; end if;
 if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid slug'; end if;
 if exists(select 1 from public.tenants where slug=p_slug) then raise exception 'slug already exists'; end if;
 insert into public.tenants(name,slug,status,owner_user_id) values(trim(p_name),lower(p_slug),p_status,p_owner_user_id) returning * into v_tenant;
 insert into public.tenant_members(tenant_id,user_id,role) values(v_tenant.id,p_owner_user_id,'barbershop_owner');
 insert into public.admin_audit_logs(actor_user_id,action,target_type,target_id,metadata) values((select auth.uid()),'tenant_created','tenant',v_tenant.id,jsonb_build_object('name',v_tenant.name,'slug',v_tenant.slug,'owner_user_id',p_owner_user_id));
 return v_tenant;
end; $$;
revoke all on function public.power_create_barbershop(text,text,uuid,public.tenant_status) from public;
grant execute on function public.power_create_barbershop(text,text,uuid,public.tenant_status) to authenticated;

create or replace function public.power_set_global_role(p_user_id uuid,p_role public.app_role)
returns public.user_global_roles language plpgsql security invoker set search_path = '' as $$
declare v_role public.user_global_roles;
begin
 if not (select private.is_super_admin()) then raise exception 'not authorized'; end if;
 if p_role<>'super_admin' then raise exception 'only super_admin is supported'; end if;
 insert into public.user_global_roles(user_id,role) values(p_user_id,p_role) on conflict(user_id,role) do update set role=excluded.role returning * into v_role;
 insert into public.admin_audit_logs(actor_user_id,action,target_type,target_id,metadata) values((select auth.uid()),'global_role_granted','user',p_user_id,jsonb_build_object('role',p_role::text));
 return v_role;
end; $$;
revoke all on function public.power_set_global_role(uuid,public.app_role) from public;
grant execute on function public.power_set_global_role(uuid,public.app_role) to authenticated;
