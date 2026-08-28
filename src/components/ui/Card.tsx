import { useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useColors, radius, spacing, type ColorPalette } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, style, onPress, padded = true }: CardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const content = (
    <View style={[styles.base, padded && styles.padded, style]}>{children}</View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      {content}
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    base: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0B2A17',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 1,
    },
    padded: {
      padding: spacing.lg,
    },
  });
