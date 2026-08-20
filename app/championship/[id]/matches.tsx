import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, SegmentedOptions } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, MatchCard } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useRounds } from '@/hooks/useFixture';
import type { MatchStatus } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

type Filter = 'all' | MatchStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'scheduled', label: 'Programados' },
  { value: 'live', label: 'En vivo' },
  { value: 'finished', label: 'Finalizados' },
];

export default function MatchesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const teams = useTeams(id);
  const rounds = useRounds(id);
  const matches = useMatches(id);
  const [filter, setFilter] = useState<Filter>('all');

  const teamsById = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t])), [teams.data]);
  const roundsById = useMemo(() => new Map((rounds.data ?? []).map((r) => [r.id, r])), [rounds.data]);

  const filteredMatches = useMemo(
    () => (matches.data ?? []).filter((m) => filter === 'all' || m.status === filter),
    [matches.data, filter]
  );

  if (!championship.data) return <LoadingState rows={4} />;

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="partidos" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Partidos</Text>
        <SegmentedOptions options={FILTERS} value={filter} onChange={setFilter} />

        {matches.isLoading ? (
          <LoadingState rows={4} />
        ) : filteredMatches.length > 0 ? (
          <View style={styles.list}>
            {filteredMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                homeTeam={teamsById.get(m.home_team_id ?? '')}
                awayTeam={teamsById.get(m.away_team_id ?? '')}
                roundName={m.round_id ? roundsById.get(m.round_id)?.name : (m.bracket_round ?? undefined)}
                onPress={m.home_team_id && m.away_team_id ? () => router.push(`/match/${m.id}`) : undefined}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="Sin partidos"
            description="Genera el fixture desde la pestaña Fixture para crear los partidos."
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
    paddingBottom: spacing.xxl * 2,
  },
  list: {
    gap: spacing.md,
  },
});
