import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, SegmentedOptions } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar } from '@/components/golazo';
import { useChampionship, useDeleteChampionship, useUpdateChampionship } from '@/hooks/useChampionships';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { confirmAction } from '@/lib/confirm';
import { CHAMPIONSHIP_STATUS_LABEL, type ChampionshipStatus } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const STATUS_OPTIONS: { value: ChampionshipStatus; label: string }[] = (
  Object.keys(CHAMPIONSHIP_STATUS_LABEL) as ChampionshipStatus[]
).map((value) => ({ value, label: CHAMPIONSHIP_STATUS_LABEL[value] }));

interface AdminActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
}

function AdminAction({ icon, label, description, onPress, danger }: AdminActionProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.actionCard}>
        <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
          <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
        </View>
        <View style={styles.actionInfo}>
          <Text style={[typography.bodyBold, danger && { color: colors.danger }]}>{label}</Text>
          {description ? (
            <Text style={[typography.caption, styles.muted]}>{description}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

export default function ChampionshipAdminScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const { isManager, isLoading: roleLoading } = useChampionshipRole(id);
  const deleteChampionship = useDeleteChampionship();
  const updateChampionship = useUpdateChampionship(id as string);

  if (!championship.data || roleLoading) return <LoadingState rows={5} />;

  if (!isManager) {
    return (
      <View style={styles.flex}>
        <ChampionshipHeader championship={championship.data} />
        <View style={styles.deniedContainer}>
          <Text style={typography.h3}>Solo administradores</Text>
          <Text style={[typography.body, styles.muted]}>
            No tienes permisos para administrar este campeonato.
          </Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    confirmAction(
      'Eliminar campeonato',
      `Esta acción eliminará "${championship.data!.name}" y todos sus equipos, jugadores y partidos de forma permanente. ¿Estás seguro?`,
      'Eliminar',
      () => {
        void (async () => {
          await deleteChampionship.mutateAsync(championship.data!.id);
          router.replace('/(tabs)/championships');
        })();
      },
      { destructive: true }
    );
  };

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="resumen" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Panel administrativo</Text>

        <View style={styles.section}>
          <Text style={typography.h3}>Estado del campeonato</Text>
          <SegmentedOptions
            options={STATUS_OPTIONS}
            value={championship.data.status}
            onChange={(status) => void updateChampionship.mutateAsync({ status })}
          />
        </View>

        <View style={styles.section}>
          <AdminAction
            icon="create-outline"
            label="Editar campeonato"
            description="Nombre, fechas, configuración y puntuación"
            onPress={() => router.push(`/championship/${championship.data!.id}/edit`)}
          />
          <AdminAction
            icon="people-outline"
            label="Equipos"
            description="Agregar o editar equipos"
            onPress={() => router.push(`/championship/${championship.data!.id}/teams`)}
          />
          <AdminAction
            icon="person-add-outline"
            label="Jugadores"
            description="Agregar o editar jugadores"
            onPress={() => router.push(`/championship/${championship.data!.id}/players`)}
          />
          <AdminAction
            icon="shuffle-outline"
            label="Fixture"
            description="Generar o regenerar el calendario de partidos"
            onPress={() => router.push(`/championship/${championship.data!.id}/fixture`)}
          />
          <AdminAction
            icon="football-outline"
            label="Partidos y resultados"
            description="Registrar resultados, goles, asistencias y tarjetas"
            onPress={() => router.push(`/championship/${championship.data!.id}/matches`)}
          />
          <AdminAction
            icon="trophy-outline"
            label="Fase eliminatoria"
            description="Generar el cuadro de playoffs desde la tabla de grupos"
            onPress={() => router.push(`/championship/${championship.data!.id}/knockout`)}
          />
          <AdminAction
            icon="people-circle-outline"
            label="Administradores"
            description="Da acceso a otros usuarios para administrar este campeonato"
            onPress={() => router.push(`/championship/${championship.data!.id}/members`)}
          />
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Eliminar campeonato</Text>
          {championship.data.delete_locked ? (
            <Text style={[typography.caption, styles.muted]}>
              Este es tu campeonato del plan gratuito y no se puede eliminar (evita reciclar el
              cupo). Mejora tu plan para crear campeonatos adicionales.
            </Text>
          ) : (
            <AdminAction
              icon="trash-outline"
              label="Eliminar campeonato"
              description="Acción permanente, no se puede deshacer"
              onPress={handleDelete}
              danger
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    gap: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDanger: {
    backgroundColor: '#FCE8E8',
  },
  actionInfo: {
    flex: 1,
    gap: 2,
  },
  muted: {
    color: colors.textSecondary,
  },
  deniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
});
