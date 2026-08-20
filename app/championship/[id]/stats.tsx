import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, StatCard } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useChampionshipStats, useStandings, useTopAssists, useTopScorers } from '@/hooks/useStats';
import { colors, radius, spacing, typography } from '@/theme';

export default function ChampionshipStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const stats = useChampionshipStats(id);
  const standings = useStandings(id);
  const topScorer = useTopScorers(id, 1);
  const topAssist = useTopAssists(id, 1);

  const goalsByTeam = useMemo(
    () =>
      [...(standings.data ?? [])]
        .sort((a, b) => b.goals_for - a.goals_for)
        .slice(0, 8),
    [standings.data]
  );
  const maxGoals = Math.max(1, ...goalsByTeam.map((t) => t.goals_for));

  if (!championship.data) return <LoadingState rows={4} />;

  const s = stats.data;

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="estadisticas" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Estadísticas del campeonato</Text>

        {stats.isLoading || !s ? (
          <LoadingState rows={4} />
        ) : (
          <>
            <View style={styles.grid}>
              <StatCard label="Goles totales" value={s.total_goals} icon="football" />
              <StatCard label="Prom. goles/partido" value={s.avg_goals_per_match} icon="stats-chart-outline" />
            </View>
            <View style={styles.grid}>
              <StatCard label="Partidos jugados" value={s.played_matches} icon="checkmark-circle-outline" />
              <StatCard label="Partidos restantes" value={s.remaining_matches} icon="time-outline" />
            </View>
            <View style={styles.grid}>
              <StatCard label="Tarjetas amarillas" value={s.total_yellow_cards} icon="square" tone={colors.warning} />
              <StatCard label="Tarjetas rojas" value={s.total_red_cards} icon="square" tone={colors.danger} />
            </View>

            <Card style={styles.textCard}>
              <Text style={typography.bodyBold}>🥇 Equipo más goleador</Text>
              <Text style={typography.body}>{s.top_scoring_team_name ?? 'Sin datos'}</Text>
            </Card>
            <Card style={styles.textCard}>
              <Text style={typography.bodyBold}>🧤 Mejor defensa</Text>
              <Text style={typography.body}>{s.best_defense_team_name ?? 'Sin datos'}</Text>
            </Card>
            <Card style={styles.textCard}>
              <Text style={typography.bodyBold}>⚽ Máximo goleador</Text>
              <Text style={typography.body}>
                {topScorer.data?.[0]
                  ? `${topScorer.data[0].first_name} ${topScorer.data[0].last_name} (${topScorer.data[0].goals})`
                  : 'Sin datos'}
              </Text>
            </Card>
            <Card style={styles.textCard}>
              <Text style={typography.bodyBold}>🅰️ Máximo asistidor</Text>
              <Text style={typography.body}>
                {topAssist.data?.[0]
                  ? `${topAssist.data[0].first_name} ${topAssist.data[0].last_name} (${topAssist.data[0].assists})`
                  : 'Sin datos'}
              </Text>
            </Card>

            {goalsByTeam.length > 0 ? (
              <View style={styles.section}>
                <Text style={typography.h3}>Goles por equipo</Text>
                <Card>
                  {goalsByTeam.map((t) => (
                    <View key={t.team_id} style={styles.barRow}>
                      <Text style={[typography.caption, styles.barLabel]} numberOfLines={1}>
                        {t.team_short_name || t.team_name}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[styles.barFill, { width: `${(t.goals_for / maxGoals) * 100}%` }]}
                        />
                      </View>
                      <Text style={[typography.bodyBold, styles.barValue]}>{t.goals_for}</Text>
                    </View>
                  ))}
                </Card>
              </View>
            ) : null}
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  textCard: {
    gap: 4,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  barLabel: {
    width: 80,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  barValue: {
    width: 24,
    textAlign: 'right',
  },
});
