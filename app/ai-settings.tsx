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
import { AIConfigDrawer } from '../components/AIConfigDrawer';
import { AIProviderCard } from '../components/AIProviderCard';
import { useTheme } from '../hooks/useTheme';
import { useAIStore } from '../stores/aiStore';

export default function AISettingsScreen() {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const { providers, addProvider, updateProvider, deleteProvider, toggleProvider, loadProviders } = useAIStore();

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleSaveProvider = async (config: { name: string; apiKey: string; baseUrl: string; iconName?: string }) => {
    if (editingProvider) {
      await updateProvider(editingProvider.id, config, editingProvider.models);
    } else {
      await addProvider(config);
    }
    setModalVisible(false);
    setEditingProvider(null);
  };

  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider);
    setModalVisible(true);
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
          onPress: async () => await deleteProvider(id),
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingProvider(null);
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
              onToggle={() => toggleProvider(provider.id, !provider.isEnabled)}
              onEdit={() => handleEditProvider(provider)}
              onDelete={() => handleDeleteProvider(provider.id)}
            />
          ))}
        </ScrollView>

        <AIConfigDrawer
          visible={modalVisible}
          onClose={handleCloseModal}
          onConfirm={handleSaveProvider}
          editProvider={editingProvider}
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
