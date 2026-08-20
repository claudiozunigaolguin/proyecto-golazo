import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, SegmentedOptions, TextField } from '@/components/ui';
import { useCreateTeam, teamKeys } from '@/hooks/useTeams';
import { useGroups } from '@/hooks/useGroups';
import { updateTeam as updateTeamApi } from '@/api/teams';
import { teamSchema } from '@/lib/validations';
import { pickImage, teamLogoPath, uploadImage } from '@/lib/storage';
import type { ImagePickerAsset } from 'expo-image-picker';
import { colors, radius, spacing, typography } from '@/theme';

const COLOR_SWATCHES = ['#0B7A3B', '#E5484D', '#2E7BE0', '#F5A524', '#7C3AED', '#14181A'];

export default function CreateTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championshipId = id as string;
  const createTeam = useCreateTeam(championshipId);
  const groups = useGroups(championshipId);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [primaryColor, setPrimaryColor] = useState(COLOR_SWATCHES[0]);
  const [groupId, setGroupId] = useState('');
  const [logoAsset, setLogoAsset] = useState<ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickLogo = async () => {
    try {
      const asset = await pickImage();
      if (asset) setLogoAsset(asset);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos abrir la galería');
    }
  };

  const handleSubmit = async () => {
    const parsed = teamSchema.safeParse({
      name,
      shortName: shortName || undefined,
      coachName: coachName || undefined,
      primaryColor,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos del equipo');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const team = await createTeam.mutateAsync(parsed.data);
      if (groupId) {
        await updateTeamApi(team.id, { group_id: groupId });
        void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
      }
      if (logoAsset) {
        const logoUrl = await uploadImage(teamLogoPath(championshipId, team.id), logoAsset);
        await updateTeamApi(team.id, { logo_url: logoUrl });
        void queryClient.invalidateQueries({ queryKey: teamKeys.byChampionship(championshipId) });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear el equipo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Nuevo equipo' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        <Pressable onPress={() => void handlePickLogo()} style={styles.logoPicker}>
          {logoAsset ? (
            <Image source={{ uri: logoAsset.uri }} style={styles.logoPreview} contentFit="cover" />
          ) : (
            <View style={[styles.logoPreview, styles.logoPlaceholder]}>
              <Ionicons name="shield-outline" size={28} color={colors.primary} />
            </View>
          )}
          <Text style={[typography.caption, styles.logoLabel]}>
            {logoAsset ? 'Cambiar escudo' : 'Agregar escudo (opcional)'}
          </Text>
        </Pressable>

        <TextField label="Nombre del equipo" value={name} onChangeText={setName} placeholder="Los Galácticos" />
        <TextField label="Nombre corto" value={shortName} onChangeText={setShortName} placeholder="GAL" />
        <TextField label="DT / entrenador" value={coachName} onChangeText={setCoachName} />

        {groups.data && groups.data.length > 0 ? (
          <View style={styles.colorSection}>
            <Text style={typography.caption}>Grupo</Text>
            <SegmentedOptions
              options={groups.data.map((g) => ({ value: g.id, label: g.name }))}
              value={groupId}
              onChange={setGroupId}
            />
          </View>
        ) : null}

        <View style={styles.colorSection}>
          <Text style={typography.caption}>Color principal</Text>
          <View style={styles.swatchRow}>
            {COLOR_SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setPrimaryColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  primaryColor === c && styles.swatchActive,
                ]}
              />
            ))}
          </View>
        </View>

        {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

        <Button label="Crear equipo" onPress={handleSubmit} loading={submitting} fullWidth />
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
  logoPicker: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoPreview: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
  },
  logoPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  colorSection: {
    gap: spacing.sm,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.textPrimary,
  },
  error: {
    color: colors.danger,
  },
});
