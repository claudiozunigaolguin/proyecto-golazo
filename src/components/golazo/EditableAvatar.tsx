import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/ui';
import { colors } from '@/theme';

interface EditableAvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  backgroundColor?: string;
  onPick: () => Promise<string | null>;
  onUploaded: (url: string) => void;
}

export function EditableAvatar({
  uri,
  name,
  size = 72,
  backgroundColor,
  onPick,
  onUploaded,
}: EditableAvatarProps) {
  const [uploading, setUploading] = useState(false);

  const handlePress = async () => {
    setUploading(true);
    try {
      const url = await onPick();
      if (url) onUploaded(url);
    } catch (e) {
      Alert.alert('No se pudo subir la imagen', e instanceof Error ? e.message : 'Intenta de nuevo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Pressable onPress={() => void handlePress()} disabled={uploading}>
      <View>
        <Avatar uri={uri} name={name} size={size} backgroundColor={backgroundColor} />
        <View style={[styles.badge, { width: size * 0.32, height: size * 0.32, borderRadius: (size * 0.32) / 2 }]}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="camera" size={size * 0.18} color={colors.textInverse} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
