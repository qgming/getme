import { useRouter } from 'expo-router';
import { BarChart3, FileText, Menu, Search, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddNoteDrawer } from '../components/AddNoteDrawer';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { NoteCard } from '../components/NoteCard';
import { Toast, setGlobalToastHandler } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';

export default function HomeScreen() {
  const router = useRouter();
  const notes = useNoteStore(state => state.notes);
  const loading = useNoteStore(state => state.loading);
  const deleteNoteById = useNoteStore(state => state.deleteNoteById);
  const { colors } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info'; duration?: number }>({ visible: false, message: '', type: 'success' });

  React.useEffect(() => {
    setGlobalToastHandler((message, type, duration) => {
      setToast({ visible: true, message, type: type || 'success', duration });
    });
  }, []);

  // 按创建时间排序（最新的在前）
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 处理笔记点击
  const handleNotePress = (note: any) => {
    router.navigate({
      pathname: '/note-editor',
      params: { noteId: note.id },
    } as any);
  };

  // 处理搜索按钮点击
  const handleSearch = () => {
    router.navigate('/search' as any);
  };

  // 处理删除笔记
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteById(noteId);
      setToast({ visible: true, message: '笔记已删除', type: 'success' });
    } catch (error) {
      console.error('删除失败:', error);
      setToast({ visible: true, message: '删除笔记失败，请重试', type: 'error' });
    }
  };

  // 渲染空状态
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <FileText size={64} color={colors.textQuaternary} />
      <Text style={[styles.emptyText, { color: colors.textQuaternary }]}>还没有笔记</Text>
      <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>点击下方绿色按钮开始记录</Text>
    </View>
  );

  // 渲染加载状态
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
          <Text style={[styles.loadingText, { color: colors.textQuaternary }]}>正在加载...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 渲染顶部按钮
  const renderHeader = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.topButtons}
      contentContainerStyle={styles.topButtonsContent}
    >
      <TouchableOpacity
        style={[styles.topButton, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/ai-insights' as any)}
      >
        <Sparkles size={20} color={colors.text} />
        <Text style={[styles.topButtonText, { color: colors.text }]}>AI 洞察</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.topButton, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/statistics' as any)}
      >
        <BarChart3 size={20} color={colors.text} />
        <Text style={[styles.topButtonText, { color: colors.text }]}>数据统计</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 渲染笔记列表项
  const renderNoteItem = ({ item }: { item: any }) => (
    <NoteCard
      note={item}
      onPress={handleNotePress}
      onDelete={handleDeleteNote}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* 顶部导航栏 */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.push('/settings' as any)} style={styles.iconButton}>
          <Menu size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Getme</Text>
        </View>

        <TouchableOpacity onPress={handleSearch} style={styles.iconButton}>
          <Search size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 笔记列表 */}
      <FlatList
        data={sortedNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
      />

      {/* 浮动添加按钮 */}
      <FloatingAddButton
        onPress={() => setDrawerVisible(true)}
      />

      <AddNoteDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  iconButton: {
    padding: 4,
  },
  topButtons: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  topButtonsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  topButton: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  topButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
