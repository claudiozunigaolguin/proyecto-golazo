import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { useColors, radius, spacing, typography, type ColorPalette } from '@/theme';

export function ThemeToggle() {
  const scheme = useThemeStore((s) => s.scheme);
  const toggleScheme = useThemeStore((s) => s.toggleScheme);
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = scheme === 'dark';

  return (
    <Pressable onPress={toggleScheme} style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.title}>Apariencia</Text>
        <Text style={styles.subtitle}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Text>
      </View>
      <View style={styles.switchTrack}>
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={18}
          color={isDark ? colors.textInverse : colors.accent}
        />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    info: {
      gap: 2,
    },
    title: {
      ...typography.bodyBold,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    switchTrack: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
