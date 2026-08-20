import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export async function updateProfile(
  id: string,
  patch: Database['public']['Tables']['profiles']['Update']
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
