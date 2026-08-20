import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/groups';

export const groupKeys = {
  byChampionship: (championshipId: string) => ['groups', championshipId] as const,
};

export function useGroups(championshipId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listGroupsByChampionship(championshipId as string),
    enabled: !!championshipId,
  });
}

export function useCreateGroups(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (count: number) => api.createGroups(championshipId, count),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: groupKeys.byChampionship(championshipId) });
    },
  });
}
