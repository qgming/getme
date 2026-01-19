import { Plus } from 'lucide-react-native';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProviderList, ProviderConfigDrawer } from '../components/model-services';
import { useTheme } from '../hooks/useTheme';
import { useAIStore, AIProvider } from '../stores/aiStore';

export default function ModelServicesScreen() {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
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

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider);
    setModalVisible(true);
  };

  const handleDeleteProvider = (id: string) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      await deleteProvider(confirmDelete);
      setConfirmDelete(null);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingProvider(null);
  };

  const handleAddProvider = () => {
    setModalVisible(true);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <CustomHeader
          title="模型服务"
          showBackButton
          rightElement={<Plus size={24} color={colors.text} />}
          onRightPress={handleAddProvider}
        />

        <View style={styles.content}>
          <ProviderList
            providers={providers}
            onToggle={toggleProvider}
            onEdit={handleEditProvider}
            onDelete={handleDeleteProvider}
            onAdd={handleAddProvider}
          />
        </View>

        <ProviderConfigDrawer
          visible={modalVisible}
          onClose={handleCloseModal}
          onConfirm={handleSaveProvider}
          editProvider={editingProvider || undefined}
        />

        <ConfirmDialog
          visible={!!confirmDelete}
          title="删除配置"
          message="确定要删除这个AI配置吗？"
          confirmText="删除"
          cancelText="取消"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
          isDestructive
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
  },
});
