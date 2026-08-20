import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Button } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { PlayerCard } from '@/components/golazo';
import { usePlayer, usePlayerStats, useUpdatePlayer } from '@/hooks/usePlayers';
import { useTeam } from '@/hooks/useTeams';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { pickAndUploadImage, playerPhotoPath } from '@/lib/storage';
import { colors, spacing } from '@/theme';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playerId = id as string;
  const player = usePlayer(id);
  const team = useTeam(player.data?.team_id);
  const stats = usePlayerStats(id);
  const championshipId = player.data?.championship_id;
  const { isManager } = useChampionshipRole(championshipId);
  const updatePlayer = useUpdatePlayer(player.data?.team_id ?? '', championshipId ?? '', playerId);

  if (!player.data) return <LoadingState rows={4} />;

  const p = player.data;

  const handleChangePhoto = async () => {
    if (!championshipId) return;
    const url = await pickAndUploadImage(playerPhotoPath(championshipId, playerId));
    if (url) await updatePlayer.mutateAsync({ photo_url: url });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: `${p.first_name} ${p.last_name}` }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <PlayerCard
          firstName={p.first_name}
          lastName={p.last_name}
          jerseyNumber={p.jersey_number}
          photoUrl={p.photo_url}
          position={p.position}
          teamName={team.data?.name ?? 'Sin equipo'}
          stats={{
            matches: stats.data?.matches ?? 0,
            goals: stats.data?.goals ?? 0,
            assists: stats.data?.assists ?? 0,
            yellowCards: stats.data?.yellowCards ?? 0,
            redCards: stats.data?.redCards ?? 0,
          }}
        />

        {isManager ? (
          <Button
            label={p.photo_url ? 'Cambiar foto' : 'Agregar foto'}
            variant="outline"
            onPress={() => void handleChangePhoto()}
            loading={updatePlayer.isPending}
            style={styles.photoButton}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  photoButton: {
    marginTop: spacing.md,
  },
});
