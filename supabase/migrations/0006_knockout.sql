-- GOLAZO — Fase eliminatoria (playoffs) tras la fase de grupos.
-- Los 2 primeros de cada grupo clasifican a un cuadro de eliminación directa
-- (cuartos/semis/final según la cantidad de clasificados) hasta la final.

-- ============================================================
-- matches: nuevas columnas para partidos de eliminatoria.
-- home_team_id / away_team_id pasan a ser opcionales porque los cruces de
-- rondas futuras (ej. "Ganador semifinal 1 vs Ganador semifinal 2") se crean
-- de antemano sin equipos definidos todavía, y se completan solos cuando
-- termina el partido que los alimenta (ver trigger más abajo).
-- ============================================================
alter table public.matches
  alter column home_team_id drop not null,
  alter column away_team_id drop not null;

alter table public.matches
  add column stage text not null default 'group' check (stage in ('group', 'knockout')),
  add column bracket_round text,
  add column bracket_round_order int,
  add column bracket_position int,
  add column next_match_id uuid references public.matches (id) on delete set null,
  add column next_match_slot text check (next_match_slot in ('home', 'away'));

create index matches_stage_idx on public.matches (championship_id, stage);

-- ============================================================
-- validate_match_teams: ahora debe tolerar home/away nulos (cruces TBD).
-- ============================================================
create or replace function public.validate_match_teams()
returns trigger
language plpgsql
as $$
declare
  v_home_champ uuid;
  v_away_champ uuid;
begin
  if new.home_team_id is not null then
    select championship_id into v_home_champ from public.teams where id = new.home_team_id;
    if v_home_champ is distinct from new.championship_id then
      raise exception 'El equipo local debe pertenecer al campeonato del partido';
    end if;
  end if;

  if new.away_team_id is not null then
    select championship_id into v_away_champ from public.teams where id = new.away_team_id;
    if v_away_champ is distinct from new.championship_id then
      raise exception 'El equipo visitante debe pertenecer al campeonato del partido';
    end if;
  end if;

  if new.home_team_id is not null and new.home_team_id = new.away_team_id then
    raise exception 'El equipo local y visitante no pueden ser el mismo';
  end if;

  return new;
end;
$$;

-- ============================================================
-- Trigger: al finalizar un partido de eliminatoria, el ganador avanza
-- automáticamente al cruce siguiente (si lo hay). Sin empates: si hay
-- empate no se define ganador (la UI ya bloquea guardar un empate en
-- fase eliminatoria).
-- ============================================================
create or replace function public.advance_knockout_winner()
returns trigger
language plpgsql
as $$
declare
  v_winner_id uuid;
begin
  if new.stage <> 'knockout' or new.status <> 'finished' or new.next_match_id is null then
    return new;
  end if;
  if new.home_score is null or new.away_score is null or new.home_score = new.away_score then
    return new;
  end if;

  v_winner_id := case when new.home_score > new.away_score then new.home_team_id else new.away_team_id end;

  if new.next_match_slot = 'home' then
    update public.matches set home_team_id = v_winner_id where id = new.next_match_id;
  else
    update public.matches set away_team_id = v_winner_id where id = new.next_match_id;
  end if;

  return new;
end;
$$;

create trigger trg_advance_knockout_winner
  after update of status, home_score, away_score on public.matches
  for each row execute function public.advance_knockout_winner();

-- ============================================================
-- get_standings: excluir partidos de eliminatoria de la tabla de posiciones
-- de fase de grupos (solo debe reflejar resultados de fase 'group').
-- ============================================================
drop function if exists public.get_standings(uuid, uuid);

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
      and stage = 'group'
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
      and stage = 'group'
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
