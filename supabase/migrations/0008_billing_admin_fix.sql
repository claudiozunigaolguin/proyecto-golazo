-- Corrige un bug de 0007_billing.sql: los triggers de protección solo
-- dejaban pasar auth.role() = 'service_role' (peticiones vía API con la
-- service role key), pero el SQL Editor de Supabase se conecta directo
-- como el rol de base de datos `postgres`, donde auth.role() da NULL — así
-- que el propio dueño del proyecto quedaba bloqueado para activarse como
-- super admin a mano. Ahora también se permite cuando el rol de conexión
-- es `postgres` o `supabase_admin` (acceso administrativo directo).

create or replace function public.protect_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if new.is_super_admin is distinct from old.is_super_admin
    or new.plan is distinct from old.plan
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.plan_renews_at is distinct from old.plan_renews_at
  then
    raise exception 'No puedes modificar tu plan o permisos directamente.';
  end if;

  return new;
end;
$$;

create or replace function public.protect_lock_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if new.name_locked is distinct from old.name_locked
    or new.delete_locked is distinct from old.delete_locked
  then
    raise exception 'No puedes modificar el bloqueo de este campeonato.';
  end if;

  return new;
end;
$$;
