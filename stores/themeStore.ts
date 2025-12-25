import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { Colors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

interface ThemeStore {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadThemeMode: () => Promise<void>;
  updateColorScheme: () => void;
}

const getSystemColorScheme = (): ColorScheme => {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

const getActiveColorScheme = (mode: ThemeMode): ColorScheme => {
  return mode === 'system' ? getSystemColorScheme() : mode;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeMode: 'system',
  colorScheme: getSystemColorScheme(),
  colors: Colors[getSystemColorScheme()],

  setThemeMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem('themeMode', mode);
    const colorScheme = getActiveColorScheme(mode);
    set({ themeMode: mode, colorScheme, colors: Colors[colorScheme] });
  },

  loadThemeMode: async () => {
    const saved = await AsyncStorage.getItem('themeMode');
    const mode = (saved as ThemeMode) || 'system';
    const colorScheme = getActiveColorScheme(mode);
    set({ themeMode: mode, colorScheme, colors: Colors[colorScheme] });
  },

  updateColorScheme: () => {
    const { themeMode } = get();
    const colorScheme = getActiveColorScheme(themeMode);
    set({ colorScheme, colors: Colors[colorScheme] });
  },
}));
