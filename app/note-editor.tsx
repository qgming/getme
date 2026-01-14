import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, Hash, MoreVertical, Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionMenu } from '../components/ActionMenu';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DialogInput } from '../components/DialogInput';
import { Toast } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';
import { formatFullDateTime, Note } from '../types/Note';

export default function NoteEditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { updateNote, deleteNoteById, getNoteById } = useNoteStore();

  // --- 状态与引用 ---
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [originalTags, setOriginalTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());

  const [menuVisible, setMenuVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number } | null>(null);
  const menuButtonRef = useRef<View>(null);

  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ 
    visible: false, message: '', type: 'success' 
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const contentRef = useRef('');
  const tagsRef = useRef<string[]>([]);

  // --- 初始化数据 ---
  useEffect(() => {
    const loadNote = async () => {
      try {
        if (params.noteId) {
          const id = params.noteId as string;
          const note = await getNoteById(id);
          if (note) {
            contentRef.current = note.content;
            tagsRef.current = note.tags || [];
            setContent(note.content);
            setOriginalContent(note.content);
            setTags(note.tags || []);
            setOriginalTags(note.tags || []);
            setNoteId(note.id);
            setCreatedAt(note.createdAt);
          } else {
            setToast({ visible: true, message: '未找到该笔记', type: 'error' });
            router.back();
          }
        }
      } catch {
        setToast({ visible: true, message: '加载失败', type: 'error' });
      }
    };
    loadNote();
  }, [params.noteId, getNoteById, router]);

  // --- 保存逻辑 ---
  const handleSave = useCallback(async (showFeedback = true) => {
    if (!contentRef.current.trim() || !noteId) return;
    const noteData = { id: noteId, content: contentRef.current.trim(), tags: tagsRef.current };
    
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const existingNote: Note = { ...noteData, id: noteId, createdAt: createdAt, updatedAt: new Date().toISOString() };
      await updateNote(existingNote);
      setOriginalContent(contentRef.current.trim());
      setOriginalTags([...tagsRef.current]);
      if (showFeedback) setToast({ visible: true, message: '笔记已保存', type: 'success' });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [noteId, createdAt, updateNote]);

  // 自动保存
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const hasChanged = content.trim() !== originalContent.trim() || JSON.stringify(tags) !== JSON.stringify(originalTags);
    if (hasChanged && content.trim()) {
      autoSaveTimerRef.current = setTimeout(() => handleSave(false), 2000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, tags, originalContent, originalTags, handleSave]);

  const handleManualSave = async () => {
    if (isSavingRef.current) return;
    await handleSave(true);
  };

  const handleShowMenu = () => {
    menuButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setAnchorPosition({ x: pageX + width / 2, y: pageY + height });
      setMenuVisible(true);
    });
  };

  const handleAIInsight = () => {
    router.push({
      pathname: '/ai-insights',
      params: { noteId },
    } as any);
  };

  const showSaveButton = content.trim() !== originalContent.trim() || JSON.stringify(tags) !== JSON.stringify(originalTags);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.contentContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ height: 56 }} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatFullDateTime(createdAt)}
          </Text>

          {tags.length > 0 && (
            <View style={styles.tagContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}
                  onPress={() => setConfirmDeleteTag(tag)}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableWithoutFeedback onPress={() => textInputRef.current?.focus()}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={textInputRef}
                style={[styles.contentInput, { color: colors.textSecondary }]}
                placeholder="输入内容..."
                value={content}
                onChangeText={(text) => {
                  contentRef.current = text;
                  setContent(text);
                }}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        <View style={styles.header}>
          {showSaveButton ? (
            <TouchableOpacity style={[styles.headerButton, styles.leftButton, { backgroundColor: colors.surface }]} onPress={handleManualSave}>
              <Check size={24} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.headerButton, styles.leftButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerRight}>
            {isSaving && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
            <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surface }]} onPress={() => setTagModalVisible(true)}>
              <Hash size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surface }]} onPress={handleAIInsight}>
              <Sparkles size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity ref={menuButtonRef} style={[styles.headerButton, { backgroundColor: colors.surface }]} onPress={handleShowMenu}>
              <MoreVertical size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- 浮层组件 --- */}
      <ActionMenu visible={menuVisible} onClose={() => setMenuVisible(false)} anchorPosition={anchorPosition} actions={[{ label: '分享', icon: 'share-outline', onPress: () => {} }, { label: '删除', icon: 'trash-outline', onPress: () => setConfirmDeleteNote(true), isDestructive: true }]} />
      <DialogInput visible={tagModalVisible} title="添加标签" value={tagInput} onChangeText={setTagInput} onCancel={() => setTagModalVisible(false)} onConfirm={() => { if (tagInput.trim()) { setTags([...tags, tagInput.trim()]); tagsRef.current = [...tags, tagInput.trim()]; } setTagInput(''); setTagModalVisible(false); }} placeholder="输入标签名称" />
      <ConfirmDialog visible={!!confirmDeleteTag} title="删除标签" message={`确定删除 #${confirmDeleteTag} 吗？`} onConfirm={() => { const newTags = tags.filter(t => t !== confirmDeleteTag); setTags(newTags); tagsRef.current = newTags; setConfirmDeleteTag(null); }} onCancel={() => setConfirmDeleteTag(null)} isDestructive />
      <ConfirmDialog visible={confirmDeleteNote} title="删除笔记" message="确定删除这个笔记吗？" onConfirm={async () => { await deleteNoteById(noteId!); router.back(); }} onCancel={() => setConfirmDeleteNote(false)} isDestructive />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    zIndex: 10,
  },
  leftButton: {
    position: 'absolute',
    left: 20,
  },
  headerButton: {
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
  headerRight: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 400,
  },
  dateText: { fontSize: 14, marginBottom: 4, marginTop: 12, paddingHorizontal: 20 },
  inputWrapper: {
    flex: 1,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 26,
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    minHeight: 200,
  },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4, paddingHorizontal: 18 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 13, fontWeight: '500' },
});