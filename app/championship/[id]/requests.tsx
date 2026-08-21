import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState, TextField } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { usePlayersByChampionship } from '@/hooks/usePlayers';
import {
  useWildcardRequests,
  useApproveWildcardRequest,
  useRejectWildcardRequest,
} from '@/hooks/useWildcardRequests';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { confirmAction } from '@/lib/confirm';
import { WILDCARD_REQUEST_STATUS_LABEL, type WildcardRequestStatus } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const STATUS_TONE: Record<WildcardRequestStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export default function WildcardRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championshipId = id as string;
  const championship = useChampionship(id);
  const teams = useTeams(id);
  const players = usePlayersByChampionship(id);
  const requests = useWildcardRequests(id);
  const { role } = useChampionshipRole(id);
  const isAdmin = role === 'admin';

  const approve = useApproveWildcardRequest(championshipId);
  const reject = useRejectWildcardRequest(championshipId);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const teamNameById = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t.name])), [teams.data]);
  const playerNameById = useMemo(
    () => new Map((players.data ?? []).map((p) => [p.id, `${p.athlete.first_name} ${p.athlete.last_name}`])),
    [players.data]
  );

  if (!championship.data) return <LoadingState rows={4} />;

  const handleApprove = (requestId: string) => {
    confirmAction(
      'Aprobar solicitud',
      'El equipo podrá registrar un arquero adicional aunque el plantel esté al máximo. ¿Confirmar?',
      'Aprobar',
      () => void approve.mutateAsync(requestId)
    );
  };

  const handleConfirmReject = (requestId: string) => {
    confirmAction(
      'Rechazar solicitud',
      '¿Confirmas que quieres rechazar esta solicitud?',
      'Rechazar',
      () => {
        void reject.mutateAsync({ requestId, reason: rejectReason || undefined }).then(() => {
          setRejectingId(null);
          setRejectReason('');
        });
      },
      { destructive: true }
    );
  };

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="resumen" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Solicitudes de arquero comodín</Text>

        {requests.isLoading ? (
          <LoadingState rows={3} />
        ) : requests.data && requests.data.length > 0 ? (
          <View style={styles.list}>
            {requests.data.map((r) => (
              <Card key={r.id} style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={typography.bodyBold}>{teamNameById.get(r.team_id) ?? 'Equipo'}</Text>
                  <Badge label={WILDCARD_REQUEST_STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
                </View>
                <Text style={typography.body}>{r.reason}</Text>
                {r.replaced_player_id ? (
                  <Text style={[typography.caption, styles.muted]}>
                    Reemplaza a: {playerNameById.get(r.replaced_player_id) ?? '—'}
                  </Text>
                ) : null}
                {r.status !== 'pending' && r.review_notes ? (
                  <Text style={[typography.caption, styles.muted]}>Motivo del rechazo: {r.review_notes}</Text>
                ) : null}

                {isAdmin && r.status === 'pending' ? (
                  rejectingId === r.id ? (
                    <View style={styles.rejectForm}>
                      <TextField
                        label="Motivo del rechazo (opcional)"
                        value={rejectReason}
                        onChangeText={setRejectReason}
                      />
                      <View style={styles.actionRow}>
                        <Button
                          label="Confirmar rechazo"
                          variant="outline"
                          size="sm"
                          onPress={() => handleConfirmReject(r.id)}
                          loading={reject.isPending}
                        />
                        <Button
                          label="Cancelar"
                          variant="ghost"
                          size="sm"
                          onPress={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <Button
                        label="Aprobar"
                        size="sm"
                        onPress={() => handleApprove(r.id)}
                        loading={approve.isPending}
                      />
                      <Button
                        label="Rechazar"
                        variant="outline"
                        size="sm"
                        onPress={() => setRejectingId(r.id)}
                      />
                    </View>
                  )
                ) : null}
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="mail-open-outline"
            title="Sin solicitudes"
            description="Acá aparecerán los pedidos de arquero comodín de los equipos."
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
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muted: {
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectForm: {
    gap: spacing.sm,
  },
});
