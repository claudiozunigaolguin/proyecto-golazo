import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyBillingStatus } from '@/api/billing';
import { useAuthStore } from '@/store/authStore';

export const billingKeys = {
  mine: (userId: string) => ['billingStatus', userId] as const,
};

export function useMyBillingStatus() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: billingKeys.mine(userId ?? ''),
    queryFn: getMyBillingStatus,
    enabled: !!userId,
  });
}

export function useInvalidateBillingStatus() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return () => {
    if (userId) void queryClient.invalidateQueries({ queryKey: billingKeys.mine(userId) });
  };
}
