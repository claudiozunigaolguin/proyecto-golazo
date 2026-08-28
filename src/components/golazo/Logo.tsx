import { useMemo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, type ColorPalette } from '@/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { icon: 28, font: 16 },
  md: { icon: 36, font: 20 },
  lg: { icon: 56, font: 30 },
};

export function Logo({ size = 'md' }: LogoProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const s = SIZES[size];
  return (
    <View style={styles.row}>
      <Image
        source={require('../../../assets/brand/pentagolazo-mark-transparent.png')}
        style={{ width: s.icon, height: s.icon }}
        contentFit="contain"
      />
      <Text style={[styles.wordmark, { fontSize: s.font }]}>
        PENTA<Text style={styles.wordmarkAccent}>GOLAZO</Text>
      </Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    wordmark: {
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    wordmarkAccent: {
      color: colors.primary,
    },
  });
