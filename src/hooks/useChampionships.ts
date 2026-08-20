import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/championships';
import type { ChampionshipInput } from '@/lib/validations';

export const championshipKeys = {
  all: ['championships'] as const,
  mine: (userId: string) => ['championships', 'mine', userId] as const,
  public: () => ['championships', 'public'] as const,
  detail: (id: string) => ['championships', 'detail', id] as const,
  bySlug: (slug: string) => ['championships', 'slug', slug] as const,
};

export function useMyChampionships(userId: string | undefined) {
  return useQuery({
    queryKey: championshipKeys.mine(userId ?? ''),
    queryFn: () => api.listMyChampionships(userId as string),
    enabled: !!userId,
  });
}

export function usePublicChampionships(limit = 10) {
  return useQuery({
    queryKey: championshipKeys.public(),
    queryFn: () => api.listPublicChampionships(limit),
  });
}

export function useChampionship(id: string | undefined) {
  return useQuery({
    queryKey: championshipKeys.detail(id ?? ''),
    queryFn: () => api.getChampionshipById(id as string),
    enabled: !!id,
  });
}

export function useChampionshipBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: championshipKeys.bySlug(slug ?? ''),
    queryFn: () => api.getChampionshipBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useCreateChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, ownerId }: { input: ChampionshipInput; ownerId: string }) =>
      api.createChampionship(input, ownerId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: championshipKeys.mine(variables.ownerId) });
      void queryClient.invalidateQueries({ queryKey: championshipKeys.public() });
    },
  });
}

export function useUpdateChampionship(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof api.updateChampionship>[1]) =>
      api.updateChampionship(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: championshipKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: championshipKeys.all });
    },
  });
}

export function useDeleteChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteChampionship(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: championshipKeys.all });
    },
  });
}
