import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { useNoteStore } from '../stores';
import { Note } from '../types/Note';
import { useTheme } from '../hooks/useTheme';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const searchNotesByQuery = useNoteStore(state => state.searchNotesByQuery);
  const deleteNoteById = useNoteStore(state => state.deleteNoteById);
  const allNotes = useNoteStore(state => state.notes);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      Alert.alert('成功', '笔记已删除');
      // 从搜索结果中移除已删除的笔记
      setSearchResults(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('删除失败:', error);
      Alert.alert('错误', '删除笔记失败，请重试');
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
          <Ionicons name="search" size={64} color={colors.textMuted} />
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
        <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* 顶部搜索栏 */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textQuaternary}
            style={styles.searchIcon}
          />
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
              <Ionicons name="close-circle" size={20} color={colors.textQuaternary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 搜索结果列表 */}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderSearchStats()}
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 2,
  },
  container: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statsText: {
    fontSize: 13,
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
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
