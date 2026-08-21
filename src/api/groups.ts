import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Group = Database['public']['Tables']['groups']['Row'];

const GROUP_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export async function listGroupsByChampionship(championshipId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('championship_id', championshipId)
    .order('order_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Crea "Grupo A", "Grupo B", ... según la cantidad indicada. */
export async function createGroups(championshipId: string, count: number): Promise<Group[]> {
  const rows = Array.from({ length: count }, (_, i) => ({
    championship_id: championshipId,
    name: `Grupo ${GROUP_LETTERS[i] ?? i + 1}`,
    order_number: i + 1,
  }));
  const { data, error } = await supabase.from('groups').insert(rows).select('*');
  if (error) throw error;
  return data ?? [];
}

/** Crea grupos con nombres explícitos, ej. las 4 series fijas de "Liga con series". */
export async function createNamedGroups(championshipId: string, names: string[]): Promise<Group[]> {
  const rows = names.map((name, i) => ({
    championship_id: championshipId,
    name,
    order_number: i + 1,
  }));
  const { data, error } = await supabase.from('groups').insert(rows).select('*');
  if (error) throw error;
  return data ?? [];
}
