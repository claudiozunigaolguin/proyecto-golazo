import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, TopScorersList } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTopScorers } from '@/hooks/useStats';
import { shareText } from '@/lib/share';
import { colors, spacing, typography } from '@/theme';

export default function TopScorersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const topScorers = useTopScorers(id, 100);

  if (!championship.data) return <LoadingState rows={4} />;

  const handleShare = () => {
    const lines = (topScorers.data ?? [])
      .slice(0, 10)
      .map((s, i) => `${i + 1}. ${s.first_name} ${s.last_name} (${s.team_name}) — ${s.goals} goles`);
    void shareText(
      `⚽ Máximos goleadores de ${championship.data!.name}\n\n${lines.join('\n')}`,
      championship.data!.name
    );
  };

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="goleadores" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={typography.h2}>Tabla de goleadores</Text>
          {topScorers.data && topScorers.data.length > 0 ? (
            <Button label="Compartir" variant="outline" size="sm" onPress={handleShare} />
          ) : null}
        </View>
        {topScorers.isLoading ? (
          <LoadingState rows={5} />
        ) : (
          <TopScorersList
            rows={(topScorers.data ?? []).map((s) => ({
              id: s.player_id,
              name: `${s.first_name} ${s.last_name}`,
              teamName: s.team_name,
              photoUrl: s.photo_url,
              value: s.goals,
              meta: `${s.matches_played} PJ`,
            }))}
            emptyTitle="Sin goles registrados"
            emptyDescription="Los goleadores aparecerán aquí una vez se registren goles en los partidos."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
