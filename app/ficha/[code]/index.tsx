import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Avatar, Card, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { Logo } from '@/components/golazo';
import { useAthleteByCode } from '@/hooks/useAthletes';
import { usePlayersByAthlete } from '@/hooks/usePlayers';
import { getPublicPlayerUrl } from '@/lib/share';
import { PLAYER_POSITION_LABEL } from '@/types/domain';
import { colors, radius, spacing, typography } from '@/theme';

export default function PublicPlayerScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const athlete = useAthleteByCode(code);
  const enrollments = usePlayersByAthlete(athlete.data?.id);

  if (athlete.isLoading) {
    return (
      <View style={styles.flex}>
        <LoadingState rows={5} />
      </View>
    );
  }

  if (!athlete.data) {
    return (
      <View style={styles.flex}>
        <EmptyState
          icon="alert-circle-outline"
          title="Ficha no encontrada"
          description="El código puede estar mal escrito."
          actionLabel="Ir a PENTAGOLAZO"
          onAction={() => router.replace('/')}
        />
      </View>
    );
  }

  const a = athlete.data;
  const publicUrl = getPublicPlayerUrl(a.public_code);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.brandRow}>
        <Logo size="sm" />
      </View>

      <View style={styles.header}>
        <Avatar uri={a.photo_url} name={`${a.first_name} ${a.last_name}`} size={88} />
        <Text style={typography.h1}>
          {a.first_name} {a.last_name}
        </Text>
        <Text style={[typography.caption, styles.muted]}>{a.public_code}</Text>
      </View>

      <Card style={styles.qrCard}>
        <View style={styles.qrWrap}>
          <QRCode value={publicUrl} size={140} color={colors.textPrimary} backgroundColor={colors.background} />
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={typography.h3}>Inscripciones</Text>
        {enrollments.isLoading ? (
          <LoadingState rows={2} />
        ) : enrollments.data && enrollments.data.length > 0 ? (
          <View style={styles.list}>
            {enrollments.data.map((e) => (
              <Card key={e.id} style={styles.enrollmentRow}>
                <Text style={typography.bodyBold}>{e.championship.name}</Text>
                <Text style={[typography.caption, styles.muted]}>
                  {e.team.name} · {PLAYER_POSITION_LABEL[e.position]}
                  {e.jersey_number != null ? ` · #${e.jersey_number}` : ''}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, styles.muted]}>Sin inscripciones registradas</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  brandRow: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  muted: {
    color: colors.textSecondary,
  },
  qrCard: {
    alignItems: 'center',
  },
  qrWrap: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  enrollmentRow: {
    gap: 2,
  },
});
