import { supabase } from '@/lib/supabase';
import { listGroupsByChampionship } from '@/api/groups';
import type { ClubInput } from '@/lib/validations';
import type { Database } from '@/types/database.types';

export type Club = Database['public']['Tables']['clubs']['Row'];

export async function listClubsByChampionship(championshipId: string): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('championship_id', championshipId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getClubById(id: string): Promise<Club | null> {
  const { data, error } = await supabase.from('clubs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Crea un club y, en el mismo paso, sus 4 equipos (uno por cada serie ya
 * creada para el campeonato), copiando colores/escudo del club a cada
 * equipo. El nombre de cada equipo incluye la serie ("Club X · Tercera")
 * porque `teams` tiene un unique (championship_id, name) y los 4 equipos
 * comparten club — `short_name` sí queda igual al del club para que las
 * tablas se vean limpias.
 */
export async function createClub(championshipId: string, input: ClubInput): Promise<Club> {
  const groups = await listGroupsByChampionship(championshipId);
  if (groups.length === 0) {
    throw new Error('El campeonato todavía no tiene series configuradas.');
  }

  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .insert({
      championship_id: championshipId,
      name: input.name,
      short_name: input.shortName || null,
      primary_color: input.primaryColor || null,
      secondary_color: input.secondaryColor || null,
    })
    .select('*')
    .single();
  if (clubError) throw clubError;

  const teamRows = groups.map((group) => ({
    championship_id: championshipId,
    club_id: club.id,
    group_id: group.id,
    name: `${club.name} · ${group.name}`,
    short_name: club.short_name,
    primary_color: club.primary_color,
    secondary_color: club.secondary_color,
  }));
  const { error: teamsError } = await supabase.from('teams').insert(teamRows);
  if (teamsError) throw teamsError;

  return club;
}

export async function updateClub(
  id: string,
  patch: Database['public']['Tables']['clubs']['Update']
): Promise<Club> {
  const { data: club, error } = await supabase
    .from('clubs')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const needsTeamSync =
    patch.name !== undefined ||
    patch.short_name !== undefined ||
    patch.logo_url !== undefined ||
    patch.primary_color !== undefined ||
    patch.secondary_color !== undefined;

  if (needsTeamSync) {
    const [{ data: teams, error: teamsError }, groups] = await Promise.all([
      supabase.from('teams').select('id, group_id').eq('club_id', id),
      listGroupsByChampionship(club.championship_id),
    ]);
    if (teamsError) throw teamsError;

    const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

    for (const team of teams ?? []) {
      const teamPatch: Database['public']['Tables']['teams']['Update'] = {};
      if (patch.name !== undefined) {
        const groupName = team.group_id ? groupNameById.get(team.group_id) : undefined;
        teamPatch.name = groupName ? `${club.name} · ${groupName}` : club.name;
      }
      if (patch.short_name !== undefined) teamPatch.short_name = club.short_name;
      if (patch.logo_url !== undefined) teamPatch.logo_url = club.logo_url;
      if (patch.primary_color !== undefined) teamPatch.primary_color = club.primary_color;
      if (patch.secondary_color !== undefined) teamPatch.secondary_color = club.secondary_color;

      const { error: teamUpdateError } = await supabase.from('teams').update(teamPatch).eq('id', team.id);
      if (teamUpdateError) throw teamUpdateError;
    }
  }

  return club;
}

export async function deleteClub(id: string): Promise<void> {
  const { error } = await supabase.from('clubs').delete().eq('id', id);
  if (error) throw error;
}
