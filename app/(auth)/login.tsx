import { useState } from 'react';
import { Link, router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextField } from '@/components/ui';
import { Logo } from '@/components/golazo';
import { useAuthStore } from '@/store/authStore';
import { loginSchema } from '@/lib/validations';
import { colors, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Logo size="lg" />
          <Text style={[typography.body, styles.tagline]}>
            Todo tu campeonato, en un solo lugar.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@email.com"
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

          <Button label="Iniciar sesión" onPress={handleSubmit} loading={loading} fullWidth />

          <Link href="/(auth)/forgot-password" style={styles.link}>
            <Text style={[typography.caption, styles.linkText]}>¿Olvidaste tu contraseña?</Text>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={typography.body}>¿No tienes cuenta?</Text>
          <Link href="/(auth)/register">
            <Text style={[typography.bodyBold, styles.linkText]}> Regístrate</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
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
  tagline: {
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
  },
  error: {
    color: colors.danger,
  },
  link: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  linkText: {
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
