# PENTAGOLAZO — Arquitectura técnica

## 1. Stack

| Capa | Elección | Por qué |
|---|---|---|
| App | React Native + **Expo (SDK 52, managed)** + TypeScript estricto | Un solo código para Android/iOS, build en la nube (EAS), setup rápido |
| Navegación | **Expo Router** (file-based) | Rutas = archivos, deep-linking gratis (clave para el perfil público `/public/[slug]`), tabs anidados por rol |
| Backend | **Supabase** (Postgres + Auth + Storage + Realtime) | Backend completo sin mantener servidor propio, RLS a nivel de fila, barato, escala |
| Data fetching | **@tanstack/react-query** sobre `supabase-js` | Cache, refetch, invalidación tras mutaciones (registrar resultado → refrescar tabla) |
| Estado global liviano | **Zustand** (solo sesión de auth) | El resto del estado vive en react-query, evita duplicar fuente de verdad |
| Estilos | **StyleSheet de RN + tokens de tema centralizados** (`src/theme`) | Cero dependencias extra de build (evita romper Metro/Babel en SDK nuevo), mismo resultado visual, fácil de mantener |
| Validación | **Zod** | Mismos schemas para formularios y payloads |
| Realtime partido en vivo | Supabase Realtime (channel por `match_id`) | Marcador se actualiza sin polling |
| Compartir | `expo-sharing`, `react-native-qrcode-svg`, `Share` API | WhatsApp/IG/FB/copiar link + QR |

**Alternativa considerada:** backend propio (Node/Nest + Postgres). Descartada para el MVP: más costo operativo, más tiempo de desarrollo, sin ventaja real dado que RLS de Supabase cubre los requisitos de seguridad del punto 27.

## 2. Decisión clave de modelado: eventos como fuente única de verdad

En vez de tablas físicas separadas y editables a mano para `goals`, `assists`, `cards` y `standings` (que el punto 26 menciona como mínimo), se usa:

- **`match_events`**: tabla única append-only (gol, asistencia, amarilla, roja, cambio, inicio, fin).
- **`goals` / `assists` / `cards`**: **vistas SQL** sobre `match_events` (no tablas). Cumple el requisito de "evitar duplicación" y "la tabla de posiciones debe calcularse a partir de los partidos, no de datos ingresados manualmente" (punto 26).
- **`standings`**: función SQL `get_standings(championship_id)` que agrega `matches` finalizados. No es una tabla persistida → cero riesgo de inconsistencia.

Esto hace que registrar un resultado + eventos (punto 13/14) sea la única escritura; todo lo demás (goleadores, asistencias, tarjetas, tabla, stats) se deriva automáticamente.

## 3. Modelo de datos (Postgres)

```
profiles              id (=auth.users.id), first_name, last_name, email, phone, avatar_url
championships         id, owner_id→profiles, name, short_name, season, description,
                       location, city, country, start_date, end_date, logo_url, cover_image_url,
                       team_size (6), max_teams, competition_system, points_win/draw/loss,
                       tiebreakers (jsonb array), status, is_public, slug (unique, para URL pública)
championship_members  id, championship_id, user_id, role ('admin'|'organizer')
venues                id, championship_id, name, address, city
rounds                id, championship_id, name, "order", start_date
teams                 id, championship_id, name, short_name, logo_url,
                       primary_color, secondary_color, captain_player_id, coach_name
players                id, team_id, championship_id, first_name, last_name, jersey_number,
                       photo_url, position ('gk'|'def'|'mid'|'fwd'), birth_date
matches                id, championship_id, round_id, home_team_id, away_team_id, venue_id,
                       scheduled_at, status, home_score, away_score, current_minute, is_live
match_events           id, match_id, team_id, player_id, related_player_id (asistencia/cambio),
                       type ('goal'|'assist'|'yellow_card'|'red_card'|'substitution'|'match_start'|'match_end'),
                       minute, created_by, created_at
notifications          id, user_id, type, title, body, data (jsonb), read_at, created_at

-- Vistas / funciones derivadas
VIEW  goals            (match_events WHERE type='goal')
VIEW  assists           (match_events WHERE type='assist')
VIEW  cards             (match_events WHERE type IN ('yellow_card','red_card'))
FN    get_standings(championship_id)  → PJ/PG/PE/PP/GF/GC/DG/PTS por equipo, ordenado
FN    get_top_scorers / get_top_assists / get_top_cards(championship_id)
```

Índices: FK en todas las relaciones, índice compuesto `(championship_id, status)` en `matches`, `(match_id)` en `match_events`, único en `championships.slug`, único `(round... home_team, away_team)` para evitar fixture duplicado.

## 4. Roles y seguridad (RLS)

En vez de un rol global rígido, el rol es **por campeonato** vía `championship_members.role`:

- Quien crea un campeonato queda como `admin` de ese campeonato automáticamente (trigger).
- `organizer` = invitado por el admin, mismos permisos de gestión dentro de ese campeonato únicamente.
- "Espectador" = cualquier usuario autenticado o anónimo sin membresía → solo lectura de lo público.

Políticas RLS (resumen, detalle en `supabase/migrations`):
- Lectura pública: `is_public = true` en `championships` habilita SELECT a `anon`; en tablas hijas se valida vía join al campeonato.
- Escritura: `INSERT/UPDATE/DELETE` solo si `auth.uid()` está en `championship_members` de ese `championship_id` (o es `owner_id`).
- `profiles`: cada usuario solo edita su propia fila.
- `notifications`: cada usuario solo ve/edita las suyas.

## 5. Estructura de carpetas

```
app/                                 (Expo Router = rutas)
  _layout.tsx                        Root: providers (QueryClient, Auth), fuentes
  (auth)/login.tsx, register.tsx, forgot-password.tsx
  (tabs)/_layout.tsx                 Bottom tabs (según rol activo)
  (tabs)/index.tsx                   Home
  (tabs)/championships.tsx
  (tabs)/matches.tsx
  (tabs)/stats.tsx
  (tabs)/profile.tsx
  championship/create.tsx
  championship/[id]/_layout.tsx      Tabs internas del campeonato
  championship/[id]/index.tsx        Resumen
  championship/[id]/matches.tsx
  championship/[id]/table.tsx
  championship/[id]/teams.tsx
  championship/[id]/players.tsx
  championship/[id]/scorers.tsx
  championship/[id]/assists.tsx
  championship/[id]/cards.tsx
  championship/[id]/stats.tsx
  championship/[id]/fixture.tsx
  championship/[id]/admin.tsx        Panel admin del campeonato
  team/[id]/index.tsx
  player/[id]/index.tsx
  match/[id]/index.tsx               Detalle + registrar resultado/eventos
  match/[id]/live.tsx                 Modo partido en vivo
  public/[slug]/index.tsx             Perfil público (sin login)
src/
  components/  (Button, Card, Avatar, TeamLogo, PlayerCard, MatchCard, StandingTable,
                TopScorersList, StatCard, EventItem, TournamentCard, EmptyState, Skeleton, Badge)
  hooks/       (useAuth, useChampionship, useStandings, useTopScorers, useFixtureGenerator, ...)
  api/         (championships.ts, teams.ts, players.ts, matches.ts, events.ts — queries/mutations supabase)
  lib/         (supabase.ts, fixtureAlgorithm.ts, theme.ts, validations.ts)
  store/       (authStore.ts)
  types/       (database.types.ts, domain.ts)
supabase/
  migrations/0001_init.sql, 0002_rls.sql, 0003_functions.sql
  seed.sql
```

## 6. Algoritmo de fixture (todos contra todos)

Round-robin estándar (circle method): con N equipos (par; si es impar se agrega "descanso"), N-1 fechas, cada fecha N/2 partidos, rotando todos menos el primero. Genera automáticamente sin cruces duplicados y alterna local/visitante de forma balanceada. Implementado en `src/lib/fixtureAlgorithm.ts`, cubierto por función pura testeable.

## 7. MVP vs. futuro

Se implementa **solo** lo del punto 32 (MVP). Grupos+playoffs, eliminación directa, notificaciones push reales, live realtime multi-viewer, premios (MVP/Bota de Oro), fútbol 7/8/11, pagos, etc. quedan preparados en el modelo (enums extensibles, `sport_mode`, `competition_system`) pero no se construyen ahora.

## 8. Próximos pasos de esta sesión

1. Scaffold Expo + TypeScript + dependencias.
2. Migraciones SQL (schema + RLS + funciones).
3. Auth.
4. Home + navegación.
5. Campeonatos → Equipos → Jugadores → Fixture → Partidos → Resultado/Eventos.
6. Tabla, goleadores, asistencias, tarjetas, stats (derivados).
7. Perfil público + compartir.
8. Datos demo "Liga Golazo 2026".
9. Typecheck/lint final.
