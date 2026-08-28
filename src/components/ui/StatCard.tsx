import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useColors, spacing, typography, type ColorPalette } from '@/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: string;
}

export function StatCard({ label, value, icon, tone }: StatCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeTone = tone ?? colors.primary;
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {icon ? <Ionicons name={icon} size={16} color={activeTone} /> : null}
        <Text style={[typography.caption, styles.label]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[typography.stat, { color: activeTone }]}>{value}</Text>
    </Card>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      flex: 1,
      gap: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    label: {
      color: colors.textSecondary,
      flexShrink: 1,
    },
  });
