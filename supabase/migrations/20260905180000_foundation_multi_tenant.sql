-- BARBA10 Foundation: identidade, tenants, membros e RLS.
-- A migration equivalente já foi aplicada no projeto Supabase conectado.

create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'barbershop_owner', 'barbershop_manager', 'barber', 'customer');
create type public.tenant_status as enum ('active', 'suspended', 'trial', 'cancelled');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.tenant_status not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  constraint tenant_members_role check (role <> 'super_admin')
);

create index tenant_members_user_id_idx on public.tenant_members(user_id);
create index tenant_members_tenant_id_idx on public.tenant_members(tenant_id);

create table public.user_global_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  constraint user_global_roles_only_super_admin check (role = 'super_admin')
);

create or replace function public.is_super_admin(target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_global_roles where user_id = target_user_id and role = 'super_admin');
$$;

create or replace function public.is_tenant_member(target_tenant_id uuid, target_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin(target_user_id) or exists (
    select 1 from public.tenant_members where tenant_id = target_tenant_id and user_id = target_user_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger tenants_set_updated_at before update on public.tenants for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_members enable row level security;
alter table public.user_global_roles enable row level security;

create policy "tenants_select_member_or_admin" on public.tenants for select using (public.is_tenant_member(id));
create policy "tenants_insert_super_admin" on public.tenants for insert with check (public.is_super_admin());
create policy "tenants_update_super_admin" on public.tenants for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy "tenants_delete_super_admin" on public.tenants for delete using (public.is_super_admin());

create policy "profiles_select_self_or_tenant_member" on public.profiles for select using (
  id = auth.uid() or public.is_super_admin() or exists (
    select 1 from public.tenant_members tm where tm.user_id = profiles.id and public.is_tenant_member(tm.tenant_id)
  )
);
create policy "profiles_insert_self" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_self_or_admin" on public.profiles for update using (id = auth.uid() or public.is_super_admin()) with check (id = auth.uid() or public.is_super_admin());

create policy "tenant_members_select_member_or_admin" on public.tenant_members for select using (user_id = auth.uid() or public.is_tenant_member(tenant_id));
create policy "tenant_members_insert_admin" on public.tenant_members for insert with check (public.is_super_admin());
create policy "tenant_members_update_admin" on public.tenant_members for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy "tenant_members_delete_admin" on public.tenant_members for delete using (public.is_super_admin());

create policy "global_roles_select_self_or_admin" on public.user_global_roles for select using (user_id = auth.uid() or public.is_super_admin());
create policy "global_roles_insert_admin" on public.user_global_roles for insert with check (public.is_super_admin());
create policy "global_roles_update_admin" on public.user_global_roles for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy "global_roles_delete_admin" on public.user_global_roles for delete using (public.is_super_admin());
