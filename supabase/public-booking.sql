-- Permite que a página pública consulte somente barbeiros ativos.
do $$ begin create policy staff_public_read on public.staff for select using(is_active=true); exception when duplicate_object then null; end $$;
