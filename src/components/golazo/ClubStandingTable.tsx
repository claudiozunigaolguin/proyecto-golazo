import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TeamLogo } from './TeamLogo';
import type { ClubStandingRow } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

interface ClubStandingTableProps {
  rows: ClubStandingRow[];
  onClubPress?: (clubId: string) => void;
}

const COL_WIDTH = 32;

/** Tabla general de una "Liga con series": puntos combinados de las 4 series de cada club. */
export function ClubStandingTable({ rows, onClubPress }: ClubStandingTableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.pos, styles.headerText]}>#</Text>
          <Text style={[styles.clubCol, styles.headerText]}>CLUB</Text>
          {['PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS'].map((h) => (
            <Text key={h} style={[styles.col, styles.headerText]}>
              {h}
            </Text>
          ))}
        </View>

        {rows.map((row, index) => (
          <Pressable
            key={row.club_id}
            onPress={onClubPress ? () => onClubPress(row.club_id) : undefined}
            style={[styles.row, index % 2 === 1 && { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.pos, typography.caption]}>{index + 1}</Text>
            <View style={styles.clubCol}>
              <View style={styles.clubCell}>
                <TeamLogo name={row.club_name} logoUrl={row.club_logo_url} size={22} />
                <Text style={typography.bodyBold} numberOfLines={1}>
                  {row.club_short_name || row.club_name}
                </Text>
              </View>
            </View>
            <Text style={[styles.col, typography.body]}>{row.played}</Text>
            <Text style={[styles.col, typography.body]}>{row.won}</Text>
            <Text style={[styles.col, typography.body]}>{row.drawn}</Text>
            <Text style={[styles.col, typography.body]}>{row.lost}</Text>
            <Text style={[styles.col, typography.body]}>{row.goals_for}</Text>
            <Text style={[styles.col, typography.body]}>{row.goals_against}</Text>
            <Text style={[styles.col, typography.body]}>
              {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
            </Text>
            <Text style={[styles.col, typography.bodyBold, { color: colors.primary }]}>
              {row.points}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    ...typography.small,
    color: colors.textMuted,
  },
  pos: {
    width: 24,
    textAlign: 'center',
  },
  clubCol: {
    width: 160,
    paddingLeft: spacing.sm,
  },
  clubCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  col: {
    width: COL_WIDTH,
    textAlign: 'center',
  },
});
