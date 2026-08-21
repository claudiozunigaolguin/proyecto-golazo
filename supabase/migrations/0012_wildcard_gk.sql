-- GOLAZO / PENTAGOLAZO — Arquero comodín.
--
-- Agrega un tope real y configurable de jugadores por plantel
-- (`max_players_per_team`, opcional). Cuando el único arquero de un equipo
-- queda inhabilitado y el plantel ya está al máximo, el equipo puede pedir
-- un cupo extra excepcional (solo arquero) que un admin del campeonato
-- aprueba o rechaza. No existe un rol de "delegado de equipo" separado, así
-- que se reutiliza la distinción ya existente: organizer pide, solo admin
-- aprueba/rechaza.

alter table public.championships
  add column max_players_per_team int;

alter table public.teams
  add column wildcard_gk_slots int not null default 0;

create table public.wildcard_requests (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  reason text not null,
  replaced_player_id uuid references public.players (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index wildcard_requests_championship_id_idx on public.wildcard_requests (championship_id);

alter table public.wildcard_requests enable row level security;

-- ============================================================
-- is_championship_admin: como is_championship_manager, pero exige rol
-- 'admin' específicamente (el owner ya queda con role='admin' vía el
-- trigger handle_new_championship, y se revisa también por si acaso).
-- ============================================================
create or replace function public.is_championship_admin(p_championship_id uuid)
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
      where cm.championship_id = p_championship_id and cm.user_id = auth.uid() and cm.role = 'admin'
    )
    or exists (
      select 1 from public.championships c
      where c.id = p_championship_id and c.owner_id = auth.uid()
    );
$$;

create policy "wildcard_requests_select" on public.wildcard_requests for select to authenticated
  using (public.is_championship_manager(championship_id));
create policy "wildcard_requests_insert" on public.wildcard_requests for insert to authenticated
  with check (public.is_championship_manager(championship_id));
create policy "wildcard_requests_update" on public.wildcard_requests for update to authenticated
  using (public.is_championship_admin(championship_id))
  with check (public.is_championship_admin(championship_id));

-- ============================================================
-- Tope de plantel: si el campeonato define max_players_per_team, un
-- equipo no puede superar ese número más los cupos comodín ya aprobados.
-- ============================================================
-- Deriva championship_id desde team_id (no desde new.championship_id): el
-- trigger trg_sync_player_championship, que corrige ese campo si el
-- cliente lo manda mal, se llama "trg_sync_..." y Postgres ejecuta los
-- triggers BEFORE del mismo evento en orden alfabético por nombre — como
-- "trg_enforce_roster_limit" < "trg_sync_player_championship", el de acá
-- correría ANTES y podría ver un championship_id todavía no corregido.
-- Derivarlo acá mismo evita depender de ese orden.
create or replace function public.enforce_roster_limit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_max int;
  v_current int;
  v_wildcard int;
begin
  select championship_id into v_championship_id from public.teams where id = new.team_id;
  select max_players_per_team into v_max from public.championships where id = v_championship_id;
  if v_max is null then
    return new;
  end if;

  select count(*) into v_current from public.players where team_id = new.team_id;
  select coalesce(wildcard_gk_slots, 0) into v_wildcard from public.teams where id = new.team_id;

  if v_current >= (v_max + v_wildcard) then
    raise exception 'El equipo alcanzó el máximo de % jugadores permitidos.', v_max
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_roster_limit
  before insert on public.players
  for each row execute function public.enforce_roster_limit();

-- ============================================================
-- Aprobar / rechazar: solo is_championship_admin del campeonato de la
-- solicitud. Aprobar incrementa el cupo del equipo en la misma transacción.
-- ============================================================
create or replace function public.approve_wildcard_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_team_id uuid;
begin
  select championship_id, team_id into v_championship_id, v_team_id
  from public.wildcard_requests where id = p_request_id and status = 'pending';

  if v_championship_id is null then
    raise exception 'Solicitud no encontrada o ya resuelta';
  end if;

  if not public.is_championship_admin(v_championship_id) then
    raise exception 'No autorizado';
  end if;

  update public.wildcard_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;

  update public.teams set wildcard_gk_slots = wildcard_gk_slots + 1 where id = v_team_id;
end;
$$;

create or replace function public.reject_wildcard_request(p_request_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
begin
  select championship_id into v_championship_id
  from public.wildcard_requests where id = p_request_id and status = 'pending';

  if v_championship_id is null then
    raise exception 'Solicitud no encontrada o ya resuelta';
  end if;

  if not public.is_championship_admin(v_championship_id) then
    raise exception 'No autorizado';
  end if;

  update public.wildcard_requests
  set status = 'rejected', review_notes = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;
end;
$$;
