import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ShareCardData } from '@/types/domain';
import { colors, radius, spacing, typography } from '@/theme';

interface ShareCardPreviewProps {
  data: ShareCardData;
}

/**
 * Versión nativa (iOS/Android) de la placa para compartir: componentes RN
 * planos, sin escudos ni degradado, capturados con react-native-view-shot.
 * A diferencia de la versión web (src/lib/shareCard.web.ts, un canvas
 * dibujado a mano con marca y escudos), esta es deliberadamente simple —
 * no se pudo probar en un dispositivo real todavía.
 */
export const ShareCardPreview = forwardRef<View, ShareCardPreviewProps>(function ShareCardPreview(
  { data },
  ref
) {
  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <Text style={styles.brand}>PENTAGOLAZO</Text>
      <Text style={styles.championshipName}>{data.championshipName}</Text>
      <Text style={styles.title}>{data.title}</Text>

      <View style={styles.panel}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.pos, styles.headerText]}>#</Text>
          <Text style={[styles.team, styles.headerText]}>EQUIPO</Text>
          {['PJ', 'PTS', 'GF', 'GC', 'DG', 'TA', 'TR'].map((h) => (
            <Text key={h} style={[styles.stat, styles.headerText]}>
              {h}
            </Text>
          ))}
        </View>
        {data.rows.map((row, index) => (
          <View key={row.id} style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
            <Text style={styles.pos}>{index + 1}</Text>
            <Text style={styles.team} numberOfLines={1}>
              {row.shortName || row.name}
            </Text>
            <Text style={styles.stat}>{row.played}</Text>
            <Text style={styles.stat}>{row.points}</Text>
            <Text style={styles.stat}>{row.goalsFor}</Text>
            <Text style={styles.stat}>{row.goalsAgainst}</Text>
            <Text style={styles.stat}>
              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
            </Text>
            <Text style={styles.stat}>{row.yellowCards}</Text>
            <Text style={styles.stat}>{row.redCards}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>pentagolazo.app · {data.generatedAt}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    gap: spacing.md,
  },
  brand: {
    ...typography.small,
    color: colors.textInverse,
    fontWeight: '800',
  },
  championshipName: {
    ...typography.h2,
    color: colors.textInverse,
  },
  title: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
  },
  panel: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rowAlt: {
    backgroundColor: colors.surface,
  },
  headerRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '700',
  },
  pos: {
    width: 24,
    textAlign: 'center',
    ...typography.caption,
  },
  team: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    ...typography.bodyBold,
  },
  stat: {
    width: 32,
    textAlign: 'center',
    ...typography.caption,
  },
  footer: {
    ...typography.small,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
});
