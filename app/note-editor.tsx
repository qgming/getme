import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Hash, MoreHorizontal } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionMenu } from '../components/ActionMenu';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CustomHeader } from '../components/CustomHeader';
import { DialogInput } from '../components/DialogInput';
import { Toast } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';
import { formatFullDateTime, Note } from '../types/Note';

export default function NoteEditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets(); // 获取状态栏和底部手势条的精确高度
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

  const showSaveButton = content.trim() !== originalContent.trim() || JSON.stringify(tags) !== JSON.stringify(originalTags);

  return (
    // 关键修正 1: edges 只包含 top，彻底防止底部安全区域与键盘避让冲突产生空白
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* 关键修正 2: 精准设置 Offset。Offset = Header(约56) + 顶部安全区 */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 + insets.top : 0}
      >
        <CustomHeader
          showBackButton={!showSaveButton}
          leftElement={
            showSaveButton ? (
              <TouchableOpacity style={styles.saveButton} onPress={handleManualSave}>
                <Check size={28} color={colors.primaryDark} />
              </TouchableOpacity>
            ) : undefined
          }
          rightElement={
            <View style={styles.headerRight}>
              {isSaving && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
              <TouchableOpacity style={styles.iconButton} onPress={() => setTagModalVisible(true)}>
                <Hash size={24} color={colors.text} />
              </TouchableOpacity>
              <View ref={menuButtonRef}>
                <TouchableOpacity style={styles.iconButton} onPress={handleShowMenu}>
                  <MoreHorizontal size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          }
        />

        <ScrollView
          ref={scrollViewRef}
          style={[styles.contentContainer, { backgroundColor: colors.surface }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatFullDateTime(createdAt)}
          </Text>

          {/* 标签展示区 */}
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

          {/* 关键修正 3: 使 TextInput 占据全部剩余空间，并禁用其内部滚动以防布局抖动 */}
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
                scrollEnabled={false} // 重要：由 ScrollView 处理滚动，防止光标聚焦时出现额外空白 div
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

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
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1, // 确保即使内容少，点击底部也能聚焦
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveButton: { padding: 4 },
  iconButton: { padding: 4 },
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
    paddingBottom: 60, // 底部留出足够空间，确保内容不会被手势条遮挡
    minHeight: 200,
  },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4, paddingHorizontal: 18 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 13, fontWeight: '500' },
});