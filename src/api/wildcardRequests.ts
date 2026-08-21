import { supabase } from '@/lib/supabase';
import type { WildcardRequestInput } from '@/lib/validations';
import type { Database } from '@/types/database.types';

export type WildcardRequest = Database['public']['Tables']['wildcard_requests']['Row'];

export async function listWildcardRequestsByChampionship(
  championshipId: string
): Promise<WildcardRequest[]> {
  const { data, error } = await supabase
    .from('wildcard_requests')
    .select('*')
    .eq('championship_id', championshipId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createWildcardRequest(
  championshipId: string,
  requestedBy: string,
  input: WildcardRequestInput
): Promise<WildcardRequest> {
  const { data, error } = await supabase
    .from('wildcard_requests')
    .insert({
      championship_id: championshipId,
      team_id: input.teamId,
      requested_by: requestedBy,
      reason: input.reason,
      replaced_player_id: input.replacedPlayerId ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function approveWildcardRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_wildcard_request', { p_request_id: requestId });
  if (error) throw error;
}

export async function rejectWildcardRequest(requestId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('reject_wildcard_request', {
    p_request_id: requestId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
}
