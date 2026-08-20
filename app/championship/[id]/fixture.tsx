import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, MatchCard } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useClearFixture, useGenerateFixture, useRounds } from '@/hooks/useFixture';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { confirmAction } from '@/lib/confirm';
import { colors, spacing, typography } from '@/theme';

export default function FixtureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championshipId = id as string;
  const championship = useChampionship(id);
  const teams = useTeams(id);
  const rounds = useRounds(id);
  const matches = useMatches(id);
  const { isManager } = useChampionshipRole(id);

  const generateFixture = useGenerateFixture(championshipId);
  const clearFixture = useClearFixture(championshipId);

  const teamsById = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t])), [teams.data]);

  const matchesByRound = useMemo(() => {
    const map = new Map<string, typeof matches.data>();
    for (const m of matches.data ?? []) {
      const key = m.round_id ?? 'sin-fecha';
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return map;
  }, [matches.data]);

  const hasFixture = (matches.data?.length ?? 0) > 0;
  const canGenerate = (teams.data?.length ?? 0) >= 2;
  const teamsMissingGroup = (teams.data ?? []).filter((t) => !t.group_id).length;
  const usesGroups = championship.data?.competition_system === 'groups_playoffs';
  const blockedByMissingGroup = usesGroups && teamsMissingGroup > 0 && (teams.data?.length ?? 0) > 0;

  const fixtureTeams = () => (teams.data ?? []).map((t) => ({ id: t.id, group_id: t.group_id }));

  const handleGenerate = () => {
    void generateFixture.mutateAsync(fixtureTeams());
  };

  const handleRegenerate = () => {
    confirmAction(
      'Regenerar fixture',
      'Esto eliminará todos los partidos y fechas actuales del campeonato, incluidos resultados ya registrados. ¿Continuar?',
      'Regenerar',
      () => {
        void (async () => {
          await clearFixture.mutateAsync();
          await generateFixture.mutateAsync(fixtureTeams());
        })();
      },
      { destructive: true }
    );
  };

  if (!championship.data) return <LoadingState rows={4} />;

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="fixture" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={typography.h2}>Fixture</Text>
          {isManager && hasFixture ? (
            <Button label="Regenerar" variant="outline" size="sm" onPress={handleRegenerate} />
          ) : null}
        </View>

        {matches.isLoading || rounds.isLoading ? (
          <LoadingState rows={4} />
        ) : hasFixture ? (
          <View style={styles.list}>
            {(rounds.data ?? []).map((round) => {
              const roundMatches = matchesByRound.get(round.id) ?? [];
              if (roundMatches.length === 0) return null;
              return (
                <View key={round.id} style={styles.roundSection}>
                  <Text style={typography.bodyBold}>{round.name}</Text>
                  {roundMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      homeTeam={teamsById.get(m.home_team_id ?? '')}
                      awayTeam={teamsById.get(m.away_team_id ?? '')}
                      onPress={() => router.push(`/match/${m.id}`)}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        ) : isManager ? (
          <EmptyState
            icon="shuffle-outline"
            title="Genera el fixture automáticamente"
            description={
              blockedByMissingGroup
                ? `${teamsMissingGroup} equipo(s) todavía no tienen grupo asignado. Asígnalos desde la pestaña Equipos antes de generar el fixture.`
                : canGenerate
                  ? usesGroups
                    ? `Se generará todos-contra-todos dentro de cada grupo con los ${teams.data?.length} equipos registrados.`
                    : `Se generará todos-contra-todos con los ${teams.data?.length} equipos registrados.`
                  : 'Necesitas al menos 2 equipos registrados para generar el fixture.'
            }
            actionLabel={canGenerate && !blockedByMissingGroup ? 'Generar fixture' : undefined}
            onAction={canGenerate && !blockedByMissingGroup ? handleGenerate : undefined}
          />
        ) : (
          <EmptyState icon="shuffle-outline" title="El fixture aún no se ha generado" />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: spacing.xl,
  },
  roundSection: {
    gap: spacing.md,
  },
});
