import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Button, SegmentedOptions } from '@/components/ui';
import { LoadingState } from '@/components/ui/Skeleton';
import { generateShareCardImage } from '@/lib/shareCard';
import { canShareFiles, downloadDataUrl, shareDataUrl } from '@/lib/download';
import {
  SHARE_CARD_FORMAT_LABEL,
  SHARE_CARD_DIMENSIONS,
  type ShareCardData,
  type ShareCardFormat,
} from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const FORMAT_OPTIONS: { value: ShareCardFormat; label: string }[] = (
  Object.keys(SHARE_CARD_FORMAT_LABEL) as ShareCardFormat[]
).map((value) => ({ value, label: SHARE_CARD_FORMAT_LABEL[value] }));

export function ShareCardGenerator({ data }: { data: ShareCardData }) {
  const [format, setFormat] = useState<ShareCardFormat>('story');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    setError(null);
    void generateShareCardImage(data, format)
      .then(({ uri }) => {
        if (!cancelled) setImageUri(uri);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No pudimos generar la imagen');
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data, format]);

  const filename = `pentagolazo-${format}.png`;

  return (
    <View style={styles.container}>
      <SegmentedOptions options={FORMAT_OPTIONS} value={format} onChange={setFormat} />

      {generating ? (
        <LoadingState rows={4} />
      ) : error ? (
        <Text style={[typography.caption, styles.error]}>{error}</Text>
      ) : imageUri ? (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: imageUri }}
            style={{
              width: '100%',
              aspectRatio: SHARE_CARD_DIMENSIONS[format].width / SHARE_CARD_DIMENSIONS[format].height,
            }}
            contentFit="contain"
          />
        </View>
      ) : null}

      {imageUri ? (
        <View style={styles.actions}>
          <Button label="Descargar imagen" onPress={() => downloadDataUrl(imageUri, filename)} fullWidth />
          {canShareFiles() ? (
            <Button
              label="Compartir"
              variant="outline"
              onPress={() => void shareDataUrl(imageUri, filename, data.championshipName)}
              fullWidth
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  previewWrap: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actions: {
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
});
