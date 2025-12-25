import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
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
import { NoteCard } from '../components/NoteCard';
import { Note } from '../types/Note';
import { useNoteStore } from '../stores';
import { useTheme } from '../hooks/useTheme';

export default function TagNotesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const deleteNoteById = useNoteStore(state => state.deleteNoteById);
  const allNotes = useNoteStore(state => state.notes);
  const notes = allNotes.filter(n => n.tags?.includes(tag));

  const handleNotePress = (note: Note) => {
    router.navigate({
      pathname: '/note-editor',
      params: { noteId: note.id },
    } as any);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteById(noteId);
      Alert.alert('成功', '笔记已删除');
    } catch (error) {
      console.error('删除失败:', error);
      Alert.alert('错误', '删除笔记失败，请重试');
    }
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onPress={handleNotePress}
      onDelete={handleDeleteNote}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pricetag-outline" size={64} color={colors.textQuaternary} />
      <Text style={[styles.emptyText, { color: colors.textQuaternary }]}>该标签下暂无笔记</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>#{tag}</Text>
        <View style={styles.placeholder} />
      </View>

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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
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
});
