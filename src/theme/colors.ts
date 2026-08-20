export const colors = {
  primary: '#0B7A3B',
  primaryDark: '#075C2C',
  primaryLight: '#E4F5EA',
  accent: '#FFB020',

  background: '#FFFFFF',
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
