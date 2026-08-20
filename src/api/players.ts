import { supabase } from '@/lib/supabase';
import type { PlayerInput } from '@/lib/validations';
import type { Database } from '@/types/database.types';

export type Player = Database['public']['Tables']['players']['Row'];

export async function listPlayersByTeam(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPlayersByChampionship(championshipId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('championship_id', championshipId);
  if (error) throw error;
  return data ?? [];
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase.from('players').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPlayer(
  teamId: string,
  championshipId: string,
  input: PlayerInput
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      team_id: teamId,
      championship_id: championshipId,
      first_name: input.firstName,
      last_name: input.lastName,
      jersey_number: input.jerseyNumber ?? null,
      position: input.position,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlayer(
  id: string,
  patch: Database['public']['Tables']['players']['Update']
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}

export interface PlayerStats {
  matches: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from('match_events')
    .select('type, match_id')
    .eq('player_id', playerId);
  if (error) throw error;

  const events = data ?? [];
  const matches = new Set(events.map((e) => e.match_id)).size;

  return {
    matches,
    goals: events.filter((e) => e.type === 'goal').length,
    assists: events.filter((e) => e.type === 'assist').length,
    yellowCards: events.filter((e) => e.type === 'yellow_card').length,
    redCards: events.filter((e) => e.type === 'red_card').length,
  };
}
