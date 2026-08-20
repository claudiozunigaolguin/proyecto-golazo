import { supabase } from '@/lib/supabase';
import type { MatchEventType } from '@/types/domain';
import type { Database } from '@/types/database.types';

export type MatchEvent = Database['public']['Tables']['match_events']['Row'];

export async function listMatchEvents(matchId: string): Promise<MatchEvent[]> {
  const { data, error } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', matchId)
    .order('minute', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface AddMatchEventInput {
  matchId: string;
  teamId: string;
  type: MatchEventType;
  playerId?: string | null;
  relatedPlayerId?: string | null;
  minute?: number | null;
  createdBy?: string | null;
}

export async function addMatchEvent(input: AddMatchEventInput): Promise<MatchEvent> {
  const { data, error } = await supabase
    .from('match_events')
    .insert({
      match_id: input.matchId,
      team_id: input.teamId,
      type: input.type,
      player_id: input.playerId ?? null,
      related_player_id: input.relatedPlayerId ?? null,
      minute: input.minute ?? null,
      created_by: input.createdBy ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMatchEvent(id: string): Promise<void> {
  const { error } = await supabase.from('match_events').delete().eq('id', id);
  if (error) throw error;
}
