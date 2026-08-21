export const colors = {
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

export type ColorToken = keyof typeof colors;
