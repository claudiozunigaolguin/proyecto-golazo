import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/events';
import { useInvalidateDerivedStats } from './useStats';

export const eventKeys = {
  byMatch: (matchId: string) => ['matchEvents', matchId] as const,
};

export function useMatchEvents(matchId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.byMatch(matchId ?? ''),
    queryFn: () => api.listMatchEvents(matchId as string),
    enabled: !!matchId,
  });
}

export function useAddMatchEvent(championshipId: string, matchId: string) {
  const queryClient = useQueryClient();
  const invalidateStats = useInvalidateDerivedStats();
  return useMutation({
    mutationFn: (input: Omit<api.AddMatchEventInput, 'matchId'>) =>
      api.addMatchEvent({ ...input, matchId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.byMatch(matchId) });
      invalidateStats(championshipId);
    },
  });
}

export function useDeleteMatchEvent(championshipId: string, matchId: string) {
  const queryClient = useQueryClient();
  const invalidateStats = useInvalidateDerivedStats();
  return useMutation({
    mutationFn: (eventId: string) => api.deleteMatchEvent(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eventKeys.byMatch(matchId) });
      invalidateStats(championshipId);
    },
  });
}
