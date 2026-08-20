import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { TournamentCard } from '@/components/golazo';
import { useAuthStore } from '@/store/authStore';
import { useMyChampionships } from '@/hooks/useChampionships';
import { colors, spacing, typography } from '@/theme';

export default function StatsScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const myChampionships = useMyChampionships(userId);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={typography.h1}>Estadísticas</Text>
      <Text style={[typography.body, styles.subtitle]}>
        Elige un campeonato para ver tabla, goleadores, asistencias y tarjetas.
      </Text>

      {myChampionships.isLoading ? (
        <LoadingState rows={3} />
      ) : myChampionships.data && myChampionships.data.length > 0 ? (
        <View style={styles.list}>
          {myChampionships.data.map((champ) => (
            <TournamentCard
              key={champ.id}
              championship={champ}
              onPress={() => router.push(`/championship/${champ.id}/stats`)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="stats-chart-outline"
          title="Sin campeonatos todavía"
          description="Únete o crea un campeonato para ver sus estadísticas."
          actionLabel="Explorar campeonatos"
          onAction={() => router.push('/(tabs)/championships')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
});
