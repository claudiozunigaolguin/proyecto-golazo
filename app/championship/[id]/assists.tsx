import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, TopScorersList } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTopAssists } from '@/hooks/useStats';
import { colors, spacing, typography } from '@/theme';

export default function TopAssistsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const topAssists = useTopAssists(id, 100);

  if (!championship.data) return <LoadingState rows={4} />;

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="asistencias" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Ranking de asistencias</Text>
        {topAssists.isLoading ? (
          <LoadingState rows={5} />
        ) : (
          <TopScorersList
            rows={(topAssists.data ?? []).map((a) => ({
              id: a.player_id,
              name: `${a.first_name} ${a.last_name}`,
              teamName: a.team_name,
              photoUrl: a.photo_url,
              value: a.assists,
              meta: `${a.matches_played} PJ`,
            }))}
            emptyTitle="Sin asistencias registradas"
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
});
