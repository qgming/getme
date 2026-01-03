import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { AddModelModal } from '../components/AddModelModal';
import { ActionMenu } from '../components/ActionMenu';
import { useTheme } from '../hooks/useTheme';
import { useAIStore } from '../stores/aiStore';
import * as aiDb from '../services/aiDatabase';

export default function AIProviderScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { providers, loadProviders } = useAIStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string } | null>(null);
  const [editingModel, setEditingModel] = useState<{ id: string; name: string } | null>(null);

  const provider = providers.find(p => p.id === id);

  if (!provider) {
    return null;
  }

  const models = provider.models || [];

  const handleAddModel = async (data: { id: string; name: string }) => {
    await aiDb.createModel({ ...data, providerId: id });
    await loadProviders();
    setModalVisible(false);
  };

  const handleMorePress = (event: any, model: { id: string; name: string }) => {
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

  const handleUpdateModel = async (data: { id: string; name: string }) => {
    await aiDb.updateModel(editingModel!.id, { name: data.name });
    await loadProviders();
    setModalVisible(false);
    setEditingModel(null);
  };

  const handleDeleteModel = () => {
    setMenuVisible(false);
    Alert.alert('删除模型', '确定要删除这个模型吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await aiDb.deleteModel(selectedModel!.id);
          await loadProviders();
        },
      },
    ]);
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
              <Ionicons name="add" size={28} color={colors.accent} />
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
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>模型列表</Text>

        <FlatList
          data={models}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.modelCard, { backgroundColor: colors.surface }]}>
              <View style={styles.modelHeader}>
                <Ionicons name="cube-outline" size={20} color={colors.accent} />
                <Text style={[styles.modelName, { color: colors.text }]}>{item.name}</Text>
                <TouchableOpacity
                  onPress={(event) => handleMorePress(event, item)}
                  style={styles.moreButton}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
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
});
