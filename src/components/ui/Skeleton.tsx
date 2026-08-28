import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useColors, radius, spacing, type ColorPalette } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, { width, height, opacity }, style]}
    />
  );
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={64} style={styles.row} />
      ))}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    base: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
    },
    container: {
      gap: spacing.md,
    },
    row: {
      borderRadius: radius.lg,
    },
  });
