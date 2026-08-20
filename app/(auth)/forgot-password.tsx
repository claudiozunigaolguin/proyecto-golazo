import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { forgotPasswordSchema } from '@/lib/validations';
import { colors, spacing, typography } from '@/theme';

export default function ForgotPasswordScreen() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email inválido');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(parsed.data.email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={typography.h2}>Recuperar contraseña</Text>

        {sent ? (
          <>
            <Text style={[typography.body, styles.description]}>
              Revisa {email}: te enviamos instrucciones para restablecer tu contraseña.
            </Text>
            <Button label="Volver a iniciar sesión" onPress={() => router.replace('/(auth)/login')} fullWidth />
          </>
        ) : (
          <>
            <Text style={[typography.body, styles.description]}>
              Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
            </Text>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}
            <Button label="Enviar enlace" onPress={handleSubmit} loading={loading} fullWidth />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 40,
  },
  description: {
    color: colors.textSecondary,
  },
  error: {
    color: colors.danger,
  },
});
