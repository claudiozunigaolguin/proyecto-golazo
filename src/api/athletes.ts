import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Athlete = Database['public']['Tables']['athletes']['Row'];

export async function getAthleteById(id: string): Promise<Athlete | null> {
  const { data, error } = await supabase.from('athletes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAthleteByCode(code: string): Promise<Athlete | null> {
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('public_code', code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAthlete(
  id: string,
  patch: Database['public']['Tables']['athletes']['Update']
): Promise<Athlete> {
  const { data, error } = await supabase
    .from('athletes')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

interface FindOrCreateAthleteInput {
  rut?: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  photoUrl?: string;
}

/** Reutiliza el athlete existente si el RUT ya está registrado, o crea uno nuevo. */
export async function findOrCreateAthlete(input: FindOrCreateAthleteInput): Promise<string> {
  const { data, error } = await supabase.rpc('find_or_create_athlete', {
    p_rut: input.rut ?? null,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_birth_date: input.birthDate ?? null,
    p_photo_url: input.photoUrl ?? null,
  });
  if (error) throw error;
  return data as string;
}

/** Solo para managers: revela el RUT de un athlete que administran. */
export async function getAthleteRut(athleteId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_athlete_rut', { p_athlete_id: athleteId });
  if (error) throw error;
  return data as string | null;
}
