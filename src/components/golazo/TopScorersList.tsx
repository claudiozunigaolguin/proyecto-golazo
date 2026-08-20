import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Card, EmptyState } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export interface RankingRow {
  id: string;
  name: string;
  teamName: string;
  photoUrl?: string | null;
  value: string | number;
  meta?: string;
}

interface TopScorersListProps {
  rows: RankingRow[];
  emptyTitle: string;
  emptyDescription?: string;
}

const MEDAL_COLORS = ['#F5C518', '#C0C0C0', '#CD7F32'];

export function TopScorersList({ rows, emptyTitle, emptyDescription }: TopScorersListProps) {
  if (rows.length === 0) {
    return <EmptyState icon="trophy-outline" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Card style={styles.card}>
      {rows.map((row, index) => (
        <View key={row.id} style={[styles.row, index > 0 && styles.rowBorder]}>
          <View style={[styles.rank, index < 3 && { backgroundColor: MEDAL_COLORS[index] }]}>
            <Text style={[typography.bodyBold, index >= 3 && { color: colors.textSecondary }]}>
              {index + 1}
            </Text>
          </View>
          <Avatar uri={row.photoUrl} name={row.name} size={36} />
          <View style={styles.info}>
            <Text style={typography.bodyBold} numberOfLines={1}>
              {row.name}
            </Text>
            <Text style={[typography.caption, styles.team]} numberOfLines={1}>
              {row.teamName}
              {row.meta ? ` · ${row.meta}` : ''}
            </Text>
          </View>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  info: {
    flex: 1,
  },
  team: {
    color: colors.textMuted,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
});
