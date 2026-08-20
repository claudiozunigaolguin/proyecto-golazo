import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Card } from '@/components/ui';
import { TeamLogo } from './TeamLogo';
import type { Match } from '@/api/matches';
import type { Team } from '@/api/teams';
import { MATCH_STATUS_LABEL } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

interface MatchCardProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  roundName?: string;
  onPress?: () => void;
}

function statusTone(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'live' as const;
    case 'finished':
      return 'success' as const;
    case 'cancelled':
    case 'suspended':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
}

export function MatchCard({ match, homeTeam, awayTeam, roundName, onPress }: MatchCardProps) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  const scheduled = match.scheduled_at
    ? format(new Date(match.scheduled_at), "d MMM · HH:mm", { locale: es })
    : 'Sin fecha';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Badge
          label={match.status === 'live' ? 'LIVE' : MATCH_STATUS_LABEL[match.status]}
          tone={statusTone(match.status)}
        />
        <Text style={[typography.caption, styles.date]}>{roundName ?? scheduled}</Text>
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.team}>
          <TeamLogo name={homeTeam?.name ?? 'Local'} logoUrl={homeTeam?.logo_url} primaryColor={homeTeam?.primary_color} />
          <Text style={typography.bodyBold} numberOfLines={1}>
            {homeTeam?.short_name || homeTeam?.name || 'Local'}
          </Text>
        </View>

        <View style={styles.scoreBox}>
          {hasScore ? (
            <Text style={styles.score}>
              {match.home_score} - {match.away_score}
            </Text>
          ) : (
            <Text style={[typography.bodyBold, styles.vs]}>VS</Text>
          )}
        </View>

        <View style={[styles.team, styles.teamRight]}>
          <Text style={typography.bodyBold} numberOfLines={1}>
            {awayTeam?.short_name || awayTeam?.name || 'Visita'}
          </Text>
          <TeamLogo name={awayTeam?.name ?? 'Visita'} logoUrl={awayTeam?.logo_url} primaryColor={awayTeam?.primary_color} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: colors.textMuted,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamRight: {
    justifyContent: 'flex-end',
  },
  scoreBox: {
    paddingHorizontal: spacing.md,
    minWidth: 64,
    alignItems: 'center',
  },
  score: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  vs: {
    color: colors.textMuted,
  },
});
