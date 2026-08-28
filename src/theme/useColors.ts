import { useThemeStore } from '@/store/themeStore';
import { darkColors, lightColors } from './colors';

/** Paleta activa, reactiva al esquema elegido (ver ThemeToggle / themeStore). */
export function useColors() {
  const scheme = useThemeStore((s) => s.scheme);
  return scheme === 'dark' ? darkColors : lightColors;
}
