import { useThemeStore } from '../stores/themeStore';

export const useTheme = () => {
  const colors = useThemeStore((state) => state.colors);
  const colorScheme = useThemeStore((state) => state.colorScheme);
  return { colors, colorScheme };
};
