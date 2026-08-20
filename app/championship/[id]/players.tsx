import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { usePlayersByChampionship } from '@/hooks/usePlayers';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { PLAYER_POSITION_SHORT } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

export default function PlayersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const teams = useTeams(id);
  const players = usePlayersByChampionship(id);
  const { isManager } = useChampionshipRole(id);

  const playersByTeam = useMemo(() => {
    const map = new Map<string, typeof players.data>();
    for (const player of players.data ?? []) {
      const list = map.get(player.team_id) ?? [];
      list.push(player);
      map.set(player.team_id, list);
    }
    return map;
  }, [players.data]);

  if (!championship.data) return <LoadingState rows={4} />;

  const hasTeams = (teams.data?.length ?? 0) > 0;

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="jugadores" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={typography.h2}>Jugadores</Text>
          {isManager && hasTeams ? (
            <Button
              label="+ Agregar"
              size="sm"
              onPress={() => router.push(`/championship/${championship.data!.id}/players-new`)}
            />
          ) : null}
        </View>

        {!hasTeams ? (
          <EmptyState
            icon="person-add-outline"
            title="Primero crea equipos"
            description="Necesitas al menos un equipo para poder agregar jugadores."
          />
        ) : players.isLoading || teams.isLoading ? (
          <LoadingState rows={4} />
        ) : (
          <View style={styles.list}>
            {(teams.data ?? []).map((team) => {
              const teamPlayers = playersByTeam.get(team.id) ?? [];
              return (
                <View key={team.id} style={styles.teamSection}>
                  <Text style={typography.bodyBold}>{team.name}</Text>
                  {teamPlayers.length === 0 ? (
                    <Text style={[typography.caption, styles.muted]}>Sin jugadores</Text>
                  ) : (
                    teamPlayers.map((player) => (
                      <Card
                        key={player.id}
                        onPress={() => router.push(`/player/${player.id}`)}
                        style={styles.playerRow}
                      >
                        <Avatar
                          uri={player.photo_url}
                          name={`${player.first_name} ${player.last_name}`}
                          size={36}
                        />
                        <View style={styles.playerInfo}>
                          <Text style={typography.bodyBold}>
                            {player.first_name} {player.last_name}
                          </Text>
                          <Text style={[typography.caption, styles.muted]}>
                            {PLAYER_POSITION_SHORT[player.position]}
                            {player.jersey_number != null ? ` · #${player.jersey_number}` : ''}
                          </Text>
                        </View>
                      </Card>
                    ))
                  )}
                </View>
              );
            })}
          </View>
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
    gap: spacing.lg,
  },
  teamSection: {
    gap: spacing.sm,
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
  muted: {
    color: colors.textSecondary,
  },
});
