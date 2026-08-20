import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { TournamentCard } from '@/components/golazo';
import { useAuthStore } from '@/store/authStore';
import { useMyChampionships, usePublicChampionships } from '@/hooks/useChampionships';
import { colors, spacing, typography } from '@/theme';

export default function ChampionshipsScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const myChampionships = useMyChampionships(userId);
  const publicChampionships = usePublicChampionships(30);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={typography.h1}>Campeonatos</Text>

      <View style={styles.section}>
        <Text style={typography.h3}>Mis campeonatos</Text>
        {myChampionships.isLoading ? (
          <LoadingState rows={2} />
        ) : myChampionships.data && myChampionships.data.length > 0 ? (
          <View style={styles.list}>
            {myChampionships.data.map((champ) => (
              <TournamentCard
                key={champ.id}
                championship={champ}
                onPress={() => router.push(`/championship/${champ.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="Aún no tienes campeonatos" />
        )}
        <Button label="+ Crear campeonato" onPress={() => router.push('/championship/create')} fullWidth />
      </View>

      <View style={styles.section}>
        <Text style={typography.h3}>Explorar campeonatos públicos</Text>
        {publicChampionships.isLoading ? (
          <LoadingState rows={3} />
        ) : publicChampionships.data && publicChampionships.data.length > 0 ? (
          <View style={styles.list}>
            {publicChampionships.data.map((champ) => (
              <TournamentCard
                key={champ.id}
                championship={champ}
                onPress={() => router.push(`/public/${champ.slug}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="search-outline" title="No hay campeonatos públicos todavía" />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
