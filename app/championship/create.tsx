import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, EmptyState, SegmentedOptions, TextField } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useCreateChampionship } from '@/hooks/useChampionships';
import { useMyBillingStatus } from '@/hooks/useBilling';
import { championshipSchema } from '@/lib/validations';
import { COMPETITION_SYSTEM_LABEL, type CompetitionSystem } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const COMPETITION_OPTIONS: { value: CompetitionSystem; label: string }[] = (
  Object.keys(COMPETITION_SYSTEM_LABEL) as CompetitionSystem[]
).map((value) => ({ value, label: COMPETITION_SYSTEM_LABEL[value] }));

const TEAM_SIZE_OPTIONS = ['5', '6', '7', '8', '11'].map((v) => ({ value: v, label: `${v} jug.` }));
const GROUP_COUNT_OPTIONS = ['2', '3', '4', '6', '8'].map((v) => ({ value: v, label: `${v} grupos` }));

export default function CreateChampionshipScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const createChampionship = useCreateChampionship();
  const billing = useMyBillingStatus();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [season, setSeason] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [teamSize, setTeamSize] = useState('6');
  const [maxTeams, setMaxTeams] = useState('');
  const [competitionSystem, setCompetitionSystem] = useState<CompetitionSystem>('round_robin');
  const [groupCount, setGroupCount] = useState('4');
  const [pointsWin, setPointsWin] = useState('3');
  const [pointsDraw, setPointsDraw] = useState('1');
  const [pointsLoss, setPointsLoss] = useState('0');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userId) return;

    const parsed = championshipSchema.safeParse({
      name,
      shortName: shortName || undefined,
      season: season || undefined,
      description: description || undefined,
      location: location || undefined,
      city: city || undefined,
      country: country || undefined,
      teamSize: Number(teamSize) || 6,
      maxTeams: maxTeams ? Number(maxTeams) : undefined,
      competitionSystem,
      groupCount: competitionSystem === 'groups_playoffs' ? Number(groupCount) || undefined : undefined,
      pointsWin: Number(pointsWin) || 0,
      pointsDraw: Number(pointsDraw) || 0,
      pointsLoss: Number(pointsLoss) || 0,
      isPublic,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos del campeonato');
      return;
    }
    setError(null);

    try {
      const championship = await createChampionship.mutateAsync({ input: parsed.data, ownerId: userId });
      router.replace(`/championship/${championship.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear el campeonato');
    }
  };

  if (billing.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Crear campeonato' }} />
        <View style={styles.flex}>
          <LoadingState rows={4} />
        </View>
      </>
    );
  }

  const atLimit =
    billing.data &&
    !billing.data.isSuperAdmin &&
    billing.data.championshipLimit !== null &&
    billing.data.championshipCount >= billing.data.championshipLimit;

  if (atLimit) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Crear campeonato' }} />
        <View style={styles.flex}>
          <EmptyState
            icon="lock-closed-outline"
            title="Llegaste al límite de tu plan"
            description={`Tu plan actual permite ${billing.data!.championshipLimit} campeonato${billing.data!.championshipLimit === 1 ? '' : 's'}. Mejora tu plan para crear más.`}
            actionLabel="Ver planes"
            onAction={() => router.push('/upgrade')}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Crear campeonato' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={typography.h3}>Información general</Text>
          <TextField label="Nombre del campeonato" value={name} onChangeText={setName} placeholder="Liga Golazo 2026" />
          <TextField label="Nombre corto" value={shortName} onChangeText={setShortName} placeholder="LG26" />
          <TextField label="Temporada" value={season} onChangeText={setSeason} placeholder="2026" />
          <TextField
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <TextField label="Ubicación / complejo" value={location} onChangeText={setLocation} />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <TextField label="Ciudad" value={city} onChangeText={setCity} />
            </View>
            <View style={styles.flex1}>
              <TextField label="País" value={country} onChangeText={setCountry} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Configuración</Text>
          <Text style={typography.caption}>Modalidad: Fútbol 6</Text>

          <Text style={[typography.caption, styles.label]}>Jugadores por equipo</Text>
          <SegmentedOptions options={TEAM_SIZE_OPTIONS} value={teamSize} onChange={setTeamSize} />

          <TextField
            label="Cantidad máxima de equipos"
            value={maxTeams}
            onChangeText={setMaxTeams}
            keyboardType="number-pad"
            placeholder="8"
          />

          <Text style={[typography.caption, styles.label]}>Sistema de competición</Text>
          <SegmentedOptions
            options={COMPETITION_OPTIONS}
            value={competitionSystem}
            onChange={(value) => {
              setCompetitionSystem(value);
              if (value === 'league_series') setTeamSize('11');
            }}
          />

          {competitionSystem === 'groups_playoffs' ? (
            <>
              <Text style={[typography.caption, styles.label]}>Cantidad de grupos</Text>
              <SegmentedOptions options={GROUP_COUNT_OPTIONS} value={groupCount} onChange={setGroupCount} />
              <Text style={[typography.caption, styles.notice]}>
                Se crean los grupos (Grupo A, B, ...) y el fixture todos-contra-todos dentro de
                cada uno. La fase de playoffs posterior a los grupos aún no está implementada.
              </Text>
            </>
          ) : null}

          {competitionSystem === 'league_series' ? (
            <Text style={[typography.caption, styles.notice]}>
              Se crean 4 series fijas: Tercera, Segunda, Senior y Primera. Cada club que agregues
              jugará las 4 automáticamente, y se calcula además una tabla general que suma los
              puntos de sus 4 equipos.
            </Text>
          ) : null}

          {(competitionSystem === 'knockout' || competitionSystem === 'league_playoffs') ? (
            <Text style={[typography.caption, styles.notice]}>
              El MVP genera fixture automático solo para "Todos contra todos" y "Grupos + playoffs"
              (fase de grupos). Este sistema queda guardado en la configuración para una próxima
              versión.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={typography.h3}>Sistema de puntuación</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <TextField label="Victoria" value={pointsWin} onChangeText={setPointsWin} keyboardType="number-pad" />
            </View>
            <View style={styles.flex1}>
              <TextField label="Empate" value={pointsDraw} onChangeText={setPointsDraw} keyboardType="number-pad" />
            </View>
            <View style={styles.flex1}>
              <TextField label="Derrota" value={pointsLoss} onChangeText={setPointsLoss} keyboardType="number-pad" />
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.switchRow]}>
          <View style={styles.flex1}>
            <Text style={typography.bodyBold}>Campeonato público</Text>
            <Text style={[typography.caption, styles.muted]}>
              Visible para cualquiera en "Campeonatos destacados" y con enlace compartible
            </Text>
          </View>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.primary }} />
        </View>

        {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

        <Button
          label="Crear campeonato"
          onPress={handleSubmit}
          loading={createChampionship.isPending}
          fullWidth
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  container: {
    padding: spacing.xl,
    gap: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notice: {
    color: colors.warning,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  muted: {
    color: colors.textSecondary,
  },
  error: {
    color: colors.danger,
  },
});
