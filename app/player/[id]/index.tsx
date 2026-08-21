import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Card } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { PlayerCard } from '@/components/golazo';
import { usePlayer, usePlayerStats, usePlayersByAthlete } from '@/hooks/usePlayers';
import { useTeam } from '@/hooks/useTeams';
import { useUpdateAthlete, useRevealAthleteRut } from '@/hooks/useAthletes';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { pickAndUploadImage, athletePhotoPath } from '@/lib/storage';
import { getPublicPlayerUrl, shareText } from '@/lib/share';
import { colors, radius, spacing, typography } from '@/theme';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = usePlayer(id);
  const team = useTeam(player.data?.team_id);
  const stats = usePlayerStats(id);
  const championshipId = player.data?.championship_id;
  const { isManager } = useChampionshipRole(championshipId);
  const athleteId = player.data?.athlete_id;
  const updateAthlete = useUpdateAthlete(athleteId ?? '');
  const revealRut = useRevealAthleteRut();
  const otherEnrollments = usePlayersByAthlete(athleteId);

  const [rutRevealed, setRutRevealed] = useState<string | null>(null);

  if (!player.data) return <LoadingState rows={4} />;

  const p = player.data;
  const athlete = p.athlete;
  const publicUrl = getPublicPlayerUrl(athlete.public_code);

  const handleChangePhoto = async () => {
    if (!athleteId) return;
    const url = await pickAndUploadImage(athletePhotoPath(athleteId));
    if (url) await updateAthlete.mutateAsync({ photo_url: url });
  };

  const handleRevealRut = async () => {
    if (!athleteId) return;
    const rut = await revealRut.mutateAsync(athleteId);
    setRutRevealed(rut ?? 'Sin RUT registrado');
  };

  const handleShare = () =>
    void shareText(`⚽ Ficha de ${athlete.first_name} ${athlete.last_name}\n${publicUrl}`, athlete.first_name);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: `${athlete.first_name} ${athlete.last_name}` }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <PlayerCard
          firstName={athlete.first_name}
          lastName={athlete.last_name}
          jerseyNumber={p.jersey_number}
          photoUrl={athlete.photo_url}
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
            label={athlete.photo_url ? 'Cambiar foto' : 'Agregar foto'}
            variant="outline"
            onPress={() => void handleChangePhoto()}
            loading={updateAthlete.isPending}
            fullWidth
          />
        ) : null}

        <Card style={styles.qrCard}>
          <Text style={typography.h3}>Ficha pública</Text>
          <Text style={[typography.caption, styles.muted]}>{athlete.public_code}</Text>
          <View style={styles.qrWrap}>
            <QRCode value={publicUrl} size={140} color={colors.textPrimary} backgroundColor={colors.card} />
          </View>
          <Button label="Compartir ficha" size="sm" onPress={handleShare} />
        </Card>

        {isManager ? (
          <Card style={styles.section}>
            <Text style={typography.h3}>RUT</Text>
            {rutRevealed ? (
              <Text style={typography.body}>{rutRevealed}</Text>
            ) : (
              <Button
                label="Ver RUT"
                variant="outline"
                size="sm"
                onPress={() => void handleRevealRut()}
                loading={revealRut.isPending}
              />
            )}
          </Card>
        ) : null}

        {(otherEnrollments.data?.length ?? 0) > 1 ? (
          <View style={styles.section}>
            <Text style={typography.h3}>Historial de participaciones</Text>
            {otherEnrollments.data!
              .filter((e) => e.id !== p.id)
              .map((e) => (
                <Card key={e.id} onPress={() => router.push(`/player/${e.id}`)} style={styles.enrollmentRow}>
                  <Text style={typography.bodyBold}>{e.championship.name}</Text>
                  <Text style={[typography.caption, styles.muted]}>Equipo: {e.team.name}</Text>
                </Card>
              ))}
          </View>
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
  section: {
    gap: spacing.sm,
  },
  qrCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrWrap: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
  },
  muted: {
    color: colors.textSecondary,
  },
  enrollmentRow: {
    gap: 2,
  },
});
