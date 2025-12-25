import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function TagNotesScreen() {
  const router = useRouter();
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { getNotesByTag, deleteNoteById } = useNoteStore();
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (tag) {
      const filteredNotes = getNotesByTag(tag);
      setNotes(filteredNotes);
    }
  }, [tag, getNotesByTag]);

  const handleNotePress = (note: Note) => {
    router.navigate({
      pathname: '/note-editor',
      params: { noteId: note.id },
    } as any);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteById(noteId);
      const filteredNotes = getNotesByTag(tag);
      setNotes(filteredNotes);
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
      <Ionicons name="pricetag-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>该标签下暂无笔记</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>#{tag}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.container}>
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
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    color: '#9ca3af',
    textAlign: 'center',
  },
});
