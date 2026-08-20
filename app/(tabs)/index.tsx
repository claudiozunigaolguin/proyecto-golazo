import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, EmptyState } from '@/components/ui';
import { Logo, TournamentCard } from '@/components/golazo';
import { LoadingState } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useMyChampionships, usePublicChampionships } from '@/hooks/useChampionships';
import { colors, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);

  const myChampionships = useMyChampionships(userId);
  const publicChampionships = usePublicChampionships(6);

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : '';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={myChampionships.isFetching}
          onRefresh={() => {
            void myChampionships.refetch();
            void publicChampionships.refetch();
          }}
        />
      }
    >
      <View style={styles.header}>
        <Logo size="md" />
        <Avatar uri={profile?.avatar_url} name={fullName || 'Usuario'} size={40} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={typography.h2}>Mis campeonatos</Text>
        </View>

        {myChampionships.isLoading ? (
          <LoadingState rows={2} />
        ) : myChampionships.data && myChampionships.data.length > 0 ? (
          <View style={styles.list}>
            {myChampionships.data.map((champ) => (
              <TournamentCard
                key={champ.id}
                championship={champ}
                onPress={() => router.push(`/championship/${champ.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="trophy-outline"
            title="Todavía no tienes campeonatos"
            description="Crea tu primer campeonato de Fútbol 6 y empieza a organizar tu liga."
          />
        )}

        <Button
          label="+ Crear campeonato"
          onPress={() => router.push('/championship/create')}
          fullWidth
          style={styles.createButton}
        />
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Campeonatos destacados</Text>
        <Text style={[typography.caption, styles.sectionSubtitle]}>
          El campeonato está que arde 🔥
        </Text>

        {publicChampionships.isLoading ? (
          <LoadingState rows={2} />
        ) : publicChampionships.data && publicChampionships.data.length > 0 ? (
          <View style={styles.list}>
            {publicChampionships.data.map((champ) => (
              <TournamentCard
                key={champ.id}
                championship={champ}
                onPress={() => router.push(`/public/${champ.slug}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="megaphone-outline" title="Aún no hay campeonatos públicos" />
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  createButton: {
    marginTop: spacing.xs,
  },
});
