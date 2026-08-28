export const lightColors = {
  primary: '#0B7A3B',
  primaryDark: '#075C2C',
  primaryLight: '#E4F5EA',
  accent: '#FFB020',

  // Fondo de pantalla con un leve tinte gris-verde: le da profundidad a la
  // app y hace que las tarjetas (colors.card, blancas) se despeguen del
  // fondo en vez de fundirse con él (antes ambos eran blanco puro).
  background: '#F1F4F2',
  card: '#FFFFFF',
  surface: '#F6F8F7',
  surfaceAlt: '#EFF3F1',
  border: '#E4E8E6',

  textPrimary: '#14181A',
  textSecondary: '#5B6663',
  textMuted: '#8E9895',
  textInverse: '#FFFFFF',

  success: '#0B7A3B',
  warning: '#F5A524',
  danger: '#E5484D',
  info: '#2E7BE0',

  yellowCard: '#F5C518',
  redCard: '#E5484D',

  live: '#E5484D',

  win: '#0B7A3B',
  draw: '#8E9895',
  loss: '#E5484D',
} as const;

export type ColorPalette = { [K in keyof typeof lightColors]: string };

// Mismas claves que lightColors — verde más vivo (se ve apagado sobre fondo
// oscuro si se deja igual), fondo casi negro con tinte cálido, y cada
// "superficie" un poco más clara que la anterior para que las tarjetas
// sigan flotando sobre el fondo como en modo claro.
export const darkColors: ColorPalette = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: 'rgba(34, 197, 94, 0.16)',
  accent: '#FFC24D',

  background: '#12100E',
  card: '#1C1F1D',
  surface: '#232624',
  surfaceAlt: '#2A2E2B',
  border: '#333836',

  textPrimary: '#F1F4F2',
  textSecondary: '#A7B0AC',
  textMuted: '#767F7C',
  textInverse: '#0E1211',

  success: '#22C55E',
  warning: '#F5A524',
  danger: '#F2555A',
  info: '#4C93E8',

  yellowCard: '#F5C518',
  redCard: '#F2555A',

  live: '#F2555A',

  win: '#22C55E',
  draw: '#767F7C',
  loss: '#F2555A',
};

export type ColorToken = keyof ColorPalette;

/** Compatibilidad: paleta clara por defecto para código que no necesita ser reactivo al tema (ver src/theme/useColors.ts). */
export const colors = lightColors;
