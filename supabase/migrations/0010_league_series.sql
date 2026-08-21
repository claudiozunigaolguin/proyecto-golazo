-- GOLAZO / PENTAGOLAZO — Liga amateur con series y tabla general por club.
--
-- Un campeonato con competition_system = 'league_series' siempre tiene 4
-- series fijas (Tercera, Segunda, Senior, Primera), modeladas reutilizando
-- la tabla `groups` tal cual existe para 'groups_playoffs' (nombre, orden,
-- equipos vía teams.group_id, tabla de posiciones vía get_standings).
--
-- Lo nuevo es el concepto de "club": una entidad que agrupa 4 equipos (uno
-- por serie, cada uno con su propio plantel) para poder sumar sus resultados
-- en una tabla general por club.

alter table public.championships
  drop constraint if exists championships_competition_system_check,
  add constraint championships_competition_system_check
    check (competition_system in ('round_robin', 'groups_playoffs', 'knockout', 'league_playoffs', 'league_series'));

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  name text not null,
  short_name text,
  logo_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz not null default now()
);

create index clubs_championship_id_idx on public.clubs (championship_id);

alter table public.clubs enable row level security;

create policy "clubs_select" on public.clubs for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "clubs_write" on public.clubs for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

alter table public.teams
  add column club_id uuid references public.clubs (id) on delete cascade;

create index teams_club_id_idx on public.teams (club_id);

-- ============================================================
-- Tabla general por club: suma las estadísticas de los 4 equipos (series)
-- de un mismo club. Mismo patrón agregador que get_standings(), agrupando
-- por club_id en vez de team_id.
-- ============================================================
create or replace function public.get_club_standings(p_championship_id uuid)
returns table (
  club_id uuid,
  club_name text,
  club_short_name text,
  club_logo_url text,
  played int,
  won int,
  drawn int,
  lost int,
  goals_for int,
  goals_against int,
  goal_difference int,
  points int
)
language sql
stable
as $$
  with results as (
    select
      home_team_id as team_id,
      home_score as gf,
      away_score as ga,
      case
        when home_score > away_score then 1
        when home_score = away_score then 0
        else -1
      end as outcome
    from public.matches
    where championship_id = p_championship_id
      and status = 'finished'
      and home_score is not null and away_score is not null
    union all
    select
      away_team_id as team_id,
      away_score as gf,
      home_score as ga,
      case
        when away_score > home_score then 1
        when away_score = home_score then 0
        else -1
      end as outcome
    from public.matches
    where championship_id = p_championship_id
      and status = 'finished'
      and home_score is not null and away_score is not null
  ),
  agg as (
    select
      c.id as club_id,
      c.name as club_name,
      c.short_name as club_short_name,
      c.logo_url as club_logo_url,
      count(r.team_id) as played,
      count(*) filter (where r.outcome = 1) as won,
      count(*) filter (where r.outcome = 0) as drawn,
      count(*) filter (where r.outcome = -1) as lost,
      coalesce(sum(r.gf), 0) as goals_for,
      coalesce(sum(r.ga), 0) as goals_against
    from public.clubs c
    join public.teams t on t.club_id = c.id
    left join results r on r.team_id = t.id
    where c.championship_id = p_championship_id
    group by c.id, c.name, c.short_name, c.logo_url
  ),
  champ as (
    select points_win, points_draw, points_loss
    from public.championships
    where id = p_championship_id
  )
  select
    a.club_id,
    a.club_name,
    a.club_short_name,
    a.club_logo_url,
    a.played::int,
    a.won::int,
    a.drawn::int,
    a.lost::int,
    a.goals_for::int,
    a.goals_against::int,
    (a.goals_for - a.goals_against)::int as goal_difference,
    (a.won * (select points_win from champ)
      + a.drawn * (select points_draw from champ)
      + a.lost * (select points_loss from champ))::int as points
  from agg a
  order by points desc, goal_difference desc, goals_for desc, a.club_name asc;
$$;
