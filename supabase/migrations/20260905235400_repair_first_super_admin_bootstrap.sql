-- Repara o primeiro bootstrap quando a primeira conta foi criada
-- antes da atribuição da role super_admin.
-- Condição estrita: exatamente 1 usuário no Auth e nenhum super_admin.

do $$
declare
  v_user_id uuid;
  v_user_count integer;
  v_admin_count integer;
begin
  select count(*) into v_user_count from auth.users;
  select count(*) into v_admin_count
    from public.user_global_roles
   where role = 'super_admin';

  if v_user_count = 1 and v_admin_count = 0 then
    select id into v_user_id from auth.users limit 1;

    insert into public.user_global_roles (user_id, role)
    values (v_user_id, 'super_admin');

    insert into public.admin_audit_logs
      (actor_user_id, action, target_type, target_id, metadata)
    values
      (
        v_user_id,
        'initial_super_admin_repaired',
        'user',
        v_user_id,
        jsonb_build_object(
          'reason',
          'first authenticated user existed without super_admin role'
        )
      );
  end if;
end $$;
