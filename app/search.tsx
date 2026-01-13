import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Search, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoteCard } from '../components/NoteCard';
import { Toast } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';
import { Note } from '../types/Note';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const searchNotesByQuery = useNoteStore(state => state.searchNotesByQuery);
  const deleteNoteById = useNoteStore(state => state.deleteNoteById);
  const allNotes = useNoteStore(state => state.notes);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  // 搜索功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // 防抖搜索
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchNotesByQuery(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('搜索失败:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchNotesByQuery, allNotes]);

  // 处理返回
  const handleBack = () => {
    router.back();
  };

  // 处理笔记点击
  const handleNotePress = (note: Note) => {
    router.navigate({
      pathname: '/note-editor',
      params: { noteId: note.id },
    } as any);
  };

  // 处理删除笔记
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteById(noteId);
      setToast({ visible: true, message: '笔记已删除', type: 'success' });
      // 从搜索结果中移除已删除的笔记
      setSearchResults(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('删除失败:', error);
      setToast({ visible: true, message: '删除笔记失败，请重试', type: 'error' });
    }
  };

  // 渲染搜索结果
  const renderSearchResult = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onPress={handleNotePress}
      onDelete={handleDeleteNote}
    />
  );

  // 渲染空状态
  const renderEmptyComponent = () => {
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>输入关键词搜索笔记</Text>
          <Text style={[styles.emptySubtext, { color: colors.textQuaternary }]}>支持搜索内容和标签</Text>
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.searchingText, { color: colors.textQuaternary }]}>搜索中...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <FileText size={64} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>未找到匹配的笔记</Text>
        <Text style={[styles.emptySubtext, { color: colors.textQuaternary }]}>试试其他关键词</Text>
      </View>
    );
  };

  // 渲染搜索统计
  const renderSearchStats = () => {
    if (!searchQuery.trim() || searchResults.length === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: colors.textTertiary }]}>
          找到 {searchResults.length} 个结果
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* 搜索结果列表 */}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderSearchStats()}
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={searchResults.length === 0 ? styles.emptyListContent : styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
        />
      </View>

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="搜索笔记..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              placeholderTextColor={colors.textQuaternary}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
              >
                <XCircle size={18} color={colors.textQuaternary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.surface }]}
            onPress={() => Keyboard.dismiss()}
            activeOpacity={0.7}
          >
            <Search size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
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
  searchButton: {
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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 90,
    paddingBottom: 10,
  },
  statsText: {
    fontSize: 13,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  searchingText: {
    fontSize: 16,
  },
});
