import { supabase } from '@/lib/supabase';
import type { TeamInput } from '@/lib/validations';
import type { Database } from '@/types/database.types';

export type Team = Database['public']['Tables']['teams']['Row'];

export async function listTeamsByChampionship(championshipId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('championship_id', championshipId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTeamById(id: string): Promise<Team | null> {
  const { data, error } = await supabase.from('teams').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTeam(championshipId: string, input: TeamInput): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      championship_id: championshipId,
      name: input.name,
      short_name: input.shortName || null,
      primary_color: input.primaryColor || null,
      secondary_color: input.secondaryColor || null,
      coach_name: input.coachName || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeam(
  id: string,
  patch: Database['public']['Tables']['teams']['Update']
): Promise<Team> {
  const { data, error } = await supabase.from('teams').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}
