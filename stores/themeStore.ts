import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadThemeMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  themeMode: 'system',

  setThemeMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem('themeMode', mode);
    set({ themeMode: mode });
  },

  loadThemeMode: async () => {
    const saved = await AsyncStorage.getItem('themeMode');
    if (saved) {
      set({ themeMode: saved as ThemeMode });
    }
  },
}));
