import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { AIConfigModal } from '../components/AIConfigModal';
import { AIProviderCard } from '../components/AIProviderCard';
import { useTheme } from '../hooks/useTheme';
import { useAIStore } from '../stores/aiStore';

export default function AISettingsScreen() {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const { providers, addProvider, deleteProvider, setDefaultProvider, loadProviders } = useAIStore();

  useEffect(() => {
    loadProviders();
  }, []);

  const handleAddProvider = (config: { name: string; apiKey: string; baseUrl: string }) => {
    addProvider(config);
    setModalVisible(false);
  };

  const handleDeleteProvider = (id: string) => {
    Alert.alert(
      '删除配置',
      '确定要删除这个AI配置吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteProvider(id),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <CustomHeader
          title="AI设置"
          showBackButton
          rightElement={
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color={colors.accent} />
            </TouchableOpacity>
          }
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {providers.map((provider) => (
            <AIProviderCard
              key={provider.id}
              provider={provider}
              onSetDefault={() => setDefaultProvider(provider.id)}
              onDelete={() => handleDeleteProvider(provider.id)}
            />
          ))}
        </ScrollView>

        <AIConfigModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onConfirm={handleAddProvider}
        />
      </SafeAreaView>
    </>
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
  addButton: {
    padding: 4,
  },
});
