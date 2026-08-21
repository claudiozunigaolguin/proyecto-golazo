import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button, SegmentedOptions, TextField } from '@/components/ui';
import { useTeams } from '@/hooks/useTeams';
import { usePlayersByTeam } from '@/hooks/usePlayers';
import { useCreateWildcardRequest } from '@/hooks/useWildcardRequests';
import { useAuthStore } from '@/store/authStore';
import { wildcardRequestSchema } from '@/lib/validations';
import { colors, spacing, typography } from '@/theme';

export default function WildcardRequestScreen() {
  const { id, teamId: teamIdParam } = useLocalSearchParams<{ id: string; teamId?: string }>();
  const championshipId = id as string;
  const userId = useAuthStore((s) => s.session?.user.id);
  const teams = useTeams(id);

  const [teamId, setTeamId] = useState(teamIdParam ?? '');
  const [reason, setReason] = useState('');
  const [replacedPlayerId, setReplacedPlayerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedTeamId = teamId || teams.data?.[0]?.id || '';
  const teamGoalkeepers = usePlayersByTeam(selectedTeamId);
  const createRequest = useCreateWildcardRequest(championshipId, userId ?? '');

  const goalkeepers = (teamGoalkeepers.data ?? []).filter((p) => p.position === 'gk');

  const handleSubmit = async () => {
    if (!userId) return;
    const parsed = wildcardRequestSchema.safeParse({
      teamId: selectedTeamId,
      reason,
      replacedPlayerId: replacedPlayerId || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos de la solicitud');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createRequest.mutateAsync(parsed.data);
      router.replace(`/championship/${championshipId}/requests`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Solicitar arquero comodín' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Text style={[typography.caption, styles.notice]}>
          Esta solicitud queda pendiente hasta que un administrador del campeonato la apruebe. Si
          se aprueba, el equipo podrá registrar un arquero adicional aunque el plantel esté al
          máximo.
        </Text>

        <Text style={typography.caption}>Equipo</Text>
        <SegmentedOptions
          options={(teams.data ?? []).map((t) => ({ value: t.id, label: t.short_name || t.name }))}
          value={selectedTeamId}
          onChange={setTeamId}
        />

        {goalkeepers.length > 0 ? (
          <>
            <Text style={typography.caption}>Arquero reemplazado (opcional)</Text>
            <SegmentedOptions
              options={goalkeepers.map((p) => ({
                value: p.id,
                label: `${p.athlete.first_name} ${p.athlete.last_name}`,
              }))}
              value={replacedPlayerId}
              onChange={setReplacedPlayerId}
            />
          </>
        ) : null}

        <TextField
          label="Motivo"
          value={reason}
          onChangeText={setReason}
          placeholder="El arquero titular sufrió una lesión y no puede seguir jugando"
          multiline
          numberOfLines={3}
        />

        {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

        <Button label="Enviar solicitud" onPress={handleSubmit} loading={submitting} fullWidth />
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
  notice: {
    color: colors.textSecondary,
  },
  error: {
    color: colors.danger,
  },
});
