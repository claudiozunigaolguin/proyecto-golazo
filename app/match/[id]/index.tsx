import { useMemo, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, SegmentedOptions, TextField } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { EventItem, TeamLogo } from '@/components/golazo';
import { useMatch, useSaveMatchResult, useStartLiveMatch } from '@/hooks/useMatches';
import { useTeam } from '@/hooks/useTeams';
import { usePlayersByTeam } from '@/hooks/usePlayers';
import { useAddMatchEvent, useDeleteMatchEvent, useMatchEvents } from '@/hooks/useEvents';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { useAuthStore } from '@/store/authStore';
import { shareText } from '@/lib/share';
import { MATCH_STATUS_LABEL, type MatchEventType } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const EVENT_TYPE_OPTIONS: { value: MatchEventType; label: string }[] = [
  { value: 'goal', label: '⚽ Gol' },
  { value: 'assist', label: '🅰️ Asist.' },
  { value: 'yellow_card', label: '🟨 Amarilla' },
  { value: 'red_card', label: '🟥 Roja' },
];

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id as string;
  const match = useMatch(id);
  const homeTeam = useTeam(match.data?.home_team_id ?? undefined);
  const awayTeam = useTeam(match.data?.away_team_id ?? undefined);
  const championshipId = match.data?.championship_id ?? '';
  const { isManager } = useChampionshipRole(championshipId || undefined);
  const userId = useAuthStore((s) => s.session?.user.id);

  const events = useMatchEvents(matchId);
  const saveResult = useSaveMatchResult(championshipId, matchId);
  const startLive = useStartLiveMatch(championshipId, matchId);
  const addEvent = useAddMatchEvent(championshipId, matchId);
  const deleteEvent = useDeleteMatchEvent(championshipId, matchId);

  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [resultError, setResultError] = useState<string | null>(null);
  const [eventTeam, setEventTeam] = useState<'home' | 'away'>('home');
  const [eventType, setEventType] = useState<MatchEventType>('goal');
  const [eventPlayerId, setEventPlayerId] = useState('');
  const [eventMinute, setEventMinute] = useState('');

  const homePlayers = usePlayersByTeam(match.data?.home_team_id ?? undefined);
  const awayPlayers = usePlayersByTeam(match.data?.away_team_id ?? undefined);
  const eventTeamPlayers = eventTeam === 'home' ? homePlayers : awayPlayers;
  const selectedTeamId = eventTeam === 'home' ? match.data?.home_team_id : match.data?.away_team_id;

  const playersById = useMemo(() => {
    const map = new Map<string, { first_name: string; last_name: string }>();
    for (const p of [...(homePlayers.data ?? []), ...(awayPlayers.data ?? [])]) map.set(p.id, p);
    return map;
  }, [homePlayers.data, awayPlayers.data]);

  if (!match.data) return <LoadingState rows={4} />;

  if (!match.data.home_team_id || !match.data.away_team_id) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Partido' }} />
        <View style={styles.flex}>
          <EmptyState
            icon="help-circle-outline"
            title="Este cruce todavía no está definido"
            description="Se completa automáticamente cuando termine el partido anterior de la fase eliminatoria."
          />
        </View>
      </>
    );
  }

  const m = match.data;

  const handleSaveResult = async () => {
    const parsedHome = Number(homeScore) || 0;
    const parsedAway = Number(awayScore) || 0;
    if (m.stage === 'knockout' && parsedHome === parsedAway) {
      setResultError('En fase eliminatoria no puede haber empate. Define un ganador.');
      return;
    }
    setResultError(null);
    try {
      await saveResult.mutateAsync({ homeScore: parsedHome, awayScore: parsedAway });
    } catch (e) {
      setResultError(e instanceof Error ? e.message : 'No pudimos guardar el resultado');
    }
  };

  const handleStartLive = async () => {
    await startLive.mutateAsync();
    router.push(`/match/${matchId}/live`);
  };

  const handleAddEvent = async () => {
    if (!selectedTeamId) return;
    await addEvent.mutateAsync({
      teamId: selectedTeamId,
      type: eventType,
      playerId: eventType === 'match_start' || eventType === 'match_end' ? null : eventPlayerId || null,
      minute: eventMinute ? Number(eventMinute) : null,
      createdBy: userId ?? null,
    });
    setEventMinute('');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Partido' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <View style={styles.statusRow}>
          <Badge
            label={m.status === 'live' ? 'LIVE' : MATCH_STATUS_LABEL[m.status]}
            tone={m.status === 'live' ? 'live' : m.status === 'finished' ? 'success' : 'neutral'}
          />
        </View>

        <View style={styles.scoreboard}>
          <View style={styles.teamCol}>
            <TeamLogo
              name={homeTeam.data?.name ?? 'Local'}
              logoUrl={homeTeam.data?.logo_url}
              primaryColor={homeTeam.data?.primary_color}
              size={56}
            />
            <Text style={typography.bodyBold}>{homeTeam.data?.name ?? 'Local'}</Text>
          </View>
          <Text style={styles.score}>
            {m.home_score ?? 0} - {m.away_score ?? 0}
          </Text>
          <View style={styles.teamCol}>
            <TeamLogo
              name={awayTeam.data?.name ?? 'Visita'}
              logoUrl={awayTeam.data?.logo_url}
              primaryColor={awayTeam.data?.primary_color}
              size={56}
            />
            <Text style={typography.bodyBold}>{awayTeam.data?.name ?? 'Visita'}</Text>
          </View>
        </View>

        {m.status === 'finished' ? (
          <Button
            label="Compartir resultado"
            variant="outline"
            onPress={() =>
              void shareText(
                `⚽ ${homeTeam.data?.name ?? 'Local'} ${m.home_score ?? 0} - ${m.away_score ?? 0} ${awayTeam.data?.name ?? 'Visita'}\n¡Golazo! 🏆`,
                'Resultado PENTAGOLAZO'
              )
            }
            fullWidth
          />
        ) : null}

        {isManager && m.status === 'scheduled' ? (
          <Card style={styles.section}>
            <Text style={typography.h3}>Registrar resultado</Text>
            <Button label="🔴 Iniciar partido en vivo" onPress={handleStartLive} loading={startLive.isPending} fullWidth />
            <Text style={[typography.caption, styles.muted]}>o ingresa el resultado final directamente:</Text>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <TextField label="Goles local" value={homeScore} onChangeText={setHomeScore} keyboardType="number-pad" />
              </View>
              <View style={styles.flex1}>
                <TextField label="Goles visita" value={awayScore} onChangeText={setAwayScore} keyboardType="number-pad" />
              </View>
            </View>
            {resultError ? <Text style={[typography.caption, styles.errorText]}>{resultError}</Text> : null}
            <Button label="Guardar resultado" onPress={handleSaveResult} loading={saveResult.isPending} fullWidth />
          </Card>
        ) : null}

        {isManager && m.status === 'live' ? (
          <Button label="🔴 Ir al partido en vivo" onPress={() => router.push(`/match/${matchId}/live`)} fullWidth />
        ) : null}

        {isManager && m.status === 'finished' ? (
          <Card style={styles.section}>
            <Text style={typography.h3}>Corregir resultado</Text>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <TextField label="Goles local" value={homeScore} onChangeText={setHomeScore} keyboardType="number-pad" />
              </View>
              <View style={styles.flex1}>
                <TextField label="Goles visita" value={awayScore} onChangeText={setAwayScore} keyboardType="number-pad" />
              </View>
            </View>
            {resultError ? <Text style={[typography.caption, styles.errorText]}>{resultError}</Text> : null}
            <Button label="Actualizar resultado" variant="outline" onPress={handleSaveResult} loading={saveResult.isPending} fullWidth />
          </Card>
        ) : null}

        <View style={styles.section}>
          <Text style={typography.h3}>Eventos del partido</Text>
          {events.isLoading ? (
            <LoadingState rows={3} />
          ) : events.data && events.data.length > 0 ? (
            <Card>
              {events.data.map((ev) => {
                const evTeam = ev.team_id === m.home_team_id ? homeTeam.data : awayTeam.data;
                const evPlayer = ev.player_id ? playersById.get(ev.player_id) : undefined;
                return (
                  <View key={ev.id} style={styles.eventRow}>
                    <View style={styles.eventItemFlex}>
                      <EventItem
                        type={ev.type}
                        minute={ev.minute}
                        playerName={evPlayer ? `${evPlayer.first_name} ${evPlayer.last_name}` : undefined}
                        teamName={evTeam?.name}
                      />
                    </View>
                    {isManager ? (
                      <Button
                        label="✕"
                        variant="ghost"
                        size="sm"
                        onPress={() => void deleteEvent.mutateAsync(ev.id)}
                      />
                    ) : null}
                  </View>
                );
              })}
            </Card>
          ) : (
            <EmptyState icon="time-outline" title="Sin eventos registrados" />
          )}
        </View>

        {isManager && (m.status === 'live' || m.status === 'finished') ? (
          <Card style={styles.section}>
            <Text style={typography.h3}>Agregar evento</Text>
            <SegmentedOptions
              options={[
                { value: 'home', label: homeTeam.data?.short_name || homeTeam.data?.name || 'Local' },
                { value: 'away', label: awayTeam.data?.short_name || awayTeam.data?.name || 'Visita' },
              ]}
              value={eventTeam}
              onChange={setEventTeam}
            />
            <SegmentedOptions options={EVENT_TYPE_OPTIONS} value={eventType} onChange={setEventType} />
            <SegmentedOptions
              options={(eventTeamPlayers.data ?? []).map((p) => ({
                value: p.id,
                label: `#${p.jersey_number ?? '-'} ${p.last_name}`,
              }))}
              value={eventPlayerId}
              onChange={setEventPlayerId}
            />
            <TextField label="Minuto" value={eventMinute} onChangeText={setEventMinute} keyboardType="number-pad" />
            <Button label="+ Agregar evento" onPress={handleAddEvent} loading={addEvent.isPending} fullWidth />
          </Card>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  statusRow: {
    alignItems: 'center',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  teamCol: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  score: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  muted: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.danger,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventItemFlex: {
    flex: 1,
  },
});
