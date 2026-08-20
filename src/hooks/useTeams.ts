import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/teams';
import type { TeamInput } from '@/lib/validations';

export const teamKeys = {
  byChampionship: (championshipId: string) => ['teams', 'championship', championshipId] as const,
  detail: (id: string) => ['teams', 'detail', id] as const,
};

export function useTeams(championshipId: string | undefined) {
  return useQuery({
    queryKey: teamKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listTeamsByChampionship(championshipId as string),
    enabled: !!championshipId,
  });
}

export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: teamKeys.detail(id ?? ''),
    queryFn: () => api.getTeamById(id as string),
    enabled: !!id,
  });
}

export function useCreateTeam(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeamInput) => api.createTeam(championshipId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
    },
  });
}

export function useUpdateTeam(championshipId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateTeam>[1]) => api.updateTeam(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
      void queryClient.invalidateQueries({ queryKey: teamKeys.detail(id) });
    },
  });
}

export function useDeleteTeam(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTeam(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
    },
  });
}
