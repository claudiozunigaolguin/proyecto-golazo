import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/athletes';

export const athleteKeys = {
  detail: (id: string) => ['athletes', 'detail', id] as const,
  byCode: (code: string) => ['athletes', 'code', code] as const,
};

export function useAthlete(id: string | undefined) {
  return useQuery({
    queryKey: athleteKeys.detail(id ?? ''),
    queryFn: () => api.getAthleteById(id as string),
    enabled: !!id,
  });
}

export function useAthleteByCode(code: string | undefined) {
  return useQuery({
    queryKey: athleteKeys.byCode(code ?? ''),
    queryFn: () => api.getAthleteByCode(code as string),
    enabled: !!code,
  });
}

export function useUpdateAthlete(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateAthlete>[1]) => api.updateAthlete(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: athleteKeys.detail(id) });
    },
  });
}

/** Solo para managers: revela el RUT bajo demanda (no se precarga con la ficha). */
export function useRevealAthleteRut() {
  return useMutation({
    mutationFn: (athleteId: string) => api.getAthleteRut(athleteId),
  });
}
