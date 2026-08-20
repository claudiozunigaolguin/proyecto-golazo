import { supabase } from '@/lib/supabase';
import { generateRoundRobinFixture } from '@/lib/fixtureAlgorithm';
import { listGroupsByChampionship } from '@/api/groups';

export async function listRoundsByChampionship(championshipId: string) {
  const { data, error } = await supabase
    .from('rounds')
    .select('*')
    .eq('championship_id', championshipId)
    .order('order_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface FixtureTeam {
  id: string;
  group_id: string | null;
}

interface RoundInsert {
  championship_id: string;
  name: string;
  order_number: number;
}
interface MatchBlueprint {
  orderNumber: number;
  homeTeamId: string;
  awayTeamId: string;
}

/**
 * Genera el fixture todos-contra-todos para un campeonato. Si los equipos
 * tienen grupo asignado (sistema "Grupos + playoffs"), genera un
 * todos-contra-todos independiente DENTRO de cada grupo; si no, un único
 * todos-contra-todos con todos los equipos. `order_number` es único y
 * consecutivo dentro de todo el campeonato, y es lo que enlaza cada partido
 * con su fecha (no se puede asumir que el INSERT...RETURNING de Postgres
 * conserve el orden de entrada). Reemplaza cualquier fixture generado
 * previamente para permitir regenerar si se agregan/quitan equipos.
 */
export async function generateFixture(championshipId: string, teams: FixtureTeam[]): Promise<void> {
  if (teams.length < 2) {
    throw new Error('Se necesitan al menos 2 equipos para generar el fixture');
  }

  const hasGroups = teams.some((t) => t.group_id);
  if (hasGroups && teams.some((t) => !t.group_id)) {
    throw new Error('Todos los equipos deben tener un grupo asignado antes de generar el fixture');
  }

  const roundsToInsert: RoundInsert[] = [];
  const matchBlueprints: MatchBlueprint[] = [];
  let orderCounter = 1;

  if (hasGroups) {
    const groups = await listGroupsByChampionship(championshipId);
    const teamsByGroup = new Map<string, string[]>();
    for (const t of teams) {
      const list = teamsByGroup.get(t.group_id as string) ?? [];
      list.push(t.id);
      teamsByGroup.set(t.group_id as string, list);
    }

    for (const group of groups) {
      const groupTeamIds = teamsByGroup.get(group.id) ?? [];
      if (groupTeamIds.length < 2) continue;

      const pairings = generateRoundRobinFixture(groupTeamIds);
      const roundNumbers = Array.from(new Set(pairings.map((p) => p.round))).sort((a, b) => a - b);
      const orderNumberByRound = new Map<number, number>();

      for (const n of roundNumbers) {
        const orderNumber = orderCounter++;
        orderNumberByRound.set(n, orderNumber);
        roundsToInsert.push({
          championship_id: championshipId,
          name: `${group.name} · Fecha ${n}`,
          order_number: orderNumber,
        });
      }

      for (const p of pairings) {
        matchBlueprints.push({
          orderNumber: orderNumberByRound.get(p.round) as number,
          homeTeamId: p.homeTeamId,
          awayTeamId: p.awayTeamId,
        });
      }
    }
  } else {
    const pairings = generateRoundRobinFixture(teams.map((t) => t.id));
    const roundNumbers = Array.from(new Set(pairings.map((p) => p.round))).sort((a, b) => a - b);
    const orderNumberByRound = new Map<number, number>();

    for (const n of roundNumbers) {
      const orderNumber = orderCounter++;
      orderNumberByRound.set(n, orderNumber);
      roundsToInsert.push({
        championship_id: championshipId,
        name: `Fecha ${n}`,
        order_number: orderNumber,
      });
    }

    for (const p of pairings) {
      matchBlueprints.push({
        orderNumber: orderNumberByRound.get(p.round) as number,
        homeTeamId: p.homeTeamId,
        awayTeamId: p.awayTeamId,
      });
    }
  }

  const { data: insertedRounds, error: roundsError } = await supabase
    .from('rounds')
    .insert(roundsToInsert)
    .select('*');
  if (roundsError) throw roundsError;

  const roundIdByOrderNumber = new Map((insertedRounds ?? []).map((r) => [r.order_number, r.id]));

  const matchesToInsert = matchBlueprints.map((m) => ({
    championship_id: championshipId,
    round_id: roundIdByOrderNumber.get(m.orderNumber) ?? null,
    home_team_id: m.homeTeamId,
    away_team_id: m.awayTeamId,
    status: 'scheduled' as const,
  }));

  const { error: matchesError } = await supabase.from('matches').insert(matchesToInsert);
  if (matchesError) throw matchesError;
}

export async function clearFixture(championshipId: string): Promise<void> {
  const { error: matchesError } = await supabase
    .from('matches')
    .delete()
    .eq('championship_id', championshipId);
  if (matchesError) throw matchesError;

  const { error: roundsError } = await supabase
    .from('rounds')
    .delete()
    .eq('championship_id', championshipId);
  if (roundsError) throw roundsError;
}
