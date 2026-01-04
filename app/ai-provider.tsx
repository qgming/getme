import { Stack, useLocalSearchParams } from 'expo-router';
import { Box, MoreHorizontal, Plus, TestTube2 } from 'lucide-react-native';
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
import { AddModelModal } from '../components/AddModelModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CustomHeader } from '../components/CustomHeader';
import { Toast } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import * as aiDb from '../database/aiProviders';
import { useAIStore } from '../stores/aiStore';

export default function AIProviderScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { providers, loadProviders } = useAIStore();
  const [modalVisible, setModalVisible] = useState(false);
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <CustomHeader
          title={provider.name}
          showBackButton
          rightElement={
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Plus size={28} color={colors.accent} />
            </TouchableOpacity>
          }
        />

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Base URL</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
              {provider.baseUrl}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>API Key</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {provider.apiKey ? '••••••••' + provider.apiKey.slice(-4) : '未设置'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.accent }]}
            onPress={() => setTestModalVisible(true)}
          >
            <TestTube2 size={16} color="#fff" />
            <Text style={styles.testButtonText}>测试</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>模型列表</Text>

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
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
