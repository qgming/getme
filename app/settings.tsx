import { Ionicons } from '@expo/vector-icons';
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
import { useThemeStore } from '../stores';

export default function SettingsScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode, loadThemeMode } = useThemeStore();
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.card}
          onPress={(e) => {
            e.currentTarget.measure((x, y, width, height, pageX, pageY) => {
              setMenuAnchor({ x: pageX + width, y: pageY + height / 2 });
              setShowThemeMenu(true);
            });
          }}
        >
          <View style={styles.cardLeft}>
            <Ionicons name="color-palette-outline" size={22} color="#1f2937" />
            <Text style={styles.cardTitle}>主题模式</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardValue}>{getThemeLabel()}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
            icon: 'sunny-outline',
            onPress: async () => await setThemeMode('light'),
          },
          {
            label: '深色模式',
            icon: 'moon-outline',
            onPress: async () => await setThemeMode('dark'),
          },
          {
            label: '跟随系统',
            icon: 'phone-portrait-outline',
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
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
    color: '#1f2937',
    marginLeft: 12,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 4,
  },
});
