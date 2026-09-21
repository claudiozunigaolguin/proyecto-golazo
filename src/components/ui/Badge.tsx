import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useColors, radius, spacing, typography, type ColorPalette } from '@/theme';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'live';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

function toneColors(colors: ColorPalette): Record<Tone, { bg: string; text: string }> {
  return {
    primary: { bg: colors.primaryLight, text: colors.primary },
    success: { bg: colors.primaryLight, text: colors.success },
    warning: { bg: '#FFF4E0', text: colors.warning },
    danger: { bg: '#FCE8E8', text: colors.danger },
    neutral: { bg: colors.surfaceAlt, text: colors.textSecondary },
    live: { bg: colors.live, text: colors.textInverse },
  };
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const c = toneColors(colors)[tone];
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (tone !== 'live') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tone, pulse]);

  return (
    <View style={[styles.base, { backgroundColor: c.bg }]}>
      {tone === 'live' && <Animated.View style={[styles.dot, { opacity: pulse }]} />}
      <Text style={[typography.small, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
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
