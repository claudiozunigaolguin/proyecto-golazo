import { useMemo } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Card, EmptyState, SegmentedOptions } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { EditableAvatar, MatchCard, TeamLogo } from '@/components/golazo';
import { useTeam, useTeams, useUpdateTeam } from '@/hooks/useTeams';
import { usePlayersByTeam } from '@/hooks/usePlayers';
import { useMatches } from '@/hooks/useMatches';
import { useStandings } from '@/hooks/useStats';
import { useGroups } from '@/hooks/useGroups';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { pickAndUploadImage, teamLogoPath } from '@/lib/storage';
import { PLAYER_POSITION_SHORT } from '@/types/domain';
import { colors, radius, spacing, typography } from '@/theme';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = id as string;
  const team = useTeam(id);
  const championshipId = team.data?.championship_id;

  const players = usePlayersByTeam(id);
  const matches = useMatches(championshipId);
  const teams = useTeams(championshipId);
  const standings = useStandings(championshipId);
  const groups = useGroups(championshipId);
  const { isManager } = useChampionshipRole(championshipId);
  const updateTeam = useUpdateTeam(championshipId ?? '', teamId);

  const teamsById = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t])), [teams.data]);

  const teamMatches = useMemo(
    () => (matches.data ?? []).filter((m) => m.home_team_id === id || m.away_team_id === id),
    [matches.data, id]
  );
  const pastMatches = teamMatches.filter((m) => m.status === 'finished').slice(-5).reverse();
  const upcomingMatches = teamMatches.filter((m) => m.status === 'scheduled').slice(0, 5);

  const standingRow = standings.data?.find((r) => r.team_id === id);

  if (!team.data) return <LoadingState rows={4} />;

  const t = team.data;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t.name }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {isManager && championshipId ? (
            <EditableAvatar
              uri={t.logo_url}
              name={t.name}
              size={72}
              backgroundColor={t.primary_color ?? undefined}
              onPick={() => pickAndUploadImage(teamLogoPath(championshipId, teamId))}
              onUploaded={(url) => void updateTeam.mutateAsync({ logo_url: url })}
            />
          ) : (
            <TeamLogo name={t.name} logoUrl={t.logo_url} primaryColor={t.primary_color} size={72} />
          )}
          <Text style={typography.h1}>{t.name}</Text>
          {t.coach_name ? (
            <Text style={[typography.body, styles.muted]}>DT: {t.coach_name}</Text>
          ) : null}
        </View>

        {groups.data && groups.data.length > 0 ? (
          <View style={styles.section}>
            <Text style={typography.h3}>Grupo</Text>
            {isManager ? (
              <SegmentedOptions
                options={groups.data.map((g) => ({ value: g.id, label: g.name }))}
                value={t.group_id ?? ''}
                onChange={(groupId) => void updateTeam.mutateAsync({ group_id: groupId })}
              />
            ) : (
              <Text style={typography.body}>
                {groups.data.find((g) => g.id === t.group_id)?.name ?? 'Sin grupo asignado'}
              </Text>
            )}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={typography.h3}>Estadísticas</Text>
          {standingRow ? (
            <View style={styles.statsGrid}>
              {[
                ['PJ', standingRow.played],
                ['PG', standingRow.won],
                ['PE', standingRow.drawn],
                ['PP', standingRow.lost],
                ['GF', standingRow.goals_for],
                ['GC', standingRow.goals_against],
                ['DG', standingRow.goal_difference],
                ['PTS', standingRow.points],
              ].map(([label, value]) => (
                <View key={label as string} style={styles.statCell}>
                  <Text style={typography.stat}>{value}</Text>
                  <Text style={typography.small}>{label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[typography.caption, styles.muted]}>Sin partidos jugados todavía</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Plantel</Text>
          {players.data && players.data.length > 0 ? (
            <View style={styles.list}>
              {players.data.map((p) => (
                <Card
                  key={p.id}
                  onPress={() => router.push(`/player/${p.id}`)}
                  style={styles.playerRow}
                >
                  <Avatar uri={p.photo_url} name={`${p.first_name} ${p.last_name}`} size={36} />
                  <View style={styles.playerInfo}>
                    <Text style={typography.bodyBold}>
                      {p.first_name} {p.last_name}
                    </Text>
                    <Text style={[typography.caption, styles.muted]}>
                      {PLAYER_POSITION_SHORT[p.position]}
                      {p.jersey_number != null ? ` · #${p.jersey_number}` : ''}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState icon="people-outline" title="Sin jugadores registrados" />
          )}
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Últimos partidos</Text>
          {pastMatches.length > 0 ? (
            <View style={styles.list}>
              {pastMatches.map((m) => (
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
            <Text style={[typography.caption, styles.muted]}>Sin resultados todavía</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Próximos partidos</Text>
          {upcomingMatches.length > 0 ? (
            <View style={styles.list}>
              {upcomingMatches.map((m) => (
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
            <Text style={[typography.caption, styles.muted]}>Sin partidos programados</Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  muted: {
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCell: {
    width: 64,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
});
