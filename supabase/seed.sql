-- Seed seguro: não grava senhas no repositório.
-- 1) Crie o usuário Super Admin no Supabase Authentication > Users.
-- 2) Use o mesmo e-mail informado no seu ambiente e confirme o usuário.
-- 3) Depois execute:
-- update public.profiles set role='super_admin', full_name='BARBA10 Super Admin' where id=(select id from auth.users where email='SEU_EMAIL_ADMIN');
-- Dados demonstrativos:
insert into public.tenants(name,slug,phone) values('Barbearia Exemplo','barbearia-exemplo','75999999999') on conflict (slug) do nothing;
insert into public.shops(tenant_id,name,slug,city,state) select id,'Unidade Principal','principal','Feira de Santana','BA' from public.tenants where slug='barbearia-exemplo' and not exists(select 1 from public.shops s where s.slug='principal' and s.tenant_id=public.tenants.id);
insert into public.services(tenant_id,shop_id,name,duration_minutes,price) select t.id,s.id,'Corte Masculino',40,25 from public.tenants t join public.shops s on s.tenant_id=t.id where t.slug='barbearia-exemplo' and not exists(select 1 from public.services x where x.shop_id=s.id and x.name='Corte Masculino');
