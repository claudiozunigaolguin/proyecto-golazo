import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, TeamLogo } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { useClubs } from '@/hooks/useClubs';
import { useGroups } from '@/hooks/useGroups';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { colors, spacing, typography } from '@/theme';

export default function TeamsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const teams = useTeams(id);
  const clubs = useClubs(id);
  const groups = useGroups(id);
  const { isManager } = useChampionshipRole(id);

  if (!championship.data) return <LoadingState rows={4} />;

  const isLeagueSeries = championship.data.competition_system === 'league_series';

  if (isLeagueSeries) {
    const groupNameById = new Map((groups.data ?? []).map((g) => [g.id, g.name]));
    const teamsByClubId = new Map<string, typeof teams.data>();
    for (const team of teams.data ?? []) {
      if (!team.club_id) continue;
      const list = teamsByClubId.get(team.club_id) ?? [];
      list.push(team);
      teamsByClubId.set(team.club_id, list);
    }

    return (
      <View style={styles.flex}>
        <ChampionshipHeader championship={championship.data} />
        <ChampionshipTabBar championshipId={championship.data.id} active="equipos" />

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <Text style={typography.h2}>Clubes</Text>
            {isManager ? (
              <Button
                label="+ Agregar club"
                size="sm"
                onPress={() => router.push(`/championship/${championship.data!.id}/club-create`)}
              />
            ) : null}
          </View>

          {clubs.isLoading ? (
            <LoadingState rows={4} />
          ) : clubs.data && clubs.data.length > 0 ? (
            <View style={styles.list}>
              {clubs.data.map((club) => (
                <Card key={club.id} style={styles.clubCard}>
                  <View style={styles.teamRow}>
                    <TeamLogo name={club.name} logoUrl={club.logo_url} primaryColor={club.primary_color} size={44} />
                    <Text style={typography.bodyBold}>{club.name}</Text>
                  </View>
                  <View style={styles.seriesRow}>
                    {(teamsByClubId.get(club.id) ?? []).map((team) => (
                      <Pressable
                        key={team.id}
                        onPress={() => router.push(`/team/${team.id}`)}
                        style={styles.seriesChip}
                      >
                        <Text style={[typography.caption, styles.seriesChipText]}>
                          {(team.group_id && groupNameById.get(team.group_id)) || 'Serie'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="people-outline"
              title="Sin clubes todavía"
              description={
                isManager
                  ? 'Agrega los clubes que participarán en la liga; cada uno jugará las 4 series.'
                  : 'Aún no hay clubes registrados.'
              }
              actionLabel={isManager ? '+ Agregar club' : undefined}
              onAction={
                isManager
                  ? () => router.push(`/championship/${championship.data!.id}/club-create`)
                  : undefined
              }
            />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="equipos" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={typography.h2}>Equipos</Text>
          {isManager ? (
            <Button
              label="+ Agregar"
              size="sm"
              onPress={() => router.push(`/championship/${championship.data!.id}/teams-new`)}
            />
          ) : null}
        </View>

        {teams.isLoading ? (
          <LoadingState rows={4} />
        ) : teams.data && teams.data.length > 0 ? (
          <View style={styles.list}>
            {teams.data.map((team) => (
              <Card key={team.id} onPress={() => router.push(`/team/${team.id}`)} style={styles.teamRow}>
                <TeamLogo name={team.name} logoUrl={team.logo_url} primaryColor={team.primary_color} size={44} />
                <View style={styles.teamInfo}>
                  <Text style={typography.bodyBold}>{team.name}</Text>
                  {team.coach_name ? (
                    <Text style={[typography.caption, styles.muted]}>DT: {team.coach_name}</Text>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="people-outline"
            title="Sin equipos todavía"
            description={
              isManager ? 'Agrega los equipos que participarán en el campeonato.' : 'Aún no hay equipos registrados.'
            }
            actionLabel={isManager ? '+ Agregar equipo' : undefined}
            onAction={
              isManager
                ? () => router.push(`/championship/${championship.data!.id}/teams-new`)
                : undefined
            }
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamInfo: {
    flex: 1,
    gap: 2,
  },
  muted: {
    color: colors.textSecondary,
  },
  clubCard: {
    gap: spacing.sm,
  },
  seriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  seriesChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  seriesChipText: {
    color: colors.textSecondary,
  },
});
