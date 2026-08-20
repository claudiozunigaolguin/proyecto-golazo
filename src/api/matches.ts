import { supabase } from '@/lib/supabase';
import type { MatchStatus } from '@/types/domain';
import type { Database } from '@/types/database.types';

export type Match = Database['public']['Tables']['matches']['Row'];

export async function listMatchesByChampionship(
  championshipId: string,
  status?: MatchStatus
): Promise<Match[]> {
  let query = supabase
    .from('matches')
    .select('*')
    .eq('championship_id', championshipId)
    .order('scheduled_at', { ascending: true, nullsFirst: true });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMatchById(id: string): Promise<Match | null> {
  const { data, error } = await supabase.from('matches').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMatch(
  id: string,
  patch: Database['public']['Tables']['matches']['Update']
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function saveMatchResult(
  id: string,
  homeScore: number,
  awayScore: number
): Promise<Match> {
  return updateMatch(id, {
    home_score: homeScore,
    away_score: awayScore,
    status: 'finished',
    is_live: false,
  });
}

export async function startLiveMatch(id: string): Promise<Match> {
  return updateMatch(id, {
    status: 'live',
    is_live: true,
    home_score: 0,
    away_score: 0,
    current_minute: 0,
  });
}

export async function updateLiveScore(
  id: string,
  homeScore: number,
  awayScore: number
): Promise<Match> {
  return updateMatch(id, { home_score: homeScore, away_score: awayScore });
}

export async function updateLiveMinute(id: string, minute: number): Promise<Match> {
  return updateMatch(id, { current_minute: minute });
}
