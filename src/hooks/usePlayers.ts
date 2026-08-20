import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/players';
import type { PlayerInput } from '@/lib/validations';

export const playerKeys = {
  byTeam: (teamId: string) => ['players', 'team', teamId] as const,
  byChampionship: (championshipId: string) => ['players', 'championship', championshipId] as const,
  detail: (id: string) => ['players', 'detail', id] as const,
};

export function usePlayersByTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: playerKeys.byTeam(teamId ?? ''),
    queryFn: () => api.listPlayersByTeam(teamId as string),
    enabled: !!teamId,
  });
}

export function usePlayersByChampionship(championshipId: string | undefined) {
  return useQuery({
    queryKey: playerKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listPlayersByChampionship(championshipId as string),
    enabled: !!championshipId,
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: playerKeys.detail(id ?? ''),
    queryFn: () => api.getPlayerById(id as string),
    enabled: !!id,
  });
}

export function usePlayerStats(id: string | undefined) {
  return useQuery({
    queryKey: ['players', 'stats', id ?? ''],
    queryFn: () => api.getPlayerStats(id as string),
    enabled: !!id,
  });
}

export function useCreatePlayer(teamId: string, championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlayerInput) => api.createPlayer(teamId, championshipId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playerKeys.byTeam(teamId) });
      void queryClient.invalidateQueries({ queryKey: playerKeys.byChampionship(championshipId) });
    },
  });
}

export function useUpdatePlayer(teamId: string, championshipId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updatePlayer>[1]) => api.updatePlayer(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playerKeys.byTeam(teamId) });
      void queryClient.invalidateQueries({ queryKey: playerKeys.byChampionship(championshipId) });
      void queryClient.invalidateQueries({ queryKey: playerKeys.detail(id) });
    },
  });
}

export function useDeletePlayer(teamId: string, championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePlayer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: playerKeys.byTeam(teamId) });
      void queryClient.invalidateQueries({ queryKey: playerKeys.byChampionship(championshipId) });
    },
  });
}
