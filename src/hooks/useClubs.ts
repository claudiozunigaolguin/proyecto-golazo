import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/clubs';
import type { ClubInput } from '@/lib/validations';
import { teamKeys } from '@/hooks/useTeams';

export const clubKeys = {
  byChampionship: (championshipId: string) => ['clubs', 'championship', championshipId] as const,
  detail: (id: string) => ['clubs', 'detail', id] as const,
};

export function useClubs(championshipId: string | undefined) {
  return useQuery({
    queryKey: clubKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listClubsByChampionship(championshipId as string),
    enabled: !!championshipId,
  });
}

export function useClub(id: string | undefined) {
  return useQuery({
    queryKey: clubKeys.detail(id ?? ''),
    queryFn: () => api.getClubById(id as string),
    enabled: !!id,
  });
}

export function useCreateClub(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClubInput) => api.createClub(championshipId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clubKeys.byChampionship(championshipId) });
      void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
    },
  });
}

export function useUpdateClub(championshipId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateClub>[1]) => api.updateClub(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clubKeys.byChampionship(championshipId) });
      void queryClient.invalidateQueries({ queryKey: clubKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
    },
  });
}

export function useDeleteClub(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteClub(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clubKeys.byChampionship(championshipId) });
      void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
    },
  });
}
