import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { Logo, MatchCard, StandingTable, TeamLogo, TopScorersList } from '@/components/golazo';
import { useChampionshipBySlug } from '@/hooks/useChampionships';
import { useTeams } from '@/hooks/useTeams';
import { useMatches } from '@/hooks/useMatches';
import { useStandings, useGroupStandingsList, useTopScorers } from '@/hooks/useStats';
import { useGroups } from '@/hooks/useGroups';
import { copyToClipboard, getPublicChampionshipUrl, shareText } from '@/lib/share';
import { CHAMPIONSHIP_STATUS_LABEL } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

export default function PublicChampionshipScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const championship = useChampionshipBySlug(slug);
  const championshipId = championship.data?.id;

  const teams = useTeams(championshipId);
  const matches = useMatches(championshipId);
  const groups = useGroups(championshipId);
  const hasGroups = (groups.data?.length ?? 0) > 0;
  const standings = useStandings(hasGroups ? undefined : championshipId);
  const groupStandingsResults = useGroupStandingsList(championshipId, groups.data ?? []);
  const topScorers = useTopScorers(championshipId, 5);

  const [copied, setCopied] = useState(false);

  const teamsById = useMemo(() => new Map((teams.data ?? []).map((t) => [t.id, t])), [teams.data]);
  const recentResults = useMemo(
    () => (matches.data ?? []).filter((m) => m.status === 'finished').slice(-3).reverse(),
    [matches.data]
  );
  const upcoming = useMemo(
    () => (matches.data ?? []).filter((m) => m.status === 'scheduled').slice(0, 3),
    [matches.data]
  );

  if (championship.isLoading) {
    return (
      <View style={styles.flex}>
        <LoadingState rows={5} />
      </View>
    );
  }

  if (!championship.data) {
    return (
      <View style={styles.flex}>
        <EmptyState
          icon="alert-circle-outline"
          title="Campeonato no encontrado"
          description="El enlace puede estar mal escrito o el campeonato ya no es público."
          actionLabel="Ir a PENTAGOLAZO"
          onAction={() => router.replace('/')}
        />
      </View>
    );
  }

  const champ = championship.data;
  const publicUrl = getPublicChampionshipUrl(champ.slug);

  const handleShare = () =>
    void shareText(`⚽ ${champ.name}\n¡El campeonato está que arde! 🔥\n${publicUrl}`, champ.name);

  const handleCopy = async () => {
    await copyToClipboard(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.brandRow}>
        <Logo size="sm" />
      </View>

      <View style={styles.header}>
        <TeamLogo name={champ.name} logoUrl={champ.logo_url} size={80} />
        <Text style={typography.h1}>{champ.name}</Text>
        <Text style={[typography.body, styles.muted]}>{champ.season}</Text>
        <Badge
          label={champ.status === 'ongoing' ? 'EN CURSO' : CHAMPIONSHIP_STATUS_LABEL[champ.status]}
          tone={champ.status === 'ongoing' ? 'live' : 'primary'}
        />
      </View>

      <Card style={styles.shareCard}>
        <Text style={typography.h3}>Compartir campeonato</Text>
        <View style={styles.shareButtons}>
          <Button label="Compartir" onPress={handleShare} size="sm" />
          <Button label={copied ? '¡Copiado!' : 'Copiar enlace'} variant="secondary" size="sm" onPress={() => void handleCopy()} />
        </View>
        <View style={styles.qrWrap}>
          <QRCode value={publicUrl} size={120} color={colors.textPrimary} backgroundColor={colors.background} />
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={typography.h3}>Así va la tabla</Text>
        {hasGroups ? (
          <View style={styles.list}>
            {(groups.data ?? []).map((group, index) => {
              const rows = groupStandingsResults[index]?.data ?? [];
              return (
                <View key={group.id} style={styles.groupSection}>
                  <Text style={typography.bodyBold}>{group.name}</Text>
                  {rows.length > 0 ? (
                    <StandingTable rows={rows} />
                  ) : (
                    <Text style={[typography.caption, styles.muted]}>Sin datos todavía</Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : standings.data && standings.data.length > 0 ? (
          <StandingTable rows={standings.data} />
        ) : (
          <Text style={[typography.caption, styles.muted]}>Sin datos todavía</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h3}>Últimos resultados</Text>
        {recentResults.length > 0 ? (
          <View style={styles.list}>
            {recentResults.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={teamsById.get(m.home_team_id ?? '')} awayTeam={teamsById.get(m.away_team_id ?? '')} />
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, styles.muted]}>Aún no hay resultados</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h3}>Próxima fecha</Text>
        {upcoming.length > 0 ? (
          <View style={styles.list}>
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} homeTeam={teamsById.get(m.home_team_id ?? '')} awayTeam={teamsById.get(m.away_team_id ?? '')} />
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, styles.muted]}>Sin partidos programados</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h3}>Los máximos goleadores</Text>
        <TopScorersList
          rows={(topScorers.data ?? []).map((s) => ({
            id: s.player_id,
            name: `${s.first_name} ${s.last_name}`,
            teamName: s.team_name,
            photoUrl: s.photo_url,
            value: s.goals,
          }))}
          emptyTitle="Sin goles registrados"
        />
      </View>

      <View style={styles.section}>
        <Text style={typography.h3}>Equipos</Text>
        <View style={styles.teamsGrid}>
          {(teams.data ?? []).map((t) => (
            <View key={t.id} style={styles.teamChip}>
              <TeamLogo name={t.name} logoUrl={t.logo_url} primaryColor={t.primary_color} size={28} />
              <Text style={typography.caption} numberOfLines={1}>
                {t.short_name || t.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  brandRow: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  muted: {
    color: colors.textSecondary,
  },
  shareCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qrWrap: {
    padding: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.xl,
  },
  groupSection: {
    gap: spacing.md,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
