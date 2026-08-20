import { supabase } from '@/lib/supabase';
import type { UserPlan } from '@/types/domain';

export interface BillingStatus {
  plan: UserPlan;
  isSuperAdmin: boolean;
  championshipCount: number;
  championshipLimit: number | null;
  planRenewsAt: string | null;
}

export async function getMyBillingStatus(): Promise<BillingStatus | null> {
  const { data, error } = await supabase.rpc('get_my_billing_status');
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    plan: row.plan,
    isSuperAdmin: row.is_super_admin,
    championshipCount: row.championship_count,
    championshipLimit: row.championship_limit,
    planRenewsAt: row.plan_renews_at,
  };
}
