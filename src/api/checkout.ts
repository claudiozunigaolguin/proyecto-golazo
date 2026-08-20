import { supabase } from '@/lib/supabase';
import type { UserPlan } from '@/types/domain';

/**
 * Crea una suscripción real en Mercado Pago para el usuario actual (vía la
 * Edge Function `create-subscription`) y devuelve la URL de checkout a la
 * que hay que redirigirlo.
 */
export async function createCheckoutSession(plan: UserPlan): Promise<{ url: string }> {
  const backUrl = typeof window !== 'undefined' ? `${window.location.origin}/upgrade` : '';
  const { data, error } = await supabase.functions.invoke('create-subscription', {
    body: { plan, back_url: backUrl },
  });
  if (error) {
    throw new Error('No pudimos iniciar el pago. Intenta de nuevo en unos minutos.');
  }
  return data as { url: string };
}
