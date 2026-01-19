import { Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Box, Edit, MoreHorizontal, Plus, TestTube2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionMenu } from '../components/ActionMenu';
import { AddModelModal } from '../components/model-selection';
import { ProviderConfigDrawer } from '../components/model-services';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import * as aiDb from '../database/aiProviders';
import { useAIStore } from '../stores/aiStore';
import { useRouter } from 'expo-router';

export default function AIProviderScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { providers, loadProviders, updateProvider } = useAIStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [providerConfigVisible, setProviderConfigVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: string; modelId: string; name: string } | null>(null);
  const [editingModel, setEditingModel] = useState<{ id: string; modelId: string; name: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const provider = providers.find(p => p.id === id);

  if (!provider) {
    return null;
  }

  const models = provider.models || [];

  const handleAddModel = async (data: { modelId: string; name: string }) => {
    await aiDb.createModel({ ...data, providerId: id });
    await loadProviders();
    setModalVisible(false);
  };

  const handleMorePress = (event: any, model: { id: string; modelId: string; name: string }) => {
    const target = event.currentTarget || event.target;
    target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuPosition({ x: pageX + width, y: pageY + height });
      setSelectedModel(model);
      setMenuVisible(true);
    });
  };

  const handleEditModel = () => {
    setEditingModel(selectedModel);
    setMenuVisible(false);
    setModalVisible(true);
  };

  const handleUpdateModel = async (data: { modelId: string; name: string }) => {
    await aiDb.updateModel(editingModel!.id, { modelId: data.modelId, name: data.name });
    await loadProviders();
    setModalVisible(false);
    setEditingModel(null);
  };

  const handleDeleteModel = () => {
    setMenuVisible(false);
    setConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    await aiDb.deleteModel(selectedModel!.id);
    await loadProviders();
    setConfirmDelete(false);
  };

  const handleTestModel = async (modelId: string) => {
    setTesting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setToast({ message: '连接成功,模型可用', type: 'success' });
      } else {
        setToast({ message: `连接失败,状态码: ${response.status}`, type: 'error' });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        setToast({ message: '连接超时,请检查网络或服务地址', type: 'error' });
      } else {
        setToast({ message: error instanceof Error ? error.message : '测试失败', type: 'error' });
      }
    } finally {
      setTesting(false);
      setTestModalVisible(false);
    }
  };

  const handleEditProvider = () => {
    setProviderConfigVisible(true);
  };

  const handleSaveProvider = async (config: { name: string; apiKey: string; baseUrl: string; iconName?: string }) => {
    await updateProvider(provider.id, config, provider.models);
    await loadProviders();
    setProviderConfigVisible(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <View style={styles.container}>
          <FlatList
            data={models}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.modelCard, { backgroundColor: colors.surface }]}>
                <View style={styles.modelHeader}>
                  <Box size={20} color={colors.accent} />
                  <Text style={[styles.modelName, { color: colors.text }]}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={(event) => handleMorePress(event, item)}
                    style={styles.moreButton}
                  >
                    <MoreHorizontal size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListHeaderComponent={
              <View style={{ height: 80 }} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Box size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  暂无模型
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.headerButton, styles.leftButton, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={() => setTestModalVisible(true)}
              >
                <TestTube2 size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={handleEditProvider}
              >
                <Edit size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.surface }]}
                onPress={() => setModalVisible(true)}
              >
                <Plus size={24} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ActionMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          anchorPosition={menuPosition}
          actions={[
            {
              label: '编辑',
              icon: 'create-outline',
              onPress: handleEditModel,
            },
            {
              label: '删除',
              icon: 'trash-outline',
              onPress: handleDeleteModel,
              isDestructive: true,
            },
          ]}
        />

        <AddModelModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setEditingModel(null);
          }}
          onConfirm={editingModel ? handleUpdateModel : handleAddModel}
          initialData={editingModel || undefined}
        />

        <ConfirmDialog
          visible={confirmDelete}
          title="删除模型"
          message="确定要删除这个模型吗?"
          confirmText="删除"
          cancelText="取消"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(false)}
          isDestructive
        />

        <ProviderConfigDrawer
          visible={providerConfigVisible}
          onClose={() => setProviderConfigVisible(false)}
          onConfirm={handleSaveProvider}
          editProvider={provider}
        />

        <Modal
          visible={testModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setTestModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setTestModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>选择测试模型</Text>
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={styles.modelOption}
                  onPress={() => handleTestModel(model.modelId)}
                  disabled={testing}
                >
                  <Text style={[styles.modelOptionText, { color: colors.text }]}>
                    {model.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {testing && <ActivityIndicator style={styles.loader} color={colors.accent} />}
            </View>
          </TouchableOpacity>
        </Modal>

        {toast && (
          <Toast
            visible={true}
            message={toast.message}
            type={toast.type}
            onHide={() => setToast(null)}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    zIndex: 10,
  },
  leftButton: {
    position: 'absolute',
    left: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRight: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  modelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modelOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modelOptionText: {
    fontSize: 16,
  },
  loader: {
    marginTop: 16,
  },
});
