import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/wildcardRequests';
import type { WildcardRequestInput } from '@/lib/validations';

export const wildcardRequestKeys = {
  byChampionship: (championshipId: string) => ['wildcardRequests', championshipId] as const,
};

export function useWildcardRequests(championshipId: string | undefined) {
  return useQuery({
    queryKey: wildcardRequestKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listWildcardRequestsByChampionship(championshipId as string),
    enabled: !!championshipId,
  });
}

export function useCreateWildcardRequest(championshipId: string, requestedBy: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WildcardRequestInput) =>
      api.createWildcardRequest(championshipId, requestedBy, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wildcardRequestKeys.byChampionship(championshipId) });
    },
  });
}

export function useApproveWildcardRequest(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.approveWildcardRequest(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wildcardRequestKeys.byChampionship(championshipId) });
    },
  });
}

export function useRejectWildcardRequest(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      api.rejectWildcardRequest(requestId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wildcardRequestKeys.byChampionship(championshipId) });
    },
  });
}
