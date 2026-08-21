import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui';
import { TeamLogo } from './TeamLogo';
import type { Championship } from '@/api/championships';
import { CHAMPIONSHIP_STATUS_LABEL } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

interface ChampionshipHeaderProps {
  championship: Championship;
  onSharePress?: () => void;
}

export function ChampionshipHeader({ championship, onSharePress }: ChampionshipHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>

      <TeamLogo name={championship.name} logoUrl={championship.logo_url} size={36} />

      <View style={styles.info}>
        <Text style={typography.bodyBold} numberOfLines={1}>
          {championship.name}
        </Text>
        <Badge
          label={
            championship.status === 'ongoing' ? 'EN CURSO' : CHAMPIONSHIP_STATUS_LABEL[championship.status]
          }
          tone={championship.status === 'ongoing' ? 'live' : 'primary'}
        />
      </View>

      {onSharePress ? (
        <Pressable onPress={onSharePress} hitSlop={12}>
          <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
  },
  info: {
    flex: 1,
    gap: 4,
  },
});
