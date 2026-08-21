import { useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Button, SegmentedOptions } from '@/components/ui';
import { ShareCardPreview } from '@/components/golazo/ShareCardPreview';
import {
  SHARE_CARD_FORMAT_LABEL,
  type ShareCardData,
  type ShareCardFormat,
} from '@/types/domain';
import { colors, spacing, typography } from '@/theme';

const FORMAT_OPTIONS: { value: ShareCardFormat; label: string }[] = (
  Object.keys(SHARE_CARD_FORMAT_LABEL) as ShareCardFormat[]
).map((value) => ({ value, label: SHARE_CARD_FORMAT_LABEL[value] }));

/**
 * Ruta nativa (iOS/Android), sin poder probarse en un dispositivo real
 * todavía: captura el ShareCardPreview (RN plano, sin escudos/marca) tal
 * cual se ve en pantalla — el selector de formato queda visible pero no
 * afecta el tamaño de la captura (limitación conocida, se ajusta cuando
 * exista un build real para probar).
 */
export function ShareCardGenerator({ data }: { data: ShareCardData }) {
  const [format, setFormat] = useState<ShareCardFormat>('story');
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<View>(null);

  const handleShare = async () => {
    setError(null);
    setSharing(true);
    try {
      if (!viewShotRef.current) throw new Error('No pudimos preparar la imagen');
      const uri = await captureRef(viewShotRef.current, { format: 'png', quality: 1 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        throw new Error('Compartir no está disponible en este dispositivo');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos generar la imagen');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <SegmentedOptions options={FORMAT_OPTIONS} value={format} onChange={setFormat} />

      <ShareCardPreview ref={viewShotRef} data={data} />

      {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

      <Button label="Compartir imagen" onPress={() => void handleShare()} loading={sharing} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  error: {
    color: colors.danger,
  },
});
