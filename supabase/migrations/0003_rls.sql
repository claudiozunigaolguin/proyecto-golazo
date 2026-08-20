-- GOLAZO — Row Level Security
-- Rol por campeonato (championship_members.role) en vez de rol global:
-- quien crea un campeonato queda como 'admin' de ESE campeonato; 'organizer'
-- se agrega manualmente con los mismos permisos de gestión sobre ese campeonato.
-- "Espectador" = cualquier usuario (o anónimo) sin membresía: solo lectura pública.

-- ============================================================
-- Helpers (security definer para evitar recursión de RLS)
-- ============================================================
create or replace function public.is_championship_manager(p_championship_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.championship_members cm
      where cm.championship_id = p_championship_id and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.championships c
      where c.id = p_championship_id and c.owner_id = auth.uid()
    );
$$;

create or replace function public.is_championship_public(p_championship_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_public from public.championships where id = p_championship_id),
    false
  );
$$;

-- ============================================================
-- profiles
-- ============================================================
alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- championships
-- ============================================================
alter table public.championships enable row level security;

create policy "championships_select_public_or_member"
  on public.championships for select
  to anon, authenticated
  using (
    is_public = true
    or auth.uid() = owner_id
    or exists (
      select 1 from public.championship_members cm
      where cm.championship_id = id and cm.user_id = auth.uid()
    )
  );

create policy "championships_insert_own"
  on public.championships for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "championships_update_managers"
  on public.championships for update
  to authenticated
  using (public.is_championship_manager(id))
  with check (public.is_championship_manager(id));

create policy "championships_delete_owner"
  on public.championships for delete
  to authenticated
  using (auth.uid() = owner_id);

-- ============================================================
-- championship_members
-- ============================================================
alter table public.championship_members enable row level security;

create policy "championship_members_select_self_or_manager"
  on public.championship_members for select
  to authenticated
  using (user_id = auth.uid() or public.is_championship_manager(championship_id));

create policy "championship_members_insert_managers"
  on public.championship_members for insert
  to authenticated
  with check (public.is_championship_manager(championship_id));

create policy "championship_members_update_managers"
  on public.championship_members for update
  to authenticated
  using (public.is_championship_manager(championship_id));

create policy "championship_members_delete_managers"
  on public.championship_members for delete
  to authenticated
  using (public.is_championship_manager(championship_id));

-- ============================================================
-- Tablas hijas del campeonato: mismo patrón de lectura/escritura
-- (venues, rounds, teams, players, matches, match_events)
-- ============================================================
alter table public.venues enable row level security;
alter table public.rounds enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;

create policy "venues_select" on public.venues for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "venues_write" on public.venues for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

create policy "rounds_select" on public.rounds for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "rounds_write" on public.rounds for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

create policy "teams_select" on public.teams for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "teams_write" on public.teams for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

create policy "players_select" on public.players for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "players_write" on public.players for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

create policy "matches_select" on public.matches for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "matches_write" on public.matches for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

create policy "match_events_select" on public.match_events for select to anon, authenticated
  using (public.is_championship_public(championship_id) or public.is_championship_manager(championship_id));
create policy "match_events_write" on public.match_events for all to authenticated
  using (public.is_championship_manager(championship_id))
  with check (public.is_championship_manager(championship_id));

-- ============================================================
-- notifications — solo lectura/propias; la escritura queda para un
-- backend con service role (Edge Function) en una iteración futura.
-- ============================================================
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
