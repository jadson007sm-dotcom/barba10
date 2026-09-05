-- Permite que a página pública consulte somente serviços e barbeiros ativos.
create policy if not exists staff_public_read on public.staff for select using(is_active=true);
