-- GOLAZO — Fase de grupos para el sistema "Grupos + playoffs".
-- Un campeonato con competition_system = 'groups_playoffs' define cuántos
-- grupos tiene (group_count); cada equipo se asigna a un grupo; el fixture
-- y la tabla de posiciones se calculan dentro de cada grupo.

alter table public.championships
  add column group_count int;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  name text not null,
  order_number int not null,
  created_at timestamptz not null default now(),
  unique (championship_id, order_number)
);

create index groups_championship_id_idx on public.groups (championship_id);

alter table public.teams
  add column group_id uuid references public.groups (id) on delete set null;

alter table public.groups enable row level security;

create policy "groups_select" on public.groups for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "groups_write" on public.groups for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

-- get_standings ahora acepta un grupo opcional para calcular la tabla
-- dentro de un solo grupo (usado cuando competition_system = 'groups_playoffs').
drop function if exists public.get_standings(uuid);

create or replace function public.get_standings(p_championship_id uuid, p_group_id uuid default null)
returns table (
  team_id uuid,
  team_name text,
  team_short_name text,
  team_logo_url text,
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
      t.id as team_id,
      t.name as team_name,
      t.short_name as team_short_name,
      t.logo_url as team_logo_url,
      count(r.team_id) as played,
      count(*) filter (where r.outcome = 1) as won,
      count(*) filter (where r.outcome = 0) as drawn,
      count(*) filter (where r.outcome = -1) as lost,
      coalesce(sum(r.gf), 0) as goals_for,
      coalesce(sum(r.ga), 0) as goals_against
    from public.teams t
    left join results r on r.team_id = t.id
    where t.championship_id = p_championship_id
      and (p_group_id is null or t.group_id = p_group_id)
    group by t.id, t.name, t.short_name, t.logo_url
  ),
  champ as (
    select points_win, points_draw, points_loss
    from public.championships
    where id = p_championship_id
  )
  select
    a.team_id,
    a.team_name,
    a.team_short_name,
    a.team_logo_url,
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
  order by points desc, goal_difference desc, goals_for desc, a.team_name asc;
$$;
