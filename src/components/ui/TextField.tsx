import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useColors, radius, spacing, typography, type ColorPalette } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      {label ? <Text style={[typography.caption, styles.label]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={[typography.small, styles.error]}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    label: {
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.card,
    },
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      color: colors.danger,
    },
  });
