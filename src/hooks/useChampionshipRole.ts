import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { MemberRole } from '@/types/domain';

/**
 * Determina si el usuario actual puede administrar un campeonato
 * (admin/organizer en championship_members, u owner). Sustenta el punto 4:
 * ESPECTADOR = sin membresía -> solo lectura.
 */
export function useChampionshipRole(championshipId: string | undefined) {
  const userId = useAuthStore((s) => s.session?.user.id);

  const query = useQuery({
    queryKey: ['championshipRole', championshipId ?? '', userId ?? ''],
    queryFn: async (): Promise<MemberRole | null> => {
      const { data, error } = await supabase
        .from('championship_members')
        .select('role')
        .eq('championship_id', championshipId as string)
        .eq('user_id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as MemberRole | undefined) ?? null;
    },
    enabled: !!championshipId && !!userId,
  });

  return {
    role: query.data ?? null,
    isManager: !!query.data,
    isLoading: query.isLoading,
  };
}
