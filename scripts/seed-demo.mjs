#!/usr/bin/env node
/**
 * Carga el campeonato demo "Liga Golazo 2026" con 8 equipos, jugadores,
 * fixture, resultados, goleadores y tarjetas — para poder probar PENTAGOLAZO
 * de inmediato una vez conectado a un proyecto Supabase real.
 *
 * Requiere permisos de servicio (bypassa RLS a propósito, solo para seed):
 *   SUPABASE_URL=...                 (mismo valor que EXPO_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY=...    (Project Settings → API → service_role)
 *   OWNER_EMAIL=tu-cuenta@registrada.com   (usuario ya registrado en la app)
 *
 * Uso:
 *   node scripts/seed-demo.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';

function loadDotEnv() {
  if (!existsSync('.env')) return;
  const content = readFileSync('.env', 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = process.env.OWNER_EMAIL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OWNER_EMAIL) {
  console.error(
    'Faltan variables de entorno. Define SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y OWNER_EMAIL ' +
      '(puedes ponerlas en un archivo .env en la raíz del proyecto) antes de ejecutar este script.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEAM_NAMES = [
  'Los Galácticos',
  'Atlético Rancagua',
  'FC Titanes',
  'Deportivo Central',
  'Los Cracks',
  'Unión Fútbol',
  'Real América',
  'Sporting 6',
];

const TEAM_COLORS = ['#0B7A3B', '#E5484D', '#2E7BE0', '#F5A524', '#7C3AED', '#0EA5A5', '#DB2777', '#14181A'];

const FIRST_NAMES = [
  'Juan', 'Pedro', 'Carlos', 'Diego', 'Matías', 'Sebastián', 'Cristóbal', 'Felipe',
  'Ignacio', 'Tomás', 'Benjamín', 'Vicente', 'Joaquín', 'Gabriel', 'Andrés', 'Rodrigo',
];
const LAST_NAMES = [
  'Pérez', 'González', 'Soto', 'Muñoz', 'Rojas', 'Contreras', 'Fuentes', 'Espinoza',
  'Reyes', 'Silva', 'Castro', 'Torres', 'Vega', 'Morales', 'Araya', 'Vargas',
];

const POSITIONS = ['gk', 'def', 'def', 'mid', 'mid', 'fwd', 'fwd', 'def'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function generateRoundRobinFixture(teamIds) {
  const BYE = '__BYE__';
  const ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push(BYE);
  const n = ids.length;
  const totalRounds = n - 1;
  const half = n / 2;
  const arr = [...ids];
  const fixture = [];

  for (let round = 0; round < totalRounds; round++) {
    const swap = round % 2 === 1;
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === BYE || b === BYE) continue;
      fixture.push({ round: round + 1, homeTeamId: swap ? b : a, awayTeamId: swap ? a : b });
    }
    const last = arr[n - 1];
    for (let i = n - 1; i > 1; i--) arr[i] = arr[i - 1];
    arr[1] = last;
  }
  return fixture;
}

async function main() {
  console.log('Buscando usuario dueño del campeonato demo...');
  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw usersError;
  const owner = usersPage.users.find((u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase());
  if (!owner) {
    throw new Error(
      `No se encontró ningún usuario registrado con el email ${OWNER_EMAIL}. Regístrate primero en la app.`
    );
  }
  console.log(`Dueño: ${owner.email} (${owner.id})`);

  console.log('Creando campeonato "Liga Golazo 2026"...');
  const slug = `${slugify('Liga Golazo 2026')}-${Math.random().toString(36).slice(2, 7)}`;
  const { data: championship, error: champError } = await supabase
    .from('championships')
    .insert({
      owner_id: owner.id,
      name: 'Liga Golazo 2026',
      short_name: 'LG26',
      season: '2026',
      description: 'Campeonato demo de PENTAGOLAZO para probar la app de inmediato.',
      city: 'Santiago',
      country: 'Chile',
      team_size: 6,
      max_teams: 8,
      competition_system: 'round_robin',
      points_win: 3,
      points_draw: 1,
      points_loss: 0,
      status: 'ongoing',
      is_public: true,
      slug,
    })
    .select('*')
    .single();
  if (champError) throw champError;
  console.log(`Campeonato creado: ${championship.id} (slug: ${championship.slug})`);

  console.log('Creando equipos...');
  const teams = [];
  for (let i = 0; i < TEAM_NAMES.length; i++) {
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        championship_id: championship.id,
        name: TEAM_NAMES[i],
        short_name: TEAM_NAMES[i].split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase(),
        primary_color: TEAM_COLORS[i],
        coach_name: `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`,
      })
      .select('*')
      .single();
    if (error) throw error;
    teams.push(team);
  }

  console.log('Creando jugadores...');
  const playersByTeam = new Map();
  for (const team of teams) {
    const players = [];
    for (let i = 0; i < POSITIONS.length; i++) {
      const { data: player, error } = await supabase
        .from('players')
        .insert({
          team_id: team.id,
          championship_id: championship.id,
          first_name: randomItem(FIRST_NAMES),
          last_name: randomItem(LAST_NAMES),
          jersey_number: i + 1,
          position: POSITIONS[i],
        })
        .select('*')
        .single();
      if (error) throw error;
      players.push(player);
    }
    playersByTeam.set(team.id, players);
  }

  console.log('Generando fixture...');
  const pairings = generateRoundRobinFixture(teams.map((t) => t.id));
  const roundNumbers = [...new Set(pairings.map((p) => p.round))].sort((a, b) => a - b);

  const { data: rounds, error: roundsError } = await supabase
    .from('rounds')
    .insert(roundNumbers.map((n) => ({ championship_id: championship.id, name: `Fecha ${n}`, order_number: n })))
    .select('*');
  if (roundsError) throw roundsError;
  const roundIdByNumber = new Map(rounds.map((r) => [r.order_number, r.id]));

  const matchRows = pairings.map((p) => ({
    championship_id: championship.id,
    round_id: roundIdByNumber.get(p.round),
    home_team_id: p.homeTeamId,
    away_team_id: p.awayTeamId,
    status: 'scheduled',
  }));
  const { data: matches, error: matchesError } = await supabase.from('matches').insert(matchRows).select('*');
  if (matchesError) throw matchesError;

  console.log('Jugando las primeras 3 fechas con resultados y eventos...');
  const playedRounds = new Set(roundNumbers.slice(0, 3));
  const matchesToPlay = matches.filter((m) => {
    const round = rounds.find((r) => r.id === m.round_id);
    return round && playedRounds.has(round.order_number);
  });

  for (const match of matchesToPlay) {
    const homeGoals = Math.floor(Math.random() * 4);
    const awayGoals = Math.floor(Math.random() * 4);

    const events = [];
    const addGoal = (teamId) => {
      const scorer = randomItem(playersByTeam.get(teamId));
      events.push({
        match_id: match.id,
        team_id: teamId,
        player_id: scorer.id,
        type: 'goal',
        minute: 1 + Math.floor(Math.random() * 44),
      });
      if (Math.random() > 0.4) {
        const teammates = playersByTeam.get(teamId).filter((p) => p.id !== scorer.id);
        const assister = randomItem(teammates);
        events.push({
          match_id: match.id,
          team_id: teamId,
          player_id: assister.id,
          type: 'assist',
          minute: events[events.length - 1].minute,
        });
      }
    };

    for (let i = 0; i < homeGoals; i++) addGoal(match.home_team_id);
    for (let i = 0; i < awayGoals; i++) addGoal(match.away_team_id);

    for (const teamId of [match.home_team_id, match.away_team_id]) {
      const cardCount = Math.random() > 0.6 ? 1 : 0;
      for (let i = 0; i < cardCount; i++) {
        const player = randomItem(playersByTeam.get(teamId));
        events.push({
          match_id: match.id,
          team_id: teamId,
          player_id: player.id,
          type: Math.random() > 0.85 ? 'red_card' : 'yellow_card',
          minute: 1 + Math.floor(Math.random() * 90),
        });
      }
    }

    if (events.length > 0) {
      const { error: eventsError } = await supabase.from('match_events').insert(events);
      if (eventsError) throw eventsError;
    }

    const { error: resultError } = await supabase
      .from('matches')
      .update({ status: 'finished', home_score: homeGoals, away_score: awayGoals })
      .eq('id', match.id);
    if (resultError) throw resultError;
  }

  console.log('\n✅ Listo. "Liga Golazo 2026" cargada con:');
  console.log(`   ${teams.length} equipos, ${teams.length * POSITIONS.length} jugadores`);
  console.log(`   ${matches.length} partidos (${matchesToPlay.length} ya jugados)`);
  console.log(`   Perfil público: /public/${championship.slug}`);
}

main().catch((err) => {
  console.error('\n❌ Error al cargar los datos demo:', err.message ?? err);
  process.exit(1);
});
