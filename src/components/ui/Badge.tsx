import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'live';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const TONE_COLORS: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.primaryLight, text: colors.success },
  warning: { bg: '#FFF4E0', text: colors.warning },
  danger: { bg: '#FCE8E8', text: colors.danger },
  neutral: { bg: colors.surfaceAlt, text: colors.textSecondary },
  live: { bg: colors.live, text: colors.textInverse },
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const c = TONE_COLORS[tone];
  return (
    <View style={[styles.base, { backgroundColor: c.bg }]}>
      {tone === 'live' && <View style={styles.dot} />}
      <Text style={[typography.small, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textInverse,
  },
});
