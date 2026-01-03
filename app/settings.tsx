import { Palette, ChevronRight, Sparkles, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionMenu } from '../components/ActionMenu';
import { CustomHeader } from '../components/CustomHeader';
import { useThemeStore } from '../stores';
import { useTheme } from '../hooks/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themeMode = useThemeStore(state => state.themeMode);
  const setThemeMode = useThemeStore(state => state.setThemeMode);
  const loadThemeMode = useThemeStore(state => state.loadThemeMode);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    loadThemeMode();
  }, [loadThemeMode]);

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return '浅色模式';
      case 'dark': return '深色模式';
      case 'system': return '跟随系统';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <CustomHeader title="设置" showBackButton />

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => {
            e.currentTarget.measure((x, y, width, height, pageX, pageY) => {
              setMenuAnchor({ x: pageX + width, y: pageY + height / 2 });
              setShowThemeMenu(true);
            });
          }}
        >
          <View style={styles.cardLeft}>
            <Palette size={22} color={colors.text} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>主题模式</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.cardValue, { color: colors.textQuaternary }]}>{getThemeLabel()}</Text>
            <ChevronRight size={20} color={colors.textQuaternary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/ai-settings')}
        >
          <View style={styles.cardLeft}>
            <Sparkles size={22} color={colors.text} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>AI设置</Text>
          </View>
          <View style={styles.cardRight}>
            <ChevronRight size={20} color={colors.textQuaternary} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      <ActionMenu
        visible={showThemeMenu}
        onClose={() => {
          setShowThemeMenu(false);
          setMenuAnchor(null);
        }}
        anchorPosition={menuAnchor}
        actions={[
          {
            label: '浅色模式',
            icon: 'sunny-outline' as any,
            onPress: async () => await setThemeMode('light'),
          },
          {
            label: '深色模式',
            icon: 'moon-outline' as any,
            onPress: async () => await setThemeMode('dark'),
          },
          {
            label: '跟随系统',
            icon: 'phone-portrait-outline' as any,
            onPress: async () => await setThemeMode('system'),
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    marginLeft: 12,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 14,
    marginRight: 4,
  },
});
