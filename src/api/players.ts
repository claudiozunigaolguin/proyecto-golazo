import { supabase } from '@/lib/supabase';
import { findOrCreateAthlete } from '@/api/athletes';
import { athletePhotoPath, uploadImage } from '@/lib/storage';
import type { PlayerInput } from '@/lib/validations';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { Athlete } from '@/api/athletes';
import type { Database } from '@/types/database.types';

export type PlayerRow = Database['public']['Tables']['players']['Row'];
export type Player = PlayerRow & { athlete: Athlete };

const PLAYER_SELECT = '*, athlete:athletes(*)';

export async function listPlayersByTeam(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select(PLAYER_SELECT)
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as Player[];
}

export async function listPlayersByChampionship(championshipId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select(PLAYER_SELECT)
    .eq('championship_id', championshipId);
  if (error) throw error;
  return (data ?? []) as unknown as Player[];
}

export type PlayerEnrollment = Player & {
  team: { name: string };
  championship: { name: string };
};

/** Todas las inscripciones (equipo + campeonato) del mismo athlete — "historial de participaciones". */
export async function listPlayersByAthlete(athleteId: string): Promise<PlayerEnrollment[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*, athlete:athletes(*), team:teams(name), championship:championships(name)')
    .eq('athlete_id', athleteId);
  if (error) throw error;
  return (data ?? []) as unknown as PlayerEnrollment[];
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select(PLAYER_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Player | null;
}

/**
 * Resuelve (o crea) el athlete correspondiente al RUT/nombre ingresados,
 * sube la foto si se picó una, y recién ahí crea la inscripción del
 * jugador en el equipo/campeonato.
 */
export async function createPlayer(
  teamId: string,
  championshipId: string,
  input: PlayerInput,
  photoAsset?: ImagePickerAsset | null
): Promise<Player> {
  const athleteId = await findOrCreateAthlete({
    rut: input.rut,
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
  });

  if (photoAsset) {
    const photoUrl = await uploadImage(athletePhotoPath(athleteId), photoAsset);
    const { error: photoError } = await supabase
      .from('athletes')
      .update({ photo_url: photoUrl })
      .eq('id', athleteId);
    if (photoError) throw photoError;
  }

  const { data, error } = await supabase
    .from('players')
    .insert({
      team_id: teamId,
      championship_id: championshipId,
      athlete_id: athleteId,
      jersey_number: input.jerseyNumber ?? null,
      position: input.position,
    })
    .select(PLAYER_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as Player;
}

export async function updatePlayer(
  id: string,
  patch: Database['public']['Tables']['players']['Update']
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(patch)
    .eq('id', id)
    .select(PLAYER_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as Player;
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
