import { StyleSheet, Text, View } from 'react-native';
import type { MatchEventType } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

interface EventItemProps {
  type: MatchEventType;
  minute?: number | null;
  playerName?: string;
  relatedPlayerName?: string | null;
  teamName?: string;
}

const EVENT_ICON: Record<MatchEventType, string> = {
  goal: '⚽',
  assist: '🅰️',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  match_start: '⏱️',
  match_end: '⏱️',
};

const EVENT_LABEL: Record<MatchEventType, string> = {
  goal: 'Gol',
  assist: 'Asistencia',
  yellow_card: 'Tarjeta amarilla',
  red_card: 'Tarjeta roja',
  substitution: 'Cambio',
  match_start: 'Inicio del partido',
  match_end: 'Final del partido',
};

export function EventItem({ type, minute, playerName, relatedPlayerName, teamName }: EventItemProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{EVENT_ICON[type]}</Text>
      <View style={styles.info}>
        <Text style={typography.bodyBold}>
          {minute != null ? `${minute}' ` : ''}
          {playerName ?? EVENT_LABEL[type]}
        </Text>
        <Text style={[typography.caption, styles.meta]}>
          {type === 'substitution' && relatedPlayerName
            ? `Entra por ${relatedPlayerName}`
            : teamName ?? EVENT_LABEL[type]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  info: {
    flex: 1,
  },
  meta: {
    color: colors.textMuted,
  },
});
