import { useMemo } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { LoadingState } from '@/components/ui/Skeleton';
import { ShareCardGenerator } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useGroups } from '@/hooks/useGroups';
import { useStandings, useClubStandings, useTeamCards } from '@/hooks/useStats';
import type { ShareCardData, ShareCardRow } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

export default function ShareCardScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId?: string }>();
  const championshipId = id as string;
  const isClub = groupId === 'club';

  const championship = useChampionship(id);
  const groups = useGroups(id);
  const standings = useStandings(isClub ? undefined : championshipId, isClub ? undefined : groupId);
  const clubStandings = useClubStandings(isClub ? championshipId : undefined);
  const teamCards = useTeamCards(championshipId);

  const cardsByTeamId = useMemo(
    () => new Map((teamCards.data ?? []).map((c) => [c.team_id, c])),
    [teamCards.data]
  );

  const title = isClub
    ? 'Tabla general'
    : (groups.data ?? []).find((g) => g.id === groupId)?.name || 'Tabla de posiciones';

  const cardData: ShareCardData | null = useMemo(() => {
    if (!championship.data) return null;

    if (isClub) {
      if (!clubStandings.data) return null;
      const rows: ShareCardRow[] = clubStandings.data.map((r) => ({
        id: r.club_id,
        name: r.club_name,
        shortName: r.club_short_name,
        logoUrl: r.club_logo_url,
        played: r.played,
        points: r.points,
        goalsFor: r.goals_for,
        goalsAgainst: r.goals_against,
        goalDifference: r.goal_difference,
        yellowCards: 0,
        redCards: 0,
      }));
      return {
        championshipName: championship.data.name,
        championshipLogoUrl: championship.data.logo_url,
        title,
        rows,
        generatedAt: new Date().toLocaleDateString('es-CL'),
      };
    }

    if (!standings.data) return null;
    const rows: ShareCardRow[] = standings.data.map((r) => {
      const cards = cardsByTeamId.get(r.team_id);
      return {
        id: r.team_id,
        name: r.team_name,
        shortName: r.team_short_name,
        logoUrl: r.team_logo_url,
        played: r.played,
        points: r.points,
        goalsFor: r.goals_for,
        goalsAgainst: r.goals_against,
        goalDifference: r.goal_difference,
        yellowCards: cards?.yellow_cards ?? 0,
        redCards: cards?.red_cards ?? 0,
      };
    });
    return {
      championshipName: championship.data.name,
      championshipLogoUrl: championship.data.logo_url,
      title,
      rows,
      generatedAt: new Date().toLocaleDateString('es-CL'),
    };
  }, [championship.data, isClub, clubStandings.data, standings.data, cardsByTeamId, title]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Generar imagen' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Text style={typography.h2}>{title}</Text>
        {cardData ? (
          <ShareCardGenerator data={cardData} />
        ) : (
          <LoadingState rows={4} />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
});
