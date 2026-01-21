import { Stack } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  MemoryStatisticsCard,
  MemorySearchBar,
  MemoryCategoryFilter,
  MemoryCard,
  MemoryEmptyState,
  MemoryLoadingState,
} from '../components/memory';
import { useTheme } from '../hooks/useTheme';
import { useMemoryStore } from '../stores/memoryStore';
import { extractMemoriesFromConversation } from '../services/aiMemoryExtraction';
import { useChatStore } from '../stores/chatStore';
import { updateMemory } from '../database/memories';

/**
 * 记忆管理页面
 *
 * 功能说明：
 * 1. 顶部固定透明导航栏（返回按钮 + 刷新按钮）
 * 2. 统计卡片：显示总记忆数和最近提取时间
 * 3. 搜索栏：输入关键词搜索记忆，包含手动提取记忆按钮
 * 4. 分类筛选：按类别筛选（全部/个人/偏好/目标/事实/关系）
 * 5. 记忆列表：显示所有记忆卡片
 *
 * 按钮作用：
 * - 返回按钮：返回上一页
 * - 刷新按钮：重新加载记忆列表和统计数据
 * - 搜索按钮：执行关键词搜索
 * - 分类筛选：点击切换分类
 * - 编辑按钮：编辑记忆内容
 * - 删除按钮：删除单条记忆
 * - 确认按钮：保存编辑
 * - 取消编辑按钮：取消编辑
 * - 手动提取按钮：从最近20条对话中提取记忆
 */
export default function MemoryManagementScreen() {
  const { colors } = useTheme();
  const {
    memories,
    isLoading,
    selectedCategory,
    searchQuery,
    loadMemories,
    deleteMemory,
    setCategory,
    setSearchQuery,
    refreshMemories,
    getStatistics,
    clearAllMemories,
  } = useMemoryStore();

  const { messages, clearAllMessages } = useChatStore();

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<string | null>(null);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [statistics, setStatistics] = useState<{ count: number; lastExtraction: string | null }>({
    count: 0,
    lastExtraction: null,
  });
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadStatistics = useCallback(async () => {
    const stats = await getStatistics();
    setStatistics(stats);
  }, [getStatistics]);

  useEffect(() => {
    loadMemories();
    loadStatistics();
  }, [loadMemories, loadStatistics]);

  const handleRefresh = async () => {
    await refreshMemories();
    await loadStatistics();
    setToast({ visible: true, message: '已刷新', type: 'success' });
  };

  const handleCategoryChange = (category: string) => {
    setCategory(category);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    loadMemories();
  };

  const handleDeletePress = (id: string) => {
    setMemoryToDelete(id);
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (memoryToDelete) {
      try {
        await deleteMemory(memoryToDelete);
        setToast({ visible: true, message: '记忆已删除', type: 'success' });
        await loadStatistics();
      } catch {
        setToast({ visible: true, message: '删除失败', type: 'error' });
      }
    }
    setDeleteDialogVisible(false);
    setMemoryToDelete(null);
  };

  const handleManualExtraction = async () => {
    const conversationMessages = messages.filter(m => m.role !== 'system');
    if (conversationMessages.length < 5) {
      setToast({ visible: true, message: '对话记录太少，至少需要5条消息', type: 'error' });
      return;
    }

    setIsExtracting(true);
    try {
      const recentMessages = conversationMessages.slice(-20);
      const extracted = await extractMemoriesFromConversation(recentMessages);
      if (extracted.length > 0) {
        setToast({ visible: true, message: `成功提取 ${extracted.length} 条记忆`, type: 'success' });
        await refreshMemories();
        await loadStatistics();
      } else {
        setToast({ visible: true, message: '未提取到新记忆', type: 'success' });
      }
    } catch {
      setToast({ visible: true, message: '提取失败，请稍后重试', type: 'error' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEditPress = (id: string, content: string) => {
    setEditingMemoryId(id);
    setEditingContent(content);
  };

  const handleEditSave = async () => {
    if (!editingMemoryId) return;

    try {
      await updateMemory(editingMemoryId, editingContent);
      setToast({ visible: true, message: '记忆已更新', type: 'success' });
      await refreshMemories();
      setEditingMemoryId(null);
      setEditingContent('');
    } catch {
      setToast({ visible: true, message: '更新失败', type: 'error' });
    }
  };

  const handleEditCancel = () => {
    setEditingMemoryId(null);
    setEditingContent('');
  };

  const handleClearPress = () => {
    setClearDialogVisible(true);
  };

  const handleClearConfirm = async () => {
    try {
      await clearAllMemories();
      await clearAllMessages();
      setToast({ visible: true, message: '已清空所有记忆和聊天记录', type: 'success' });
      await loadStatistics();
    } catch {
      setToast({ visible: true, message: '清空失败', type: 'error' });
    }
    setClearDialogVisible(false);
  };

  // 渲染列表头部
  const renderHeader = () => (
    <View style={styles.headerContent}>
      <MemoryStatisticsCard count={statistics.count} lastExtraction={statistics.lastExtraction} />
      <MemorySearchBar
        value={searchInput}
        onChangeText={setSearchInput}
        onSearch={handleSearch}
        isExtracting={isExtracting}
        onClear={handleClearPress}
        onExtract={handleManualExtraction}
      />
      <MemoryCategoryFilter selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
    </View>
  );

  // 渲染列表底部
  const renderFooter = () => (
    <View style={styles.footerContent}>
      <View style={styles.bottomSpacer} />
    </View>
  );

  // 渲染记忆卡片
  const renderMemoryItem = ({ item }: { item: any }) => (
    <MemoryCard
      memory={item}
      isEditing={editingMemoryId === item.id}
      editingContent={editingContent}
      onEditPress={() => handleEditPress(item.id, item.content)}
      onEditSave={handleEditSave}
      onEditCancel={handleEditCancel}
      onEditContentChange={setEditingContent}
      onDeletePress={() => handleDeletePress(item.id)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <FlatList
        data={memories}
        renderItem={renderMemoryItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? (
            <MemoryLoadingState />
          ) : (
            <MemoryEmptyState hasSearchQuery={!!searchQuery} />
          )
        }
      />

      {/* 固定透明顶部栏 */}
      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader
          title="记忆管理"
          showBackButton
          rightElement={<RefreshCw size={20} color={colors.text} />}
          onRightPress={handleRefresh}
        />
      </SafeAreaView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="删除记忆"
        message="确定要删除这条记忆吗？"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogVisible(false);
          setMemoryToDelete(null);
        }}
      />

      <ConfirmDialog
        visible={clearDialogVisible}
        title="清空记忆"
        message="确定要清空所有记忆和聊天记录吗？此操作不可恢复。"
        isDestructive={true}
        onConfirm={handleClearConfirm}
        onCancel={() => setClearDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 100, // 为固定顶部栏留出空间
  },
  headerContent: {
    paddingTop: 12,
  },
  footerContent: {
    paddingBottom: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
