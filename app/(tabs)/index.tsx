import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoteCard } from '../../components/NoteCard';
import { useNoteStore } from '../../stores';
import { useTheme } from '../../hooks/useTheme';

export default function HomeScreen() {
  const router = useRouter();
  const { notes, loading, deleteNoteById } = useNoteStore();
  const { colors } = useTheme();

  console.log('HomeScreen渲染, notes数量:', notes.length, 'loading:', loading);

  // 处理笔记点击
  const handleNotePress = (note: any) => {
    console.log('点击笔记:', note.id, note.content.substring(0, 50));
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
      Alert.alert('成功', '笔记已删除');
    } catch (error) {
      console.error('删除失败:', error);
      Alert.alert('错误', '删除笔记失败，请重试');
    }
  };

  // 渲染空状态
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={colors.textQuaternary} />
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

      {/* 顶部导航栏 - flomo 风格 */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Getme</Text>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color={colors.textQuaternary} />
        </TouchableOpacity>
      </View>

      {/* 笔记列表 */}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
        />
      </View>
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
    borderBottomWidth: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  searchButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
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
