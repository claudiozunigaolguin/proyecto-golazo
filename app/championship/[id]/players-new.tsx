import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, SegmentedOptions, TextField } from '@/components/ui';
import { useTeams } from '@/hooks/useTeams';
import { useCreatePlayer } from '@/hooks/usePlayers';
import { playerSchema } from '@/lib/validations';
import { pickImage } from '@/lib/storage';
import type { ImagePickerAsset } from 'expo-image-picker';
import { PLAYER_POSITION_LABEL, type PlayerPosition } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const POSITION_OPTIONS: { value: PlayerPosition; label: string }[] = (
  Object.keys(PLAYER_POSITION_LABEL) as PlayerPosition[]
).map((value) => ({ value, label: PLAYER_POSITION_LABEL[value] }));

export default function CreatePlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championshipId = id as string;
  const teams = useTeams(id);

  const [teamId, setTeamId] = useState<string>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('mid');
  const [rut, setRut] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoAsset, setPhotoAsset] = useState<ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedTeamId = teamId || teams.data?.[0]?.id || '';
  const createPlayer = useCreatePlayer(selectedTeamId, championshipId);

  const handlePickPhoto = async () => {
    try {
      const asset = await pickImage();
      if (asset) setPhotoAsset(asset);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos abrir la galería');
    }
  };

  const handleSubmit = async () => {
    if (!selectedTeamId) {
      setError('Selecciona un equipo');
      return;
    }
    const parsed = playerSchema.safeParse({
      firstName,
      lastName,
      jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
      position,
      rut: rut || undefined,
      birthDate: birthDate || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos del jugador');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createPlayer.mutateAsync({ input: parsed.data, photoAsset });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos agregar al jugador');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Nuevo jugador' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Pressable onPress={() => void handlePickPhoto()} style={styles.photoPicker}>
          {photoAsset ? (
            <Image source={{ uri: photoAsset.uri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <View style={[styles.photoPreview, styles.photoPlaceholder]}>
              <Ionicons name="person-outline" size={28} color={colors.primary} />
            </View>
          )}
          <Text style={[typography.caption, styles.photoLabel]}>
            {photoAsset ? 'Cambiar foto' : 'Agregar foto (opcional)'}
          </Text>
        </Pressable>

        <Text style={typography.caption}>Equipo</Text>
        <SegmentedOptions
          options={(teams.data ?? []).map((t) => ({ value: t.id, label: t.short_name || t.name }))}
          value={selectedTeamId}
          onChange={setTeamId}
        />

        <TextField label="Nombre" value={firstName} onChangeText={setFirstName} />
        <TextField label="Apellido" value={lastName} onChangeText={setLastName} />
        <TextField
          label="Número de camiseta"
          value={jerseyNumber}
          onChangeText={setJerseyNumber}
          keyboardType="number-pad"
        />
        <TextField
          label="RUT (opcional)"
          value={rut}
          onChangeText={setRut}
          placeholder="12.345.678-9"
        />
        <Text style={[typography.caption, styles.notice]}>
          Si el RUT ya está registrado, se reutiliza la ficha existente del jugador en vez de
          crear una nueva.
        </Text>
        <TextField
          label="Fecha de nacimiento (opcional)"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="AAAA-MM-DD"
        />

        <Text style={typography.caption}>Posición</Text>
        <SegmentedOptions options={POSITION_OPTIONS} value={position} onChange={setPosition} />

        {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

        <Button label="Agregar jugador" onPress={handleSubmit} loading={submitting} fullWidth />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  photoPicker: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  photoPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
  },
  notice: {
    color: colors.textSecondary,
  },
});
