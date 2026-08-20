import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography } from '@/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: string;
}

export function StatCard({ label, value, icon, tone = colors.primary }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {icon ? <Ionicons name={icon} size={16} color={tone} /> : null}
        <Text style={[typography.caption, styles.label]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[typography.stat, { color: tone }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
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
