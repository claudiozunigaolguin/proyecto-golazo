import { supabase } from '@/lib/supabase';
import type { UserPlan } from '@/types/domain';

/**
 * Punto de enganche para pagos recurrentes reales. Llama a una Supabase Edge
 * Function (`create-checkout-session`) que todavía no existe — se crea
 * cuando se conecte Stripe. Hasta entonces esta función falla con un
 * mensaje claro en vez de simular un pago exitoso.
 */
export async function createCheckoutSession(plan: UserPlan): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { plan },
  });
  if (error) {
    throw new Error(
      'Los pagos todavía no están configurados. Falta conectar Stripe (ver DEPLOYMENT.md).'
    );
  }
  return data as { url: string };
}
