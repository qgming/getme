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

export default function SearchScreen() {
  const router = useRouter();
  const { searchNotesByQuery, deleteNoteById } = useNoteStore();

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
  }, [searchQuery, searchNotesByQuery]);

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
          <Ionicons name="search" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>输入关键词搜索笔记</Text>
          <Text style={styles.emptySubtext}>支持搜索内容和标签</Text>
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.searchingText}>搜索中...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyText}>未找到匹配的笔记</Text>
        <Text style={styles.emptySubtext}>试试其他关键词</Text>
      </View>
    );
  };

  // 渲染搜索统计
  const renderSearchStats = () => {
    if (!searchQuery.trim() || searchResults.length === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          找到 {searchResults.length} 个结果
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 顶部搜索栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索笔记..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 搜索结果列表 */}
      <View style={styles.container}>
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statsText: {
    fontSize: 13,
    color: '#6b7280',
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
    color: '#6b7280',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  searchingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
