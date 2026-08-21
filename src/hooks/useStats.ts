import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/stats';
import type { Group } from '@/api/groups';

export const statsKeys = {
  standings: (championshipId: string, groupId?: string | null) =>
    ['stats', 'standings', championshipId, groupId ?? 'all'] as const,
  clubStandings: (championshipId: string) => ['stats', 'clubStandings', championshipId] as const,
  topScorers: (championshipId: string) => ['stats', 'topScorers', championshipId] as const,
  topAssists: (championshipId: string) => ['stats', 'topAssists', championshipId] as const,
  topCards: (championshipId: string) => ['stats', 'topCards', championshipId] as const,
  championshipStats: (championshipId: string) => ['stats', 'championship', championshipId] as const,
};

export function useStandings(championshipId: string | undefined, groupId?: string | null) {
  return useQuery({
    queryKey: statsKeys.standings(championshipId ?? '', groupId),
    queryFn: () => api.getStandings(championshipId as string, groupId),
    enabled: !!championshipId,
  });
}

/** Tabla de posiciones de cada grupo, calculadas en paralelo. */
export function useGroupStandingsList(championshipId: string | undefined, groups: Group[]) {
  return useQueries({
    queries: groups.map((group) => ({
      queryKey: statsKeys.standings(championshipId ?? '', group.id),
      queryFn: () => api.getStandings(championshipId as string, group.id),
      enabled: !!championshipId,
    })),
  });
}

export function useClubStandings(championshipId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.clubStandings(championshipId ?? ''),
    queryFn: () => api.getClubStandings(championshipId as string),
    enabled: !!championshipId,
  });
}

export function useTopScorers(championshipId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: statsKeys.topScorers(championshipId ?? ''),
    queryFn: () => api.getTopScorers(championshipId as string, limit),
    enabled: !!championshipId,
  });
}

export function useTopAssists(championshipId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: statsKeys.topAssists(championshipId ?? ''),
    queryFn: () => api.getTopAssists(championshipId as string, limit),
    enabled: !!championshipId,
  });
}

export function useTopCards(championshipId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: statsKeys.topCards(championshipId ?? ''),
    queryFn: () => api.getTopCards(championshipId as string, limit),
    enabled: !!championshipId,
  });
}

export function useChampionshipStats(championshipId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.championshipStats(championshipId ?? ''),
    queryFn: () => api.getChampionshipStats(championshipId as string),
    enabled: !!championshipId,
  });
}

/** Invalida todo lo derivado de partidos/eventos tras registrar un resultado o evento. */
export function useInvalidateDerivedStats() {
  const queryClient = useQueryClient();
  return (championshipId: string) => {
    void queryClient.invalidateQueries({ queryKey: ['stats', 'standings', championshipId] });
    void queryClient.invalidateQueries({ queryKey: statsKeys.clubStandings(championshipId) });
    void queryClient.invalidateQueries({ queryKey: statsKeys.topScorers(championshipId) });
    void queryClient.invalidateQueries({ queryKey: statsKeys.topAssists(championshipId) });
    void queryClient.invalidateQueries({ queryKey: statsKeys.topCards(championshipId) });
    void queryClient.invalidateQueries({ queryKey: statsKeys.championshipStats(championshipId) });
  };
}
