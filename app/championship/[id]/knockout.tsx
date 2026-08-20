import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar, TeamLogo } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { useGroups } from '@/hooks/useGroups';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import {
  useClearKnockoutBracket,
  useGenerateKnockoutBracket,
  useKnockoutMatches,
} from '@/hooks/useKnockout';
import { confirmAction } from '@/lib/confirm';
import type { KnockoutMatch } from '@/api/knockout';
import { colors, spacing, typography } from '@/theme';

export default function KnockoutStageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championshipId = id as string;
  const championship = useChampionship(id);
  const teams = useTeams(id);
  const groups = useGroups(id);
  const { isManager } = useChampionshipRole(id);
  const knockoutMatches = useKnockoutMatches(id);

  const generateBracket = useGenerateKnockoutBracket(championshipId);
  const clearBracket = useClearKnockoutBracket(championshipId);

  const teamsById = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t])), [teams.data]);

  const rounds = useMemo(() => {
    const map = new Map<string, KnockoutMatch[]>();
    for (const m of knockoutMatches.data ?? []) {
      const key = m.bracket_round ?? 'Fase eliminatoria';
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [knockoutMatches.data]);

  if (!championship.data) return <LoadingState rows={4} />;

  const usesGroups = championship.data.competition_system === 'groups_playoffs';
  const hasBracket = (knockoutMatches.data?.length ?? 0) > 0;

  const handleGenerate = () => {
    if (!groups.data) return;
    void generateBracket.mutateAsync(groups.data);
  };

  const handleRegenerate = () => {
    confirmAction(
      'Regenerar fase eliminatoria',
      'Esto eliminará el cuadro actual (cruces y resultados de eliminatoria) y lo vuelve a generar con la tabla de grupos actual. ¿Continuar?',
      'Regenerar',
      () => {
        void (async () => {
          await clearBracket.mutateAsync();
          if (groups.data) await generateBracket.mutateAsync(groups.data);
        })();
      },
      { destructive: true }
    );
  };

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="final" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={typography.h2}>Fase eliminatoria</Text>
          {isManager && hasBracket ? (
            <Button label="Regenerar" variant="outline" size="sm" onPress={handleRegenerate} />
          ) : null}
        </View>

        {!usesGroups ? (
          <EmptyState
            icon="trophy-outline"
            title="Este campeonato no tiene fase eliminatoria"
            description="La fase eliminatoria automática solo está disponible para campeonatos con sistema 'Grupos + playoffs'."
          />
        ) : knockoutMatches.isLoading ? (
          <LoadingState rows={3} />
        ) : hasBracket ? (
          <View style={styles.list}>
            {rounds.map(([roundName, matches]) => (
              <View key={roundName} style={styles.roundSection}>
                <Text style={typography.bodyBold}>{roundName}</Text>
                {matches.map((m) => (
                  <BracketMatchRow
                    key={m.id}
                    match={m}
                    homeTeam={m.home_team_id ? teamsById.get(m.home_team_id) : undefined}
                    awayTeam={m.away_team_id ? teamsById.get(m.away_team_id) : undefined}
                    onPress={
                      m.home_team_id && m.away_team_id ? () => router.push(`/match/${m.id}`) : undefined
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        ) : isManager ? (
          <EmptyState
            icon="trophy-outline"
            title="Genera la fase eliminatoria"
            description="Clasifican los 2 primeros de cada grupo. Se arma el cuadro de eliminación directa (cuartos/semis/final según corresponda) automáticamente a partir de la tabla de grupos actual."
            actionLabel="Generar fase eliminatoria"
            onAction={handleGenerate}
          />
        ) : (
          <EmptyState icon="trophy-outline" title="La fase eliminatoria aún no se generó" />
        )}
      </ScrollView>
    </View>
  );
}

interface BracketMatchRowProps {
  match: KnockoutMatch;
  homeTeam?: { name: string; short_name: string | null; logo_url: string | null; primary_color: string | null };
  awayTeam?: { name: string; short_name: string | null; logo_url: string | null; primary_color: string | null };
  onPress?: () => void;
}

function BracketMatchRow({ match, homeTeam, awayTeam, onPress }: BracketMatchRowProps) {
  const hasScore = match.status === 'finished' && match.home_score !== null && match.away_score !== null;
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card style={styles.matchCard}>
        <View style={styles.matchTeam}>
          <TeamLogo
            name={homeTeam?.name ?? 'Por definir'}
            logoUrl={homeTeam?.logo_url}
            primaryColor={homeTeam?.primary_color}
            size={28}
          />
          <Text style={[typography.body, !homeTeam && styles.tbd]} numberOfLines={1}>
            {homeTeam?.short_name || homeTeam?.name || 'Por definir'}
          </Text>
        </View>
        {hasScore ? (
          <Text style={styles.score}>
            {match.home_score} - {match.away_score}
          </Text>
        ) : (
          <Badge label={match.status === 'live' ? 'LIVE' : 'vs'} tone={match.status === 'live' ? 'live' : 'neutral'} />
        )}
        <View style={[styles.matchTeam, styles.matchTeamRight]}>
          <Text style={[typography.body, !awayTeam && styles.tbd]} numberOfLines={1}>
            {awayTeam?.short_name || awayTeam?.name || 'Por definir'}
          </Text>
          <TeamLogo
            name={awayTeam?.name ?? 'Por definir'}
            logoUrl={awayTeam?.logo_url}
            primaryColor={awayTeam?.primary_color}
            size={28}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: spacing.xl,
  },
  roundSection: {
    gap: spacing.md,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchTeamRight: {
    justifyContent: 'flex-end',
  },
  tbd: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  score: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
  },
});
