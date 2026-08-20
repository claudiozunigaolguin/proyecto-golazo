import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/matches';
import type { MatchStatus } from '@/types/domain';
import { useInvalidateDerivedStats } from './useStats';

export const matchKeys = {
  byChampionship: (championshipId: string, status?: MatchStatus) =>
    ['matches', 'championship', championshipId, status ?? 'all'] as const,
  detail: (id: string) => ['matches', 'detail', id] as const,
};

export function useMatches(championshipId: string | undefined, status?: MatchStatus) {
  return useQuery({
    queryKey: matchKeys.byChampionship(championshipId ?? '', status),
    queryFn: () => api.listMatchesByChampionship(championshipId as string, status),
    enabled: !!championshipId,
  });
}

export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: matchKeys.detail(id ?? ''),
    queryFn: () => api.getMatchById(id as string),
    enabled: !!id,
  });
}

function useInvalidateMatch(championshipId: string, matchId: string) {
  const queryClient = useQueryClient();
  const invalidateStats = useInvalidateDerivedStats();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['matches', 'championship', championshipId] });
    void queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
    invalidateStats(championshipId);
  };
}

export function useSaveMatchResult(championshipId: string, matchId: string) {
  const invalidate = useInvalidateMatch(championshipId, matchId);
  return useMutation({
    mutationFn: ({ homeScore, awayScore }: { homeScore: number; awayScore: number }) =>
      api.saveMatchResult(matchId, homeScore, awayScore),
    onSuccess: invalidate,
  });
}

export function useStartLiveMatch(championshipId: string, matchId: string) {
  const invalidate = useInvalidateMatch(championshipId, matchId);
  return useMutation({
    mutationFn: () => api.startLiveMatch(matchId),
    onSuccess: invalidate,
  });
}

export function useUpdateLiveScore(championshipId: string, matchId: string) {
  const invalidate = useInvalidateMatch(championshipId, matchId);
  return useMutation({
    mutationFn: ({ homeScore, awayScore }: { homeScore: number; awayScore: number }) =>
      api.updateLiveScore(matchId, homeScore, awayScore),
    onSuccess: invalidate,
  });
}

export function useUpdateMatch(championshipId: string, matchId: string) {
  const invalidate = useInvalidateMatch(championshipId, matchId);
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateMatch>[1]) => api.updateMatch(matchId, patch),
    onSuccess: invalidate,
  });
}
