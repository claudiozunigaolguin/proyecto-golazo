import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui';
import { PLAYER_POSITION_SHORT, type PlayerPosition } from '@/types/domain';
import { colors, radius, spacing, typography } from '@/theme';

interface PlayerCardStats {
  matches: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

interface PlayerCardProps {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  photoUrl?: string | null;
  position: PlayerPosition;
  teamName: string;
  stats: PlayerCardStats;
}

export function PlayerCard({
  firstName,
  lastName,
  jerseyNumber,
  photoUrl,
  position,
  teamName,
  stats,
}: PlayerCardProps) {
  const fullName = `${firstName} ${lastName}`;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Avatar uri={photoUrl} name={fullName} size={64} backgroundColor="rgba(255,255,255,0.2)" />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={styles.team} numberOfLines={1}>
            {teamName}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{PLAYER_POSITION_SHORT[position]}</Text>
            </View>
            {jerseyNumber != null ? <Text style={styles.number}>#{jerseyNumber}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatItem label="PJ" value={stats.matches} />
        <StatItem label="Goles" value={stats.goals} />
        <StatItem label="Asist." value={stats.assists} />
        <StatItem label="🟨" value={stats.yellowCards} />
        <StatItem label="🟥" value={stats.redCards} />
      </View>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.h2,
    color: colors.textInverse,
  },
  team: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  positionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  positionText: {
    ...typography.small,
    color: colors.textInverse,
  },
  number: {
    ...typography.h3,
    color: colors.textInverse,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...typography.stat,
    color: colors.textInverse,
  },
  statLabel: {
    ...typography.small,
    color: 'rgba(255,255,255,0.8)',
  },
});
