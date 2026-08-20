import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type ChampionshipTabKey =
  | 'resumen'
  | 'partidos'
  | 'tabla'
  | 'equipos'
  | 'jugadores'
  | 'goleadores'
  | 'asistencias'
  | 'tarjetas'
  | 'estadisticas'
  | 'fixture'
  | 'final';

const TABS: { key: ChampionshipTabKey; label: string; path: string }[] = [
  { key: 'resumen', label: 'Resumen', path: '' },
  { key: 'partidos', label: 'Partidos', path: '/matches' },
  { key: 'tabla', label: 'Tabla', path: '/table' },
  { key: 'equipos', label: 'Equipos', path: '/teams' },
  { key: 'jugadores', label: 'Jugadores', path: '/players' },
  { key: 'goleadores', label: 'Goleadores', path: '/scorers' },
  { key: 'asistencias', label: 'Asistencias', path: '/assists' },
  { key: 'tarjetas', label: 'Tarjetas', path: '/cards' },
  { key: 'estadisticas', label: 'Estadísticas', path: '/stats' },
  { key: 'fixture', label: 'Fixture', path: '/fixture' },
  { key: 'final', label: 'Final', path: '/knockout' },
];

interface ChampionshipTabBarProps {
  championshipId: string;
  active: ChampionshipTabKey;
}

export function ChampionshipTabBar({ championshipId, active }: ChampionshipTabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
      contentContainerStyle={styles.content}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => router.push(`/championship/${championshipId}${tab.path}`)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[typography.caption, isActive ? styles.textActive : styles.text]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
