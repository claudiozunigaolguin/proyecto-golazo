import { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { useMyBillingStatus } from '@/hooks/useBilling';
import { createCheckoutSession } from '@/api/checkout';
import { PLAN_LABEL, PLAN_LIMIT, PLAN_PRICE_USD, type UserPlan } from '@/types/domain';
import { colors, radius, spacing, typography } from '@/theme';

const PAID_PLANS: UserPlan[] = ['starter', 'growth', 'unlimited'];

function planDescription(plan: UserPlan): string {
  const limit = PLAN_LIMIT[plan];
  return limit === null ? 'Campeonatos ilimitados' : `Hasta ${limit} campeonatos`;
}

export default function UpgradeScreen() {
  const billing = useMyBillingStatus();
  const [loadingPlan, setLoadingPlan] = useState<UserPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (plan: UserPlan) => {
    setError(null);
    setLoadingPlan(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      if (typeof window !== 'undefined') window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar el pago');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Planes' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Elige tu plan</Text>
        <Text style={[typography.body, styles.muted]}>
          El plan gratuito permite administrar 1 campeonato. Mejora tu plan para crear más.
        </Text>

        {billing.isLoading || !billing.data ? (
          <LoadingState rows={3} />
        ) : (
          <View style={styles.list}>
            <Card style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={typography.h3}>Gratis</Text>
                {billing.data.plan === 'free' ? <Badge label="Tu plan actual" tone="primary" /> : null}
              </View>
              <Text style={[typography.body, styles.muted]}>{planDescription('free')}</Text>
              <Text style={styles.price}>$0</Text>
            </Card>

            {PAID_PLANS.map((plan) => (
              <Card key={plan} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={typography.h3}>{PLAN_LABEL[plan]}</Text>
                  {billing.data!.plan === plan ? <Badge label="Tu plan actual" tone="primary" /> : null}
                </View>
                <Text style={[typography.body, styles.muted]}>{planDescription(plan)}</Text>
                <Text style={styles.price}>
                  ${PLAN_PRICE_USD[plan]}
                  <Text style={typography.caption}>/mes</Text>
                </Text>
                {billing.data!.plan !== plan ? (
                  <Button
                    label="Suscribirme"
                    onPress={() => void handleSubscribe(plan)}
                    loading={loadingPlan === plan}
                    fullWidth
                  />
                ) : null}
              </Card>
            ))}
          </View>
        )}

        {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

        {billing.data && !billing.data.isSuperAdmin ? (
          <Text style={[typography.caption, styles.muted]}>
            Usas {billing.data.championshipCount} de{' '}
            {billing.data.championshipLimit ?? '∞'} campeonatos disponibles en tu plan.
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  muted: {
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  planCard: {
    gap: spacing.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  error: {
    color: colors.danger,
  },
});
