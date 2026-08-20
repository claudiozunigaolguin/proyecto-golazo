import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { TeamLogo } from '@/components/golazo';
import { useMatch, useSaveMatchResult, useUpdateLiveScore, useUpdateMatch } from '@/hooks/useMatches';
import { useTeam } from '@/hooks/useTeams';
import { useAddMatchEvent } from '@/hooks/useEvents';
import { useAuthStore } from '@/store/authStore';
import { confirmAction } from '@/lib/confirm';
import { colors, spacing, typography } from '@/theme';

export default function LiveMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id as string;
  const match = useMatch(id);
  const championshipId = match.data?.championship_id ?? '';
  const homeTeam = useTeam(match.data?.home_team_id ?? undefined);
  const awayTeam = useTeam(match.data?.away_team_id ?? undefined);
  const userId = useAuthStore((s) => s.session?.user.id);

  const updateScore = useUpdateLiveScore(championshipId, matchId);
  const updateMatch = useUpdateMatch(championshipId, matchId);
  const addEvent = useAddMatchEvent(championshipId, matchId);
  const saveResult = useSaveMatchResult(championshipId, matchId);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!match.data) return <LoadingState rows={4} />;

  if (!match.data.home_team_id || !match.data.away_team_id) {
    return (
      <View style={styles.flex}>
        <EmptyState icon="help-circle-outline" title="Este cruce todavía no está definido" />
      </View>
    );
  }

  const m = match.data;
  // Ya se validó arriba que ambos equipos están definidos.
  const homeTeamId = m.home_team_id as string;
  const awayTeamId = m.away_team_id as string;
  const homeScore = m.home_score ?? 0;
  const awayScore = m.away_score ?? 0;
  const minute = m.current_minute ?? 0;

  const withBusy = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error, intenta de nuevo');
    } finally {
      setBusy(false);
    }
  };

  const logTeamEvent = (teamId: string, type: 'goal' | 'yellow_card' | 'red_card' | 'assist') =>
    withBusy(() =>
      addEvent.mutateAsync({ teamId, type, minute, createdBy: userId ?? null })
    );

  const handleGoal = (side: 'home' | 'away') =>
    withBusy(async () => {
      const teamId = side === 'home' ? homeTeamId : awayTeamId;
      const nextHome = side === 'home' ? homeScore + 1 : homeScore;
      const nextAway = side === 'away' ? awayScore + 1 : awayScore;
      await updateScore.mutateAsync({ homeScore: nextHome, awayScore: nextAway });
      await addEvent.mutateAsync({ teamId, type: 'goal', minute, createdBy: userId ?? null });
    });

  const handleMinute = () => void withBusy(() => updateMatch.mutateAsync({ current_minute: minute + 1 }));

  const handleFinish = () => {
    confirmAction(
      'Finalizar partido',
      `¿Cerrar el partido con marcador ${homeScore} - ${awayScore}?`,
      'Finalizar',
      () => {
        void withBusy(async () => {
          await saveResult.mutateAsync({ homeScore, awayScore });
          router.replace(`/match/${matchId}`);
        });
      }
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Partido en vivo' }} />
      <View style={styles.flex}>
        <View style={styles.liveBadge}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
          <Text style={styles.minute} onPress={handleMinute}>
            {minute}' (+1)
          </Text>
        </View>

        <View style={styles.scoreboard}>
          <View style={styles.teamCol}>
            <TeamLogo name={homeTeam.data?.name ?? 'Local'} logoUrl={homeTeam.data?.logo_url} size={64} />
            <Text style={typography.bodyBold}>{homeTeam.data?.short_name || homeTeam.data?.name}</Text>
          </View>
          <Text style={styles.score}>
            {homeScore} - {awayScore}
          </Text>
          <View style={styles.teamCol}>
            <TeamLogo name={awayTeam.data?.name ?? 'Visita'} logoUrl={awayTeam.data?.logo_url} size={64} />
            <Text style={typography.bodyBold}>{awayTeam.data?.short_name || awayTeam.data?.name}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <Button label="⚽ GOL LOCAL" onPress={() => void handleGoal('home')} disabled={busy} style={styles.flex1} />
            <Button label="⚽ GOL VISITA" onPress={() => void handleGoal('away')} disabled={busy} style={styles.flex1} />
          </View>
          <View style={styles.actionRow}>
            <Button
              label="🟨 LOCAL"
              variant="secondary"
              onPress={() => void logTeamEvent(homeTeamId, 'yellow_card')}
              disabled={busy}
              style={styles.flex1}
            />
            <Button
              label="🟨 VISITA"
              variant="secondary"
              onPress={() => void logTeamEvent(awayTeamId, 'yellow_card')}
              disabled={busy}
              style={styles.flex1}
            />
          </View>
          <View style={styles.actionRow}>
            <Button
              label="🟥 LOCAL"
              variant="secondary"
              onPress={() => void logTeamEvent(homeTeamId, 'red_card')}
              disabled={busy}
              style={styles.flex1}
            />
            <Button
              label="🟥 VISITA"
              variant="secondary"
              onPress={() => void logTeamEvent(awayTeamId, 'red_card')}
              disabled={busy}
              style={styles.flex1}
            />
          </View>
          <View style={styles.actionRow}>
            <Button
              label="🅰️ ASIST. LOCAL"
              variant="secondary"
              onPress={() => void logTeamEvent(homeTeamId, 'assist')}
              disabled={busy}
              style={styles.flex1}
            />
            <Button
              label="🅰️ ASIST. VISITA"
              variant="secondary"
              onPress={() => void logTeamEvent(awayTeamId, 'assist')}
              disabled={busy}
              style={styles.flex1}
            />
          </View>

          <Text style={[typography.caption, styles.hint]}>
            Para asignar el jugador de cada gol/tarjeta, entra al detalle del partido y edita el
            evento correspondiente.
          </Text>

          {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

          <Button label="Finalizar partido" variant="danger" onPress={handleFinish} fullWidth />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.live,
  },
  liveText: {
    color: colors.live,
    fontWeight: '800',
    letterSpacing: 1,
  },
  minute: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xxl,
  },
  teamCol: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  score: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actions: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
