import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TeamLogo } from './TeamLogo';
import type { StandingRow } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

interface StandingTableProps {
  rows: StandingRow[];
  onTeamPress?: (teamId: string) => void;
  /** Filas que clasifican (se resaltan con acento verde), ej. 2 = clasifican a fase eliminatoria. */
  qualifyCount?: number;
}

const COL_WIDTH = 32;

export function StandingTable({ rows, onTeamPress, qualifyCount = 0 }: StandingTableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.pos, styles.headerText]}>#</Text>
          <Text style={[styles.teamCol, styles.headerText]}>EQUIPO</Text>
          {['PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS'].map((h) => (
            <Text key={h} style={[styles.col, styles.headerText]}>
              {h}
            </Text>
          ))}
        </View>

        {rows.map((row, index) => {
          const qualifies = qualifyCount > 0 && index < qualifyCount;
          return (
          <Pressable
            key={row.team_id}
            onPress={onTeamPress ? () => onTeamPress(row.team_id) : undefined}
            style={[
              styles.row,
              index % 2 === 1 && { backgroundColor: colors.surface },
              qualifies && styles.qualifyRow,
            ]}
          >
            <Text style={[styles.pos, typography.caption, qualifies && styles.qualifyPos]}>{index + 1}</Text>
            <View style={styles.teamCol}>
              <View style={styles.teamCell}>
                <TeamLogo
                  name={row.team_name}
                  logoUrl={row.team_logo_url}
                  size={22}
                />
                <Text style={typography.bodyBold} numberOfLines={1}>
                  {row.team_short_name || row.team_name}
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
          );
        })}
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
  qualifyRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  qualifyPos: {
    color: colors.primary,
    fontWeight: '800',
  },
  headerText: {
    ...typography.small,
    color: colors.textMuted,
  },
  pos: {
    width: 24,
    textAlign: 'center',
  },
  teamCol: {
    width: 160,
    paddingLeft: spacing.sm,
  },
  teamCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  col: {
    width: COL_WIDTH,
    textAlign: 'center',
  },
});
