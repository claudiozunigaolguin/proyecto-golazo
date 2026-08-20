import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  backgroundColor?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function Avatar({ uri, name, size = 40, backgroundColor = colors.primary }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={dimension} contentFit="cover" />;
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
