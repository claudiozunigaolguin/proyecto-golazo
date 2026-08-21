-- GOLAZO / PENTAGOLAZO — Ficha única de jugador: separa "persona" (athlete)
-- de "inscripción por equipo" (players), agrega ID público PGZ-XXXXXX.
--
-- Antes: `players` mezclaba persona + inscripción, así que si el mismo
-- jugador cambiaba de equipo o campeonato quedaba con una ficha nueva.
-- Ahora: `athletes` es la persona real (RUT, nombre, foto, fecha de
-- nacimiento, public_code); `players` queda solo como la inscripción
-- (equipo, campeonato, dorsal, posición, athlete_id). El RUT vive aparte,
-- en una tabla sin ninguna policy de RLS — solo accesible vía funciones
-- security definer, para que nunca se filtre en una lectura pública.

-- ============================================================
-- Código público secuencial: PGZ-000001, PGZ-000002, ...
-- ============================================================
create sequence public.athlete_public_code_seq start 1;

create or replace function public.next_athlete_public_code()
returns text
language sql
as $$
  select 'PGZ-' || lpad(nextval('public.athlete_public_code_seq')::text, 6, '0');
$$;

-- ============================================================
-- athletes: la persona real, compartida entre todas sus inscripciones.
-- ============================================================
create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  birth_date date,
  photo_url text,
  public_code text not null unique default public.next_athlete_public_code(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.athletes enable row level security;

create trigger set_updated_at before update on public.athletes
  for each row execute function public.set_updated_at();

-- ============================================================
-- athlete_ruts: el RUT vive aparte y SIN policies — ni un manager
-- autenticado puede leerlo/escribirlo directo por la API. Solo las
-- funciones security definer de abajo (dueñas de la tabla) lo tocan.
-- ============================================================
create table public.athlete_ruts (
  athlete_id uuid primary key references public.athletes (id) on delete cascade,
  rut text not null unique,
  created_at timestamptz not null default now()
);

alter table public.athlete_ruts enable row level security;

-- ============================================================
-- players pasa a ser la inscripción: agrega athlete_id, migra los datos
-- actuales (un athlete nuevo por cada player existente — no hay RUT
-- histórico para deduplicar), y recién ahí se sueltan las columnas de
-- identidad.
-- ============================================================
alter table public.athletes add column source_player_id uuid;

insert into public.athletes (first_name, last_name, birth_date, photo_url, source_player_id)
select first_name, last_name, birth_date, photo_url, id
from public.players;

alter table public.players add column athlete_id uuid references public.athletes (id) on delete cascade;

update public.players p
set athlete_id = a.id
from public.athletes a
where a.source_player_id = p.id;

alter table public.athletes drop column source_player_id;

alter table public.players alter column athlete_id set not null;

alter table public.players
  drop column first_name,
  drop column last_name,
  drop column photo_url,
  drop column birth_date;

-- ============================================================
-- RLS de athletes: lectura pública (roster de equipo, ficha pública),
-- escritura solo para managers de algún campeonato donde el athlete tenga
-- inscripción. Sin policy de insert directo — todo pasa por
-- find_or_create_athlete().
-- ============================================================
create policy "athletes_select" on public.athletes for select to anon, authenticated
  using (true);

create policy "athletes_update" on public.athletes for update to authenticated
  using (exists (
    select 1 from public.players p
    where p.athlete_id = athletes.id and public.is_championship_manager(p.championship_id)
  ))
  with check (true);

-- ============================================================
-- find_or_create_athlete: dado un RUT (opcional), reutiliza el athlete
-- existente o crea uno nuevo. Único punto de escritura del RUT. Exige que
-- quien llama administre al menos un campeonato (no queda abierta a
-- cualquier usuario autenticado).
-- ============================================================
create or replace function public.find_or_create_athlete(
  p_rut text,
  p_first_name text,
  p_last_name text,
  p_birth_date date default null,
  p_photo_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_athlete_id uuid;
  v_rut text;
begin
  if not (
    coalesce((select is_super_admin from public.profiles where id = auth.uid()), false)
    or exists (select 1 from public.championship_members where user_id = auth.uid())
    or exists (select 1 from public.championships where owner_id = auth.uid())
  ) then
    raise exception 'No autorizado';
  end if;

  -- Normaliza a "XXXXXXXX-D" (sin puntos/espacios, dígito verificador en
  -- mayúscula) para que "12.345.678-5" y "12345678-5" deduplican igual.
  v_rut := nullif(upper(regexp_replace(trim(p_rut), '[.\s]', '', 'g')), '');

  if v_rut is not null then
    select athlete_id into v_athlete_id from public.athlete_ruts where rut = v_rut;
  end if;

  if v_athlete_id is not null then
    return v_athlete_id;
  end if;

  insert into public.athletes (first_name, last_name, birth_date, photo_url)
  values (p_first_name, p_last_name, p_birth_date, p_photo_url)
  returning id into v_athlete_id;

  if v_rut is not null then
    insert into public.athlete_ruts (athlete_id, rut) values (v_athlete_id, v_rut);
  end if;

  return v_athlete_id;
end;
$$;

-- ============================================================
-- get_athlete_rut: solo para managers que administran alguna inscripción
-- de ese athlete (verificación de identidad en cancha).
-- ============================================================
create or replace function public.get_athlete_rut(p_athlete_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rut text;
begin
  if not exists (
    select 1 from public.players p
    where p.athlete_id = p_athlete_id and public.is_championship_manager(p.championship_id)
  ) then
    raise exception 'No autorizado';
  end if;

  select rut into v_rut from public.athlete_ruts where athlete_id = p_athlete_id;
  return v_rut;
end;
$$;

-- ============================================================
-- Storage: foto de athlete, en athlete-photos/<athlete_id>/... (no hay
-- championship_id propio en un athlete — se valida por join a players).
-- ============================================================
create policy "golazo_media_athlete_photos_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'golazo-media'
    and (storage.foldername(name))[1] = 'athlete-photos'
    and exists (
      select 1 from public.players p
      where p.athlete_id = ((storage.foldername(name))[2])::uuid
        and public.is_championship_manager(p.championship_id)
    )
  );

create policy "golazo_media_athlete_photos_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'golazo-media'
    and (storage.foldername(name))[1] = 'athlete-photos'
    and exists (
      select 1 from public.players p
      where p.athlete_id = ((storage.foldername(name))[2])::uuid
        and public.is_championship_manager(p.championship_id)
    )
  );

create policy "golazo_media_athlete_photos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'golazo-media'
    and (storage.foldername(name))[1] = 'athlete-photos'
    and exists (
      select 1 from public.players p
      where p.athlete_id = ((storage.foldername(name))[2])::uuid
        and public.is_championship_manager(p.championship_id)
    )
  );

-- ============================================================
-- get_top_scorers / get_top_assists / get_top_cards: ahora unen a
-- athletes para nombre/foto (players ya no los tiene).
-- ============================================================
create or replace function public.get_top_scorers(p_championship_id uuid, p_limit int default 50)
returns table (
  player_id uuid,
  first_name text,
  last_name text,
  jersey_number int,
  photo_url text,
  team_id uuid,
  team_name text,
  goals int,
  matches_played int
)
language sql
stable
as $$
  with goals_count as (
    select me.player_id, count(*) as goals
    from public.match_events me
    where me.championship_id = p_championship_id
      and me.type = 'goal'
      and me.player_id is not null
    group by me.player_id
  ),
  appearances as (
    select me.player_id, count(distinct me.match_id) as matches_played
    from public.match_events me
    where me.championship_id = p_championship_id
      and me.player_id is not null
    group by me.player_id
  )
  select
    p.id, a.first_name, a.last_name, p.jersey_number, a.photo_url,
    p.team_id, t.name,
    gc.goals::int,
    coalesce(ap.matches_played, 0)::int
  from goals_count gc
  join public.players p on p.id = gc.player_id
  join public.athletes a on a.id = p.athlete_id
  join public.teams t on t.id = p.team_id
  left join appearances ap on ap.player_id = p.id
  order by gc.goals desc, ap.matches_played asc nulls last, a.last_name asc
  limit p_limit;
$$;

create or replace function public.get_top_assists(p_championship_id uuid, p_limit int default 50)
returns table (
  player_id uuid,
  first_name text,
  last_name text,
  jersey_number int,
  photo_url text,
  team_id uuid,
  team_name text,
  assists int,
  matches_played int
)
language sql
stable
as $$
  with assists_count as (
    select me.player_id, count(*) as assists
    from public.match_events me
    where me.championship_id = p_championship_id
      and me.type = 'assist'
      and me.player_id is not null
    group by me.player_id
  ),
  appearances as (
    select me.player_id, count(distinct me.match_id) as matches_played
    from public.match_events me
    where me.championship_id = p_championship_id
      and me.player_id is not null
    group by me.player_id
  )
  select
    p.id, a.first_name, a.last_name, p.jersey_number, a.photo_url,
    p.team_id, t.name,
    ac.assists::int,
    coalesce(ap.matches_played, 0)::int
  from assists_count ac
  join public.players p on p.id = ac.player_id
  join public.athletes a on a.id = p.athlete_id
  join public.teams t on t.id = p.team_id
  left join appearances ap on ap.player_id = p.id
  order by ac.assists desc, ap.matches_played asc nulls last, a.last_name asc
  limit p_limit;
$$;

create or replace function public.get_top_cards(p_championship_id uuid, p_limit int default 50)
returns table (
  player_id uuid,
  first_name text,
  last_name text,
  jersey_number int,
  photo_url text,
  team_id uuid,
  team_name text,
  yellow_cards int,
  red_cards int
)
language sql
stable
as $$
  select
    p.id, a.first_name, a.last_name, p.jersey_number, a.photo_url,
    p.team_id, t.name,
    count(*) filter (where me.type = 'yellow_card')::int as yellow_cards,
    count(*) filter (where me.type = 'red_card')::int as red_cards
  from public.match_events me
  join public.players p on p.id = me.player_id
  join public.athletes a on a.id = p.athlete_id
  join public.teams t on t.id = p.team_id
  where me.championship_id = p_championship_id
    and me.type in ('yellow_card', 'red_card')
  group by p.id, a.first_name, a.last_name, p.jersey_number, a.photo_url, p.team_id, t.name
  order by yellow_cards desc, red_cards desc, a.last_name asc
  limit p_limit;
$$;
