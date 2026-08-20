import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/knockout';
import type { Group } from '@/api/groups';
import { matchKeys } from './useMatches';

export const knockoutKeys = {
  byChampionship: (championshipId: string) => ['knockoutMatches', championshipId] as const,
};

export function useKnockoutMatches(championshipId: string | undefined) {
  return useQuery({
    queryKey: knockoutKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listKnockoutMatches(championshipId as string),
    enabled: !!championshipId,
  });
}

function useInvalidateKnockout(championshipId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: knockoutKeys.byChampionship(championshipId) });
    void queryClient.invalidateQueries({ queryKey: matchKeys.byChampionship(championshipId) });
  };
}

export function useGenerateKnockoutBracket(championshipId: string) {
  const invalidate = useInvalidateKnockout(championshipId);
  return useMutation({
    mutationFn: (groups: Group[]) => api.generateKnockoutBracket(championshipId, groups),
    onSuccess: invalidate,
  });
}

export function useClearKnockoutBracket(championshipId: string) {
  const invalidate = useInvalidateKnockout(championshipId);
  return useMutation({
    mutationFn: () => api.clearKnockoutBracket(championshipId),
    onSuccess: invalidate,
  });
}
