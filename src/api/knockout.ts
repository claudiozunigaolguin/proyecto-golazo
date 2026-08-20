import { supabase } from '@/lib/supabase';
import { getStandings } from '@/api/stats';
import type { Group } from '@/api/groups';
import type { Database } from '@/types/database.types';

export type KnockoutMatch = Database['public']['Tables']['matches']['Row'];

function roundNameForRemaining(remaining: number): string {
  switch (remaining) {
    case 1:
      return 'Final';
    case 2:
      return 'Semifinal';
    case 3:
      return 'Cuartos de Final';
    case 4:
      return 'Octavos de Final';
    default:
      return `Ronda de ${2 ** remaining}`;
  }
}

export async function listKnockoutMatches(championshipId: string): Promise<KnockoutMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('championship_id', championshipId)
    .eq('stage', 'knockout')
    .order('bracket_round_order', { ascending: true })
    .order('bracket_position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function clearKnockoutBracket(championshipId: string): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('championship_id', championshipId)
    .eq('stage', 'knockout');
  if (error) throw error;
}

type Provider = { teamId: string } | { pendingMatchId: string };

/**
 * Genera el cuadro de eliminación directa: los 2 primeros de cada grupo
 * clasifican (sembrados 1ros contra 2dos para evitar cruces tempranos entre
 * equipos del mismo grupo), se completa con "byes" hasta la potencia de 2
 * más cercana, y se crean todas las rondas de antemano — las rondas
 * posteriores a la primera arrancan con uno o ambos cupos vacíos y se
 * completan solas cuando termina el partido que los alimenta (ver trigger
 * advance_knockout_winner en la migración 0006).
 */
export async function generateKnockoutBracket(championshipId: string, groups: Group[]): Promise<void> {
  if (groups.length < 1) {
    throw new Error('Necesitas al menos un grupo para generar la fase eliminatoria');
  }

  const firstPlace: string[] = [];
  const secondPlace: string[] = [];
  for (const group of groups) {
    const standings = await getStandings(championshipId, group.id);
    if (standings[0]) firstPlace.push(standings[0].team_id);
    if (standings[1]) secondPlace.push(standings[1].team_id);
  }
  const qualified = [...firstPlace, ...secondPlace];
  if (qualified.length < 2) {
    throw new Error('No hay suficientes equipos clasificados todavía (se necesitan al menos 2)');
  }

  let bracketSize = 1;
  while (bracketSize < qualified.length) bracketSize *= 2;
  const seeds: (string | null)[] = [...qualified];
  while (seeds.length < bracketSize) seeds.push(null);

  const totalRounds = Math.log2(bracketSize);
  const half = bracketSize / 2;
  const round1Pairs: [string | null, string | null][] = [];
  for (let i = 0; i < half; i++) {
    round1Pairs.push([seeds[i] ?? null, seeds[bracketSize - 1 - i] ?? null]);
  }

  let currentProviders: Provider[] = [];
  let position = 0;

  // Ronda 1: crea partidos reales; un cupo vacío = bye, el equipo avanza directo.
  for (const [a, b] of round1Pairs) {
    if (a && !b) {
      currentProviders.push({ teamId: a });
      continue;
    }
    if (b && !a) {
      currentProviders.push({ teamId: b });
      continue;
    }
    if (!a && !b) continue;

    const { data, error } = await supabase
      .from('matches')
      .insert({
        championship_id: championshipId,
        home_team_id: a,
        away_team_id: b,
        status: 'scheduled',
        stage: 'knockout',
        bracket_round: roundNameForRemaining(totalRounds),
        bracket_round_order: 1,
        bracket_position: position++,
      })
      .select('*')
      .single();
    if (error) throw error;
    currentProviders.push({ pendingMatchId: data.id });
  }

  // Rondas siguientes: siempre se crea el partido (con los cupos que ya se conocen).
  let remaining = totalRounds - 1;
  let roundOrder = 2;
  while (currentProviders.length > 1) {
    const nextProviders: Provider[] = [];
    const roundName = roundNameForRemaining(remaining);
    let roundPosition = 0;

    for (let i = 0; i < currentProviders.length / 2; i++) {
      const left = currentProviders[i * 2] as Provider;
      const right = currentProviders[i * 2 + 1] as Provider;

      const homeTeamId = 'teamId' in left ? left.teamId : null;
      const awayTeamId = 'teamId' in right ? right.teamId : null;

      const { data: nextMatch, error } = await supabase
        .from('matches')
        .insert({
          championship_id: championshipId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          status: 'scheduled',
          stage: 'knockout',
          bracket_round: roundName,
          bracket_round_order: roundOrder,
          bracket_position: roundPosition++,
        })
        .select('*')
        .single();
      if (error) throw error;

      if (!('teamId' in left)) {
        const { error: linkError } = await supabase
          .from('matches')
          .update({ next_match_id: nextMatch.id, next_match_slot: 'home' })
          .eq('id', left.pendingMatchId);
        if (linkError) throw linkError;
      }
      if (!('teamId' in right)) {
        const { error: linkError } = await supabase
          .from('matches')
          .update({ next_match_id: nextMatch.id, next_match_slot: 'away' })
          .eq('id', right.pendingMatchId);
        if (linkError) throw linkError;
      }

      nextProviders.push({ pendingMatchId: nextMatch.id });
    }

    currentProviders = nextProviders;
    remaining--;
    roundOrder++;
  }
}
