import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, StatCard } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import {
  ChampionshipHeader,
  ChampionshipTabBar,
  MatchCard,
  StandingTable,
  TopScorersList,
} from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useStandings, useTopScorers, useChampionshipStats } from '@/hooks/useStats';
import { getPublicChampionshipUrl, shareText } from '@/lib/share';
import { colors, spacing, typography } from '@/theme';

export default function ChampionshipSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const championship = useChampionship(id);
  const teams = useTeams(id);
  const matches = useMatches(id);
  const standings = useStandings(id);
  const topScorers = useTopScorers(id, 3);
  const stats = useChampionshipStats(id);

  const teamsById = useMemo(() => {
    const map = new Map((teams.data ?? []).map((t) => [t.id, t]));
    return map;
  }, [teams.data]);

  const nextMatch = useMemo(
    () => (matches.data ?? []).find((m) => m.status === 'scheduled' && m.home_team_id && m.away_team_id),
    [matches.data]
  );

  const recentResults = useMemo(
    () =>
      (matches.data ?? [])
        .filter((m) => m.status === 'finished')
        .slice(-3)
        .reverse(),
    [matches.data]
  );

  if (championship.isLoading || !championship.data) {
    return (
      <View style={styles.flex}>
        <LoadingState rows={4} />
      </View>
    );
  }

  const champ = championship.data;
  const leader = standings.data?.[0];
  const topScorer = topScorers.data?.[0];

  return (
    <View style={styles.flex}>
      <ChampionshipHeader
        championship={champ}
        onSharePress={() =>
          void shareText(
            `⚽ ${champ.name} — ${champ.season ?? ''}\nSíguelo en PENTAGOLAZO: ${getPublicChampionshipUrl(champ.slug)}`,
            champ.name
          )
        }
      />
      <ChampionshipTabBar championshipId={champ.id} active="resumen" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statsGrid}>
          <StatCard
            label="Partidos jugados"
            value={`${stats.data?.played_matches ?? 0}/${stats.data?.total_matches ?? 0}`}
            icon="football-outline"
          />
          <StatCard label="Líder" value={leader?.team_short_name || leader?.team_name || '—'} icon="trophy-outline" />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="Máx. goleador"
            value={topScorer ? `${topScorer.first_name} (${topScorer.goals})` : '—'}
            icon="football"
          />
          <StatCard
            label="Equipos"
            value={teams.data?.length ?? 0}
            icon="people-outline"
          />
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Próximo partido</Text>
          {nextMatch ? (
            <MatchCard
              match={nextMatch}
              homeTeam={teamsById.get(nextMatch.home_team_id ?? '')}
              awayTeam={teamsById.get(nextMatch.away_team_id ?? '')}
              onPress={() => router.push(`/match/${nextMatch.id}`)}
            />
          ) : (
            <EmptyState icon="calendar-outline" title="Sin próximos partidos programados" />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Últimos resultados</Text>
          </View>
          {recentResults.length > 0 ? (
            <View style={styles.list}>
              {recentResults.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  homeTeam={teamsById.get(m.home_team_id ?? '')}
                  awayTeam={teamsById.get(m.away_team_id ?? '')}
                  onPress={() => router.push(`/match/${m.id}`)}
                />
              ))}
            </View>
          ) : (
            <Text style={[typography.caption, styles.muted]}>Aún no hay resultados</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Así va la tabla</Text>
            <Text style={styles.link} onPress={() => router.push(`/championship/${champ.id}/table`)}>
              Ver todo
            </Text>
          </View>
          {standings.data && standings.data.length > 0 ? (
            <StandingTable rows={standings.data.slice(0, 5)} />
          ) : (
            <Text style={[typography.caption, styles.muted]}>Sin datos todavía</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Los máximos goleadores</Text>
            <Text style={styles.link} onPress={() => router.push(`/championship/${champ.id}/scorers`)}>
              Ver todo
            </Text>
          </View>
          <TopScorersList
            rows={(topScorers.data ?? []).map((s) => ({
              id: s.player_id,
              name: `${s.first_name} ${s.last_name}`,
              teamName: s.team_name,
              photoUrl: s.photo_url,
              value: s.goals,
            }))}
            emptyTitle="Sin goles registrados todavía"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: spacing.md,
  },
  muted: {
    color: colors.textSecondary,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
