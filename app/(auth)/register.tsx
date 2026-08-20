import { useState } from 'react';
import { Link, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import { Logo } from '@/components/golazo';
import { useAuthStore } from '@/store/authStore';
import { registerSchema } from '@/lib/validations';
import { colors, spacing, typography } from '@/theme';

export default function RegisterScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    const parsed = registerSchema.safeParse({ firstName, lastName, email, phone, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisa los datos ingresados');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || undefined,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear tu cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmEmoji}>📩</Text>
        <Text style={typography.h2}>¡Ya casi!</Text>
        <Text style={[typography.body, styles.confirmText]}>
          Te enviamos un correo a {email} para confirmar tu cuenta. Una vez confirmada, inicia
          sesión para crear o unirte a un campeonato.
        </Text>
        <Button label="Ir a iniciar sesión" onPress={() => router.replace('/(auth)/login')} fullWidth />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Logo size="md" />
          <Text style={typography.h2}>Crea tu cuenta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <TextField label="Nombre" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.flex1}>
              <TextField label="Apellido" value={lastName} onChangeText={setLastName} />
            </View>
          </View>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField label="Teléfono (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

          <Button label="Registrarme" onPress={handleSubmit} loading={loading} fullWidth />
        </View>

        <View style={styles.footer}>
          <Text style={typography.body}>¿Ya tienes cuenta?</Text>
          <Link href="/(auth)/login">
            <Text style={[typography.bodyBold, styles.linkText]}> Inicia sesión</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    color: colors.primary,
  },
  confirmContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  confirmEmoji: {
    fontSize: 48,
  },
  confirmText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});
