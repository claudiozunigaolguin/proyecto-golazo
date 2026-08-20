import { useEffect, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { useChampionship, useUpdateChampionship } from '@/hooks/useChampionships';
import { colors, spacing, typography } from '@/theme';

export default function EditChampionshipScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championship = useChampionship(id);
  const updateChampionship = useUpdateChampionship(id as string);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [season, setSeason] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [pointsWin, setPointsWin] = useState('3');
  const [pointsDraw, setPointsDraw] = useState('1');
  const [pointsLoss, setPointsLoss] = useState('0');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!championship.data) return;
    setName(championship.data.name);
    setShortName(championship.data.short_name ?? '');
    setSeason(championship.data.season ?? '');
    setDescription(championship.data.description ?? '');
    setLocation(championship.data.location ?? '');
    setPointsWin(String(championship.data.points_win));
    setPointsDraw(String(championship.data.points_draw));
    setPointsLoss(String(championship.data.points_loss));
    setIsPublic(championship.data.is_public);
  }, [championship.data]);

  if (!championship.data) return <LoadingState rows={4} />;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError(null);
    try {
      await updateChampionship.mutateAsync({
        name,
        short_name: shortName || null,
        season: season || null,
        description: description || null,
        location: location || null,
        points_win: Number(pointsWin) || 0,
        points_draw: Number(pointsDraw) || 0,
        points_loss: Number(pointsLoss) || 0,
        is_public: isPublic,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar los cambios');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Editar campeonato' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <TextField label="Nombre" value={name} onChangeText={setName} />
        <TextField label="Nombre corto" value={shortName} onChangeText={setShortName} />
        <TextField label="Temporada" value={season} onChangeText={setSeason} />
        <TextField label="Descripción" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        <TextField label="Ubicación" value={location} onChangeText={setLocation} />

        <Text style={typography.h3}>Puntuación</Text>
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

        <View style={styles.switchRow}>
          <Text style={typography.bodyBold}>Campeonato público</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.primary }} />
        </View>

        {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

        <Button label="Guardar cambios" onPress={handleSave} loading={updateChampionship.isPending} fullWidth />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  error: {
    color: colors.danger,
  },
});
