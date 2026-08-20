import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Card } from '@/components/ui';
import { TeamLogo } from './TeamLogo';
import type { Championship } from '@/api/championships';
import { CHAMPIONSHIP_STATUS_LABEL } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

interface TournamentCardProps {
  championship: Championship;
  teamsCount?: number;
  onPress?: () => void;
}

function statusTone(status: Championship['status']) {
  switch (status) {
    case 'ongoing':
      return 'live' as const;
    case 'finished':
      return 'neutral' as const;
    default:
      return 'primary' as const;
  }
}

export function TournamentCard({ championship, teamsCount, onPress }: TournamentCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <TeamLogo name={championship.name} logoUrl={championship.logo_url} size={44} />
        <View style={styles.headerText}>
          <Text style={typography.h3} numberOfLines={1}>
            {championship.name}
          </Text>
          <Text style={[typography.caption, styles.season]} numberOfLines={1}>
            {championship.season ?? 'Sin temporada'}
          </Text>
        </View>
        <Badge
          label={championship.status === 'ongoing' ? 'EN CURSO' : CHAMPIONSHIP_STATUS_LABEL[championship.status]}
          tone={statusTone(championship.status)}
        />
      </View>

      {teamsCount != null ? (
        <View style={styles.footer}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={typography.caption}>{teamsCount} equipos</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  season: {
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
