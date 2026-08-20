import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, TeamLogo } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { colors, spacing, typography } from '@/theme';

export default function TeamsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const teams = useTeams(id);
  const { isManager } = useChampionshipRole(id);

  if (!championship.data) return <LoadingState rows={4} />;

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
});
