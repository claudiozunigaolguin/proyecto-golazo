import { TextStyle } from 'react-native';

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
