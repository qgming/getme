import { Tag } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoteCard } from '../components/NoteCard';
import { CustomHeader } from '../components/CustomHeader';
import { Toast } from '../components/Toast';
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
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const handleNotePress = (note: Note) => {
    router.navigate({
      pathname: '/note-editor',
      params: { noteId: note.id },
    } as any);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteById(noteId);
      setToast({ visible: true, message: '笔记已删除', type: 'success' });
    } catch (error) {
      console.error('删除失败:', error);
      setToast({ visible: true, message: '删除笔记失败，请重试', type: 'error' });
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
      <Tag size={64} color={colors.textQuaternary} />
      <Text style={[styles.emptyText, { color: colors.textQuaternary }]}>该标签下暂无笔记</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <CustomHeader title={`#${tag}`} showBackButton />

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

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
