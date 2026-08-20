-- GOLAZO / PENTAGOLAZO — super admin, planes y límite de campeonatos.
--
-- Modelo:
--   - profiles.is_super_admin: acceso total, sin límites, administra
--     cualquier campeonato (no solo los propios).
--   - profiles.plan: 'free' | 'starter' | 'growth' | 'unlimited'.
--       free       -> 1 campeonato, con nombre y eliminación bloqueados
--                      (evita crear-borrar para "reciclar" el cupo gratis).
--       starter    -> hasta 10 campeonatos  (USD 5/mes)
--       growth     -> hasta 30 campeonatos  (USD 10/mes)
--       unlimited  -> sin límite            (USD 15/mes)
--   - El pago recurrente real (Stripe) se conecta después: este esquema ya
--     deja los campos (stripe_customer_id, stripe_subscription_id,
--     plan_renews_at) listos para que un webhook los actualice.

alter table public.profiles
  add column is_super_admin boolean not null default false,
  add column plan text not null default 'free' check (plan in ('free', 'starter', 'growth', 'unlimited')),
  add column plan_renews_at timestamptz,
  add column stripe_customer_id text,
  add column stripe_subscription_id text;

alter table public.championships
  add column name_locked boolean not null default false,
  add column delete_locked boolean not null default false;

-- ============================================================
-- Límite de campeonatos según el plan. Los super admin no tienen límite.
-- ============================================================
create or replace function public.get_championship_limit(p_user_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select case
    when (select is_super_admin from public.profiles where id = p_user_id) then null
    when (select plan from public.profiles where id = p_user_id) = 'starter' then 10
    when (select plan from public.profiles where id = p_user_id) = 'growth' then 30
    when (select plan from public.profiles where id = p_user_id) = 'unlimited' then null
    else 1
  end;
$$;

-- ============================================================
-- is_championship_manager: los super admin administran cualquier campeonato.
-- ============================================================
create or replace function public.is_championship_manager(p_championship_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce((select is_super_admin from public.profiles where id = auth.uid()), false)
    or exists (
      select 1 from public.championship_members cm
      where cm.championship_id = p_championship_id and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.championships c
      where c.id = p_championship_id and c.owner_id = auth.uid()
    );
$$;

-- ============================================================
-- Al crear un campeonato: valida el cupo del plan, y si es el primer
-- campeonato de un usuario en plan 'free', lo deja bloqueado (no se puede
-- renombrar ni eliminar) para que no sirva de "cupo reciclable".
-- ============================================================
create or replace function public.enforce_championship_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int;
  v_current_count int;
  v_plan text;
begin
  v_limit := public.get_championship_limit(new.owner_id);

  if v_limit is not null then
    select count(*) into v_current_count
    from public.championships
    where owner_id = new.owner_id;

    if v_current_count >= v_limit then
      raise exception 'Llegaste al límite de campeonatos de tu plan (%). Mejora tu plan para crear más.', v_limit
        using errcode = 'P0001';
    end if;
  end if;

  select plan into v_plan from public.profiles where id = new.owner_id;
  if v_plan = 'free' and not coalesce((select is_super_admin from public.profiles where id = new.owner_id), false) then
    new.name_locked := true;
    new.delete_locked := true;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_championship_limit
  before insert on public.championships
  for each row execute function public.enforce_championship_limit();

-- ============================================================
-- Impide renombrar o eliminar un campeonato bloqueado (plan gratis).
-- ============================================================
create or replace function public.enforce_championship_locks()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE' then
    if old.name_locked and new.name is distinct from old.name then
      raise exception 'Este campeonato no se puede renombrar (es tu campeonato del plan gratuito).';
    end if;
    return new;
  end if;

  if TG_OP = 'DELETE' then
    if old.delete_locked then
      raise exception 'Este campeonato no se puede eliminar (es tu campeonato del plan gratuito).';
    end if;
    return old;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_championship_locks_update
  before update on public.championships
  for each row execute function public.enforce_championship_locks();

-- ============================================================
-- name_locked / delete_locked los pone el sistema al crear el campeonato;
-- ningún usuario (ni siquiera el dueño) puede des-bloquearlos por su cuenta.
-- ============================================================
create or replace function public.protect_lock_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
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

create trigger trg_protect_lock_fields
  before update on public.championships
  for each row execute function public.protect_lock_fields();

create trigger trg_enforce_championship_locks_delete
  before delete on public.championships
  for each row execute function public.enforce_championship_locks();

-- ============================================================
-- Un usuario normal NUNCA puede cambiarse a sí mismo is_super_admin, plan,
-- ni los campos de Stripe llamando directo a la API (aunque la política RLS
-- de "actualiza tu propio perfil" lo dejaría a nivel de fila, esto lo
-- bloquea a nivel de columna). Solo el rol de servicio (usado por el futuro
-- webhook de Stripe, o SQL ejecutado a mano por el dueño del proyecto)
-- puede tocar estos campos.
-- ============================================================
create or replace function public.protect_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
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

create trigger trg_protect_billing_fields
  before update on public.profiles
  for each row execute function public.protect_billing_fields();

-- ============================================================
-- Cuántos campeonatos tiene y cuántos le quedan al usuario actual.
-- ============================================================
create or replace function public.get_my_billing_status()
returns table (
  plan text,
  is_super_admin boolean,
  championship_count int,
  championship_limit int,
  plan_renews_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.plan,
    p.is_super_admin,
    (select count(*)::int from public.championships where owner_id = auth.uid()),
    public.get_championship_limit(auth.uid()),
    p.plan_renews_at
  from public.profiles p
  where p.id = auth.uid();
$$;

-- ============================================================
-- Convertir a un usuario en super administrador (ejecutar a mano una vez,
-- después de que esa cuenta se haya registrado en la app):
--
--   update public.profiles set is_super_admin = true
--   where email = 'claudiozunigaolguin@gmail.com';
-- ============================================================
