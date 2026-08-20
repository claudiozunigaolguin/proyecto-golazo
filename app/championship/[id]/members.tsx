import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, SegmentedOptions, TextField } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { ChampionshipHeader, ChampionshipTabBar } from '@/components/golazo';
import { useChampionship } from '@/hooks/useChampionships';
import { useChampionshipRole } from '@/hooks/useChampionshipRole';
import { useAddMember, useChampionshipMembers, useRemoveMember } from '@/hooks/useMembers';
import { inviteMemberSchema } from '@/lib/validations';
import { confirmAction } from '@/lib/confirm';
import type { MemberRole } from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'organizer', label: 'Organizador' },
];

export default function ChampionshipMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const championshipId = id as string;
  const championship = useChampionship(id);
  const { isManager, isLoading: roleLoading } = useChampionshipRole(id);
  const members = useChampionshipMembers(id);
  const addMember = useAddMember(championshipId);
  const removeMember = useRemoveMember(championshipId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('organizer');
  const [error, setError] = useState<string | null>(null);

  if (!championship.data || roleLoading) return <LoadingState rows={4} />;

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

  const handleAdd = async () => {
    const parsed = inviteMemberSchema.safeParse({ email, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa el email ingresado');
      return;
    }
    setError(null);
    try {
      await addMember.mutateAsync(parsed.data);
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos agregar al usuario');
    }
  };

  const handleRemove = (membershipId: string, name: string) => {
    confirmAction(
      'Quitar administrador',
      `¿Quitarle el acceso a ${name} sobre este campeonato?`,
      'Quitar',
      () => void removeMember.mutateAsync(membershipId),
      { destructive: true }
    );
  };

  return (
    <View style={styles.flex}>
      <ChampionshipHeader championship={championship.data} />
      <ChampionshipTabBar championshipId={championship.data.id} active="resumen" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>Administradores</Text>
        <Text style={[typography.caption, styles.muted]}>
          Dales acceso a otras personas para que administren este campeonato contigo. Deben tener
          una cuenta ya registrada en PENTAGOLAZO.
        </Text>

        <Card style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="usuario@email.com"
          />
          <SegmentedOptions options={ROLE_OPTIONS} value={role} onChange={setRole} />
          {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}
          <Button label="Dar acceso" onPress={handleAdd} loading={addMember.isPending} fullWidth />
        </Card>

        {members.isLoading ? (
          <LoadingState rows={3} />
        ) : (
          <View style={styles.list}>
            {(members.data ?? []).map((m) => {
              const fullName = `${m.firstName} ${m.lastName}`.trim() || m.email;
              const isOwner = m.userId === championship.data!.owner_id;
              return (
                <Card key={m.membershipId} style={styles.memberRow}>
                  <Avatar uri={m.avatarUrl} name={fullName} size={40} />
                  <View style={styles.memberInfo}>
                    <Text style={typography.bodyBold}>{fullName}</Text>
                    <Text style={[typography.caption, styles.muted]}>{m.email}</Text>
                  </View>
                  <Badge label={isOwner ? 'Creador' : m.role === 'admin' ? 'Admin' : 'Organizador'} tone="primary" />
                  {!isOwner ? (
                    <Button
                      label="Quitar"
                      variant="ghost"
                      size="sm"
                      onPress={() => handleRemove(m.membershipId, fullName)}
                    />
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
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
  muted: {
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
  },
  list: {
    gap: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  deniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
});
