-- GOLAZO / PENTAGOLAZO — Tarjetas por equipo (para el generador de imágenes
-- "Pentagolazo Share", que necesita columnas TA/TR que get_standings() no
-- calcula). Mismo patrón de agregación que get_top_cards()
-- (supabase/migrations/0002_views_functions.sql), agrupado por equipo en
-- vez de por jugador.

create or replace function public.get_team_cards(p_championship_id uuid)
returns table (
  team_id uuid,
  yellow_cards int,
  red_cards int
)
language sql
stable
as $$
  select
    team_id,
    count(*) filter (where type = 'yellow_card')::int as yellow_cards,
    count(*) filter (where type = 'red_card')::int as red_cards
  from public.match_events
  where championship_id = p_championship_id
    and type in ('yellow_card', 'red_card')
  group by team_id;
$$;
