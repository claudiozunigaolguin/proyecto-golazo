import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/fixture';
import { matchKeys } from './useMatches';

export const roundKeys = {
  byChampionship: (championshipId: string) => ['rounds', championshipId] as const,
};

export function useRounds(championshipId: string | undefined) {
  return useQuery({
    queryKey: roundKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listRoundsByChampionship(championshipId as string),
    enabled: !!championshipId,
  });
}

export function useGenerateFixture(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teams: api.FixtureTeam[]) => api.generateFixture(championshipId, teams),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roundKeys.byChampionship(championshipId) });
      void queryClient.invalidateQueries({
        queryKey: matchKeys.byChampionship(championshipId).slice(0, 3),
      });
    },
  });
}

export function useClearFixture(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.clearFixture(championshipId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roundKeys.byChampionship(championshipId) });
      void queryClient.invalidateQueries({
        queryKey: matchKeys.byChampionship(championshipId).slice(0, 3),
      });
    },
  });
}
