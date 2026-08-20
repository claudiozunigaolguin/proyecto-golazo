-- GOLAZO — schema inicial
-- Tablas base, índices y triggers de integridad/consistencia.

create extension if not exists pgcrypto;

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- championships
-- ============================================================
create table public.championships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  short_name text,
  season text,
  description text,
  location text,
  city text,
  country text,
  start_date date,
  end_date date,
  logo_url text,
  cover_image_url text,
  sport_mode text not null default 'futbol_6',
  team_size int not null default 6,
  max_teams int,
  competition_system text not null default 'round_robin'
    check (competition_system in ('round_robin', 'groups_playoffs', 'knockout', 'league_playoffs')),
  points_win int not null default 3,
  points_draw int not null default 1,
  points_loss int not null default 0,
  tiebreakers text[] not null default array['points', 'goal_difference', 'goals_for'],
  status text not null default 'upcoming'
    check (status in ('upcoming', 'ongoing', 'finished')),
  is_public boolean not null default true,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index championships_owner_id_idx on public.championships (owner_id);
create index championships_status_idx on public.championships (status);

-- ============================================================
-- championship_members (rol por campeonato: admin | organizer)
-- ============================================================
create table public.championship_members (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'organizer')),
  created_at timestamptz not null default now(),
  unique (championship_id, user_id)
);

create index championship_members_user_id_idx on public.championship_members (user_id);
create index championship_members_championship_id_idx on public.championship_members (championship_id);

-- ============================================================
-- venues
-- ============================================================
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  name text not null,
  address text,
  city text,
  created_at timestamptz not null default now()
);

create index venues_championship_id_idx on public.venues (championship_id);

-- ============================================================
-- rounds (fechas / jornadas)
-- ============================================================
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  name text not null,
  order_number int not null,
  start_date date,
  created_at timestamptz not null default now(),
  unique (championship_id, order_number)
);

create index rounds_championship_id_idx on public.rounds (championship_id);

-- ============================================================
-- teams
-- ============================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  name text not null,
  short_name text,
  logo_url text,
  primary_color text,
  secondary_color text,
  captain_player_id uuid,
  coach_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (championship_id, name)
);

create index teams_championship_id_idx on public.teams (championship_id);

-- ============================================================
-- players
-- ============================================================
create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  championship_id uuid not null references public.championships (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  jersey_number int,
  photo_url text,
  position text not null check (position in ('gk', 'def', 'mid', 'fwd')),
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index players_team_id_idx on public.players (team_id);
create index players_championship_id_idx on public.players (championship_id);
create unique index players_team_jersey_unique
  on public.players (team_id, jersey_number)
  where jersey_number is not null;

alter table public.teams
  add constraint teams_captain_player_id_fkey
  foreign key (captain_player_id) references public.players (id) on delete set null;

-- ============================================================
-- matches
-- ============================================================
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships (id) on delete cascade,
  round_id uuid references public.rounds (id) on delete set null,
  home_team_id uuid not null references public.teams (id) on delete cascade,
  away_team_id uuid not null references public.teams (id) on delete cascade,
  venue_id uuid references public.venues (id) on delete set null,
  scheduled_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'finished', 'suspended', 'cancelled')),
  home_score int,
  away_score int,
  current_minute int,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create index matches_championship_status_idx on public.matches (championship_id, status);
create index matches_round_id_idx on public.matches (round_id);
create index matches_home_team_id_idx on public.matches (home_team_id);
create index matches_away_team_id_idx on public.matches (away_team_id);

-- ============================================================
-- match_events (fuente única de verdad: goles, asistencias, tarjetas, cambios)
-- ============================================================
create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  championship_id uuid not null references public.championships (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  player_id uuid references public.players (id) on delete set null,
  related_player_id uuid references public.players (id) on delete set null,
  type text not null check (
    type in ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'match_start', 'match_end')
  ),
  minute int,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index match_events_match_id_idx on public.match_events (match_id);
create index match_events_championship_id_idx on public.match_events (championship_id);
create index match_events_player_id_idx on public.match_events (player_id);
create index match_events_type_idx on public.match_events (type);

-- ============================================================
-- notifications (arquitectura preparada para push; el envío real es un paso futuro)
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, read_at);

-- ============================================================
-- Triggers: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.championships
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.teams
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.players
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();

-- ============================================================
-- Trigger: crear profile automáticamente al registrarse (Supabase Auth)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Trigger: el creador de un campeonato queda como admin automáticamente
-- ============================================================
create or replace function public.handle_new_championship()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.championship_members (championship_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict (championship_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_championship_created
  after insert on public.championships
  for each row execute function public.handle_new_championship();

-- ============================================================
-- Trigger: championship_id de players siempre se deriva del equipo
-- (evita inconsistencias si el cliente envía un valor incorrecto)
-- ============================================================
create or replace function public.sync_player_championship()
returns trigger
language plpgsql
as $$
begin
  select championship_id into new.championship_id
  from public.teams where id = new.team_id;
  return new;
end;
$$;

create trigger trg_sync_player_championship
  before insert or update of team_id on public.players
  for each row execute function public.sync_player_championship();

-- ============================================================
-- Trigger: los equipos de un partido deben pertenecer al mismo campeonato
-- ============================================================
create or replace function public.validate_match_teams()
returns trigger
language plpgsql
as $$
declare
  v_home_champ uuid;
  v_away_champ uuid;
begin
  select championship_id into v_home_champ from public.teams where id = new.home_team_id;
  select championship_id into v_away_champ from public.teams where id = new.away_team_id;

  if v_home_champ is distinct from new.championship_id or v_away_champ is distinct from new.championship_id then
    raise exception 'Ambos equipos deben pertenecer al campeonato del partido';
  end if;

  return new;
end;
$$;

create trigger trg_validate_match_teams
  before insert or update of home_team_id, away_team_id, championship_id on public.matches
  for each row execute function public.validate_match_teams();

-- ============================================================
-- Trigger: championship_id y team_id de match_events se derivan/validan
-- siempre desde el partido (evita eventos "sueltos" o de un equipo ajeno)
-- ============================================================
create or replace function public.sync_match_event_championship()
returns trigger
language plpgsql
as $$
declare
  v_champ uuid;
  v_home uuid;
  v_away uuid;
begin
  select championship_id, home_team_id, away_team_id
    into v_champ, v_home, v_away
  from public.matches where id = new.match_id;

  new.championship_id := v_champ;

  if new.team_id <> v_home and new.team_id <> v_away then
    raise exception 'El equipo del evento debe ser local o visitante del partido';
  end if;

  return new;
end;
$$;

create trigger trg_sync_match_event_championship
  before insert or update of match_id, team_id on public.match_events
  for each row execute function public.sync_match_event_championship();
