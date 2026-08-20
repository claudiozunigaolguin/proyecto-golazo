import { supabase } from '@/lib/supabase';
import type {
  ChampionshipStatsRow,
  ClubStandingRow,
  StandingRow,
  TopAssistRow,
  TopCardRow,
  TopScorerRow,
} from '@/types/domain';

export async function getStandings(
  championshipId: string,
  groupId?: string | null
): Promise<StandingRow[]> {
  const { data, error } = await supabase.rpc('get_standings', {
    p_championship_id: championshipId,
    p_group_id: groupId ?? null,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getClubStandings(championshipId: string): Promise<ClubStandingRow[]> {
  const { data, error } = await supabase.rpc('get_club_standings', {
    p_championship_id: championshipId,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getTopScorers(championshipId: string, limit = 50): Promise<TopScorerRow[]> {
  const { data, error } = await supabase.rpc('get_top_scorers', {
    p_championship_id: championshipId,
    p_limit: limit,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getTopAssists(championshipId: string, limit = 50): Promise<TopAssistRow[]> {
  const { data, error } = await supabase.rpc('get_top_assists', {
    p_championship_id: championshipId,
    p_limit: limit,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getTopCards(championshipId: string, limit = 50): Promise<TopCardRow[]> {
  const { data, error } = await supabase.rpc('get_top_cards', {
    p_championship_id: championshipId,
    p_limit: limit,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getChampionshipStats(
  championshipId: string
): Promise<ChampionshipStatsRow | null> {
  const { data, error } = await supabase.rpc('get_championship_stats', {
    p_championship_id: championshipId,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}
