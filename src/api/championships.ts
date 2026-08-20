import { supabase } from '@/lib/supabase';
import { generateChampionshipSlug } from '@/lib/slug';
import { createGroups } from '@/api/groups';
import type { ChampionshipInput } from '@/lib/validations';
import type { Database } from '@/types/database.types';

export type Championship = Database['public']['Tables']['championships']['Row'];

export async function listMyChampionships(userId: string): Promise<Championship[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from('championship_members')
    .select('championship_id')
    .eq('user_id', userId);

  if (membershipError) throw membershipError;
  const championshipIds = (memberships ?? []).map((row) => row.championship_id);
  if (championshipIds.length === 0) return [];

  const { data, error } = await supabase
    .from('championships')
    .select('*')
    .in('id', championshipIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listPublicChampionships(limit = 10): Promise<Championship[]> {
  const { data, error } = await supabase
    .from('championships')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getChampionshipById(id: string): Promise<Championship | null> {
  const { data, error } = await supabase.from('championships').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getChampionshipBySlug(slug: string): Promise<Championship | null> {
  const { data, error } = await supabase
    .from('championships')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createChampionship(
  input: ChampionshipInput,
  ownerId: string
): Promise<Championship> {
  const slug = generateChampionshipSlug(input.name);

  const { data, error } = await supabase
    .from('championships')
    .insert({
      owner_id: ownerId,
      name: input.name,
      short_name: input.shortName || null,
      season: input.season || null,
      description: input.description || null,
      location: input.location || null,
      city: input.city || null,
      country: input.country || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      team_size: input.teamSize,
      max_teams: input.maxTeams ?? null,
      competition_system: input.competitionSystem,
      points_win: input.pointsWin,
      points_draw: input.pointsDraw,
      points_loss: input.pointsLoss,
      is_public: input.isPublic,
      status: 'upcoming',
      group_count: input.competitionSystem === 'groups_playoffs' ? input.groupCount ?? null : null,
      slug,
    })
    .select('*')
    .single();

  if (error) throw error;

  if (input.competitionSystem === 'groups_playoffs' && input.groupCount) {
    await createGroups(data.id, input.groupCount);
  }

  return data;
}

export async function updateChampionship(
  id: string,
  patch: Partial<Database['public']['Tables']['championships']['Update']>
): Promise<Championship> {
  const { data, error } = await supabase
    .from('championships')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChampionship(id: string): Promise<void> {
  const { error } = await supabase.from('championships').delete().eq('id', id);
  if (error) throw error;
}
