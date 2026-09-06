-- ==========================================================
-- BARBA10: ATIVAÇÃO IMEDIATA DO SUPER ADMIN (PAINEL POWER)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================================

-- 1. Atribui a role super_admin ao usuário jadson007sm@gmail.com (ou primeiro usuário)
insert into public.user_global_roles (user_id, role)
select id, 'super_admin'
from auth.users
where email = 'jadson007sm@gmail.com'
   or id = (select id from auth.users order by created_at asc limit 1)
order by (case when email = 'jadson007sm@gmail.com' then 0 else 1 end)
limit 1
on conflict (user_id) do update set role = 'super_admin';

-- 2. Garante perfil atualizado
insert into public.profiles (id, full_name, email)
select id, coalesce(raw_user_meta_data->>'full_name', 'Super Admin'), email
from auth.users
where id in (select user_id from public.user_global_roles where role = 'super_admin')
on conflict (id) do update set
  full_name = coalesce(excluded.full_name, profiles.full_name);

-- 3. Cria a função claim_first_super_admin para auto-recuperação contínua
create or replace function public.claim_first_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_admin_count integer;
begin
  if v_uid is null then
    return false;
  end if;

  select count(*) into v_admin_count
  from public.user_global_roles
  where role::text = 'super_admin';

  if v_admin_count = 0 then
    insert into public.user_global_roles (user_id, role)
    values (v_uid, 'super_admin')
    on conflict (user_id) do update set role = 'super_admin';

    insert into public.admin_audit_logs (actor_user_id, action, target_type, target_id, metadata)
    values (v_uid, 'initial_super_admin_claimed', 'user', v_uid, jsonb_build_object('auto_claimed', true));

    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.claim_first_super_admin() to authenticated, anon;

-- 4. Exibe o resultado da validação
select u.id, u.email, r.role
from auth.users u
join public.user_global_roles r on r.user_id = u.id
where r.role = 'super_admin';
