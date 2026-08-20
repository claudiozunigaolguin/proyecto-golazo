import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/members';
import type { MemberRole } from '@/types/domain';

export const memberKeys = {
  byChampionship: (championshipId: string) => ['championshipMembers', championshipId] as const,
};

export function useChampionshipMembers(championshipId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.byChampionship(championshipId ?? ''),
    queryFn: () => api.listChampionshipMembers(championshipId as string),
    enabled: !!championshipId,
  });
}

export function useAddMember(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: MemberRole }) =>
      api.addMemberByEmail(championshipId, email, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.byChampionship(championshipId) });
    },
  });
}

export function useRemoveMember(championshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => api.removeMember(membershipId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.byChampionship(championshipId) });
    },
  });
}
