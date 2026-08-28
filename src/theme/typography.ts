import { TextStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { darkColors, lightColors } from './colors';

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '700' },
  caption: { fontSize: 13, fontWeight: '500' },
  small: { fontSize: 11, fontWeight: '600' },
  stat: { fontSize: 20, fontWeight: '800' },
};

// Estos tokens no traían color a propósito (solo tamaño/peso), así que
// cualquier <Text style={typography.h1}> sin un color explícito quedaba con
// el negro por defecto de React Native — invisible en modo oscuro. En vez de
// tocar cada uso de `typography.x` en las ~60 pantallas, se le da a cada
// variante un color base (`textPrimary`) que se actualiza en el lugar cada
// vez que cambia el esquema, tal como useColors() hace con `colors`. Los
// usos que ya pisan el color a mano (p. ej. `[typography.caption,
// styles.muted]`) siguen funcionando igual, porque ese color explícito va
// después en el array de estilos.
function applyTextColor(scheme: 'light' | 'dark') {
  const color = (scheme === 'dark' ? darkColors : lightColors).textPrimary;
  for (const key of Object.keys(typography)) {
    typography[key] = { ...typography[key], color };
  }
}

applyTextColor(useThemeStore.getState().scheme);
useThemeStore.subscribe((state) => applyTextColor(state.scheme));
