import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, TextField } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { TournamentCard } from '@/components/golazo';
import { useAuthStore } from '@/store/authStore';
import { useMyChampionships } from '@/hooks/useChampionships';
import { useMyBillingStatus } from '@/hooks/useBilling';
import { updateProfile } from '@/api/profile';
import { PLAN_LABEL } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const myChampionships = useMyChampionships(session?.user.id);
  const billing = useMyBillingStatus();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : '';

  const startEditing = () => {
    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setPhone(profile?.phone ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, { first_name: firstName, last_name: lastName, phone: phone || null });
      await refreshProfile();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={typography.h1}>Perfil</Text>

      <Card style={styles.profileCard}>
        <Avatar uri={profile?.avatar_url} name={fullName || 'Usuario'} size={64} />
        {editing ? (
          <View style={styles.editForm}>
            <TextField label="Nombre" value={firstName} onChangeText={setFirstName} />
            <TextField label="Apellido" value={lastName} onChangeText={setLastName} />
            <TextField label="Teléfono" value={phone ?? ''} onChangeText={setPhone} keyboardType="phone-pad" />
            <View style={styles.editActions}>
              <Button label="Cancelar" variant="ghost" onPress={() => setEditing(false)} />
              <Button label="Guardar" onPress={handleSave} loading={saving} />
            </View>
          </View>
        ) : (
          <>
            <Text style={typography.h3}>{fullName || 'Usuario PENTAGOLAZO'}</Text>
            <Text style={[typography.body, styles.muted]}>{profile?.email}</Text>
            {profile?.phone ? <Text style={[typography.body, styles.muted]}>{profile.phone}</Text> : null}
            <Button label="Editar perfil" variant="secondary" onPress={startEditing} />
          </>
        )}
      </Card>

      <Card style={styles.planCard}>
        <View style={styles.planRow}>
          <View>
            <Text style={typography.h3}>Tu plan</Text>
            {billing.data ? (
              <Text style={[typography.caption, styles.muted]}>
                {billing.data.isSuperAdmin
                  ? 'Super administrador'
                  : `${billing.data.championshipCount} de ${billing.data.championshipLimit ?? '∞'} campeonatos`}
              </Text>
            ) : null}
          </View>
          <Badge
            label={billing.data?.isSuperAdmin ? 'Super Admin' : PLAN_LABEL[billing.data?.plan ?? 'free']}
            tone="primary"
          />
        </View>
        {!billing.data?.isSuperAdmin ? (
          <Button label="Ver planes" variant="secondary" onPress={() => router.push('/upgrade')} fullWidth />
        ) : null}
      </Card>

      <View style={styles.section}>
        <Text style={typography.h3}>Administrar</Text>
        <Text style={[typography.caption, styles.muted]}>
          Campeonatos donde eres administrador u organizador
        </Text>

        {myChampionships.isLoading ? (
          <LoadingState rows={1} />
        ) : myChampionships.data && myChampionships.data.length > 0 ? (
          <View style={styles.list}>
            {myChampionships.data.map((champ) => (
              <TournamentCard
                key={champ.id}
                championship={champ}
                onPress={() => router.push(`/championship/${champ.id}/admin`)}
              />
            ))}
          </View>
        ) : (
          <Text style={[typography.caption, styles.muted]}>
            Crea un campeonato desde la pestaña Campeonatos para administrarlo aquí.
          </Text>
        )}
      </View>

      <Button label="Cerrar sesión" variant="danger" onPress={() => void signOut()} fullWidth />
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
  profileCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  editForm: {
    width: '100%',
    gap: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  planCard: {
    gap: spacing.md,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  muted: {
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
