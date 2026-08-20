import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, StandingTable } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useStandings, useGroupStandingsList } from '@/hooks/useStats';
import { useGroups } from '@/hooks/useGroups';
import { shareText } from '@/lib/share';
import type { StandingRow } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

export default function StandingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const groups = useGroups(id);
  const hasGroups = (groups.data?.length ?? 0) > 0;

  const overallStandings = useStandings(hasGroups ? undefined : id);
  const groupStandingsResults = useGroupStandingsList(id, groups.data ?? []);
  const groupStandingsLoading = groupStandingsResults.some((r) => r.isLoading);

  if (!championship.data) return <LoadingState rows={4} />;

  const handleShare = (title: string, rows: StandingRow[]) => {
    const lines = rows
      .slice(0, 10)
      .map((r, i) => `${i + 1}. ${r.team_short_name || r.team_name} — ${r.points} pts (PJ ${r.played}, DG ${r.goal_difference >= 0 ? '+' : ''}${r.goal_difference})`);
    void shareText(`🏆 ${title}\n\n${lines.join('\n')}`, title);
  };

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="tabla" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Tabla de posiciones</Text>
        {hasGroups ? (
          <Text style={[typography.caption, styles.muted]}>
            Los 2 primeros de cada grupo (destacados) clasifican a la fase eliminatoria
          </Text>
        ) : null}

        {hasGroups ? (
          groupStandingsLoading ? (
            <LoadingState rows={5} />
          ) : (
            <View style={styles.list}>
              {(groups.data ?? []).map((group, index) => {
                const rows = groupStandingsResults[index]?.data ?? [];
                return (
                  <View key={group.id} style={styles.groupSection}>
                    <View style={styles.headerRow}>
                      <Text style={typography.h3}>{group.name}</Text>
                      {rows.length > 0 ? (
                        <Button
                          label="Compartir"
                          variant="outline"
                          size="sm"
                          onPress={() => handleShare(`${group.name} — ${championship.data!.name}`, rows)}
                        />
                      ) : null}
                    </View>
                    {rows.length > 0 ? (
                      <StandingTable rows={rows} qualifyCount={2} />
                    ) : (
                      <Text style={[typography.caption, styles.muted]}>Sin partidos jugados todavía</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )
        ) : (
          <>
            <View style={styles.headerRow}>
              <View />
              {overallStandings.data && overallStandings.data.length > 0 ? (
                <Button
                  label="Compartir tabla"
                  variant="outline"
                  size="sm"
                  onPress={() => handleShare(`Así va la tabla de ${championship.data!.name}`, overallStandings.data!)}
                />
              ) : null}
            </View>
            {overallStandings.isLoading ? (
              <LoadingState rows={5} />
            ) : overallStandings.data && overallStandings.data.length > 0 ? (
              <StandingTable rows={overallStandings.data} />
            ) : (
              <EmptyState
                icon="podium-outline"
                title="Sin partidos jugados todavía"
                description="La tabla se calcula automáticamente cuando se registran resultados."
              />
            )}
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: spacing.xl,
  },
  muted: {
    color: colors.textSecondary,
  },
  groupSection: {
    gap: spacing.md,
  },
});
