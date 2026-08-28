import { Appearance } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ColorScheme = 'light' | 'dark';

interface ThemeState {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Si el usuario nunca tocó el botón, arranca según la preferencia del
      // sistema operativo/navegador; una vez que elige algo a mano, esa
      // elección queda guardada y ya no vuelve a mirar el sistema (persist
      // rehidrata el valor guardado en cuanto existe uno).
      scheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      setScheme: (scheme) => set({ scheme }),
      toggleScheme: () => set({ scheme: get().scheme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'golazo-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
