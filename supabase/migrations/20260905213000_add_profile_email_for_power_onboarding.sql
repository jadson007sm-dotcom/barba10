alter table public.profiles add column if not exists email text;
create index if not exists profiles_email_idx on public.profiles(lower(email));

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and (p.email is null or p.email = '');

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when public.profiles.full_name is null or public.profiles.full_name = ''
          then excluded.full_name
          else public.profiles.full_name
        end;
  return new;
end;
$function$;