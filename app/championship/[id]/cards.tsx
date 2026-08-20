import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, TopScorersList } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTopCards } from '@/hooks/useStats';
import { colors, spacing, typography } from '@/theme';

export default function TopCardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const topCards = useTopCards(id, 100);

  const redSorted = useMemo(
    () => [...(topCards.data ?? [])].sort((a, b) => b.red_cards - a.red_cards || b.yellow_cards - a.yellow_cards),
    [topCards.data]
  );

  if (!championship.data) return <LoadingState rows={4} />;

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="tarjetas" />

      <ScrollView contentContainerStyle={styles.container}>
        {topCards.isLoading ? (
          <LoadingState rows={5} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={typography.h3}>🟨 Amarillas</Text>
              <TopScorersList
                rows={(topCards.data ?? [])
                  .filter((c) => c.yellow_cards > 0)
                  .map((c) => ({
                    id: c.player_id,
                    name: `${c.first_name} ${c.last_name}`,
                    teamName: c.team_name,
                    photoUrl: c.photo_url,
                    value: c.yellow_cards,
                  }))}
                emptyTitle="Sin amarillas registradas"
              />
            </View>

            <View style={styles.section}>
              <Text style={typography.h3}>🟥 Rojas</Text>
              <TopScorersList
                rows={redSorted
                  .filter((c) => c.red_cards > 0)
                  .map((c) => ({
                    id: c.player_id,
                    name: `${c.first_name} ${c.last_name}`,
                    teamName: c.team_name,
                    photoUrl: c.photo_url,
                    value: c.red_cards,
                  }))}
                emptyTitle="Sin rojas registradas"
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
});
