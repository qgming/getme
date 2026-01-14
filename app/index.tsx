import { useRouter } from 'expo-router';
import { FileText, Menu, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddNoteDrawer } from '../components/AddNoteDrawer';
import { CustomHeader } from '../components/CustomHeader';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { HomeActionButtons } from '../components/HomeActionButtons';
import { NoteCard } from '../components/NoteCard';
import { Toast, setGlobalToastHandler } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';

export default function HomeScreen() {
  const router = useRouter();
  const notes = useNoteStore(state => state.notes);
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

  // 渲染顶部按钮
  const renderHeader = () => <HomeActionButtons />;

  // 渲染笔记列表项
  const renderNoteItem = ({ item }: { item: any }) => (
    <NoteCard
      note={item}
      onPress={handleNotePress}
      onDelete={handleDeleteNote}
    />
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <FlatList
        data={sortedNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
      />

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader
          title="Getme"
          leftElement={<Menu size={24} color={colors.text} />}
          onLeftPress={() => router.push('/settings' as any)}
          rightElement={<Search size={24} color={colors.text} />}
          onRightPress={handleSearch}
        />
      </SafeAreaView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  listContent: {
    paddingTop: 90,
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
});
