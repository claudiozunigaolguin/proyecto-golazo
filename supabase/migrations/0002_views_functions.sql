-- GOLAZO — vistas y funciones derivadas.
-- Goleadores, asistencias, tarjetas y tabla de posiciones NUNCA se ingresan
-- a mano: se calculan siempre desde match_events / matches.

-- ============================================================
-- Vistas: goals / assists / cards sobre match_events
-- ============================================================
create view public.goals as
  select * from public.match_events where type = 'goal';

create view public.assists as
  select * from public.match_events where type = 'assist';

create view public.cards as
  select * from public.match_events where type in ('yellow_card', 'red_card');

-- ============================================================
-- Tabla de posiciones
-- ============================================================
create or replace function public.get_standings(p_championship_id uuid)
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

-- ============================================================
-- Goleadores
-- Nota: "matches_played" se aproxima a partir de partidos donde el jugador
-- tiene al menos un evento registrado, ya que el MVP no lleva planillas de
-- alineación titular/suplente por partido.
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
    p.id, p.first_name, p.last_name, p.jersey_number, p.photo_url,
    p.team_id, t.name,
    gc.goals::int,
    coalesce(ap.matches_played, 0)::int
  from goals_count gc
  join public.players p on p.id = gc.player_id
  join public.teams t on t.id = p.team_id
  left join appearances ap on ap.player_id = p.id
  order by gc.goals desc, ap.matches_played asc nulls last, p.last_name asc
  limit p_limit;
$$;

-- ============================================================
-- Asistencias
-- ============================================================
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
    p.id, p.first_name, p.last_name, p.jersey_number, p.photo_url,
    p.team_id, t.name,
    ac.assists::int,
    coalesce(ap.matches_played, 0)::int
  from assists_count ac
  join public.players p on p.id = ac.player_id
  join public.teams t on t.id = p.team_id
  left join appearances ap on ap.player_id = p.id
  order by ac.assists desc, ap.matches_played asc nulls last, p.last_name asc
  limit p_limit;
$$;

-- ============================================================
-- Tarjetas
-- ============================================================
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
    p.id, p.first_name, p.last_name, p.jersey_number, p.photo_url,
    p.team_id, t.name,
    count(*) filter (where me.type = 'yellow_card')::int as yellow_cards,
    count(*) filter (where me.type = 'red_card')::int as red_cards
  from public.match_events me
  join public.players p on p.id = me.player_id
  join public.teams t on t.id = p.team_id
  where me.championship_id = p_championship_id
    and me.type in ('yellow_card', 'red_card')
  group by p.id, p.first_name, p.last_name, p.jersey_number, p.photo_url, p.team_id, t.name
  order by yellow_cards desc, red_cards desc, p.last_name asc
  limit p_limit;
$$;

-- ============================================================
-- Estadísticas generales del campeonato
-- ============================================================
create or replace function public.get_championship_stats(p_championship_id uuid)
returns table (
  total_matches int,
  played_matches int,
  remaining_matches int,
  total_goals int,
  avg_goals_per_match numeric,
  total_yellow_cards int,
  total_red_cards int,
  top_scoring_team_id uuid,
  top_scoring_team_name text,
  best_defense_team_id uuid,
  best_defense_team_name text
)
language plpgsql
stable
as $$
declare
  v_total_matches int;
  v_played_matches int;
  v_total_goals int;
begin
  select count(*) into v_total_matches
  from public.matches where championship_id = p_championship_id;

  select count(*) into v_played_matches
  from public.matches where championship_id = p_championship_id and status = 'finished';

  select coalesce(sum(coalesce(home_score, 0) + coalesce(away_score, 0)), 0) into v_total_goals
  from public.matches where championship_id = p_championship_id and status = 'finished';

  return query
  select
    v_total_matches,
    v_played_matches,
    (v_total_matches - v_played_matches),
    v_total_goals,
    case when v_played_matches > 0 then round(v_total_goals::numeric / v_played_matches, 2) else 0 end,
    (select count(*)::int from public.match_events
      where championship_id = p_championship_id and type = 'yellow_card'),
    (select count(*)::int from public.match_events
      where championship_id = p_championship_id and type = 'red_card'),
    top.team_id, top.team_name,
    def.team_id, def.team_name
  from
    (select team_id, team_name from public.get_standings(p_championship_id)
      order by goals_for desc limit 1) top
    full outer join
    (select team_id, team_name from public.get_standings(p_championship_id)
      order by goals_against asc, played desc limit 1) def
    on true;
end;
$$;
