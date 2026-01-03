import { Check, Hash, MoreHorizontal } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionItem, ActionMenu } from '../components/ActionMenu';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CustomHeader } from '../components/CustomHeader';
import { DialogInput } from '../components/DialogInput';
import { Toast } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';
import { formatFullDateTime, Note, validateNote } from '../types/Note';

export default function NoteEditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { updateNote, deleteNoteById, getNoteById } = useNoteStore();

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
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const contentRef = useRef('');
  const tagsRef = useRef<string[]>([]);


  // 加载传入的笔记数据
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
        } else {
          router.back();
        }
      } catch (error) {
        console.error('加载笔记失败:', error);
        setToast({ visible: true, message: '加载笔记失败', type: 'error' });
      }
    };

    loadNote();
  }, [params.noteId, getNoteById, router]);

  // 处理保存
  const handleSave = useCallback(async (showFeedback = true) => {
    if (!contentRef.current.trim() || !noteId) return;

    const noteData = {
      id: noteId,
      content: contentRef.current.trim(),
      tags: tagsRef.current,
    };

    const validation = validateNote(noteData);
    if (!validation.valid) {
      if (showFeedback) setToast({ visible: true, message: validation.errors.join(', '), type: 'error' });
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const existingNote: Note = {
        ...noteData,
        id: noteId,
        createdAt: createdAt,
        updatedAt: new Date().toISOString(),
      };
      await updateNote(existingNote);

      setOriginalContent(contentRef.current.trim());
      setOriginalTags(tagsRef.current);

      if (showFeedback) {
        setToast({ visible: true, message: '笔记已保存', type: 'success' });
      }
    } catch (error) {
      console.error('保存失败:', error);
      if (showFeedback) setToast({ visible: true, message: '保存失败，请重试', type: 'error' });
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [noteId, createdAt, updateNote]);

  // 标签变化时立即保存
  useEffect(() => {
    if (JSON.stringify(tagsRef.current) !== JSON.stringify(originalTags) && contentRef.current.trim()) {
      handleSave(false);
    }
  }, [tags, originalTags, handleSave]);

  // 内容变化后延迟自动保存
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    if (contentRef.current.trim() && contentRef.current.trim() !== originalContent.trim()) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(false);
      }, 2000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, originalContent, handleSave]);

  // 删除笔记
  const handleDelete = () => {
    if (!noteId) return;
    setConfirmDeleteNote(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteId) return;
    try {
      await deleteNoteById(noteId);
      router.back();
    } catch (error) {
      console.error('删除失败:', error);
      setToast({ visible: true, message: '删除失败，请重试', type: 'error' });
    }
  };

  const handleShowMenu = () => {
    menuButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setAnchorPosition({ x: pageX + width / 2, y: pageY + height });
      setMenuVisible(true);
    });
  };

  const menuActions: ActionItem[] = [
    {
      label: '分享',
      icon: 'share-outline',
      onPress: () => {},
    },
    ...(noteId ? [{
      label: '删除',
      icon: 'trash-outline' as const,
      onPress: handleDelete,
      isDestructive: true,
    }] : []),
  ];

  // 处理手动保存
  const handleManualSave = async () => {
    const contentChanged = content.trim() !== originalContent.trim();
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
    if (!(contentChanged || tagsChanged) || isSavingRef.current) return;
    await handleSave(false);
  };

  // 处理内容变化
  const handleContentChange = (text: string) => {
    contentRef.current = text;
    setContent(text);
  };

  // 处理添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      tagsRef.current = newTags;
      setTags(newTags);
    }
    setTagInput('');
    setTagModalVisible(false);
  };

  // 处理删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    tagsRef.current = newTags;
    setTags(newTags);
    setConfirmDeleteTag(null);
  };

  const contentChanged = content.trim() !== originalContent.trim();
  const tagsChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
  const showSaveButton = contentChanged || tagsChanged;


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 1}
      >
        <CustomHeader
          showBackButton={!showSaveButton}
          leftElement={
            showSaveButton ? (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleManualSave}
                activeOpacity={0.7}
              >
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatFullDateTime(createdAt)}</Text>

          {/* 标签区域 */}
          {tags.length > 0 && (
            <View style={styles.tagContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}
                  onPress={() => setConfirmDeleteTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            ref={textInputRef}
            style={[styles.contentInput, { color: colors.textSecondary }]}
            placeholder="输入内容..."
            value={content}
            onChangeText={handleContentChange}
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.textMuted}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorPosition={anchorPosition}
        actions={menuActions}
      />

      <DialogInput
        visible={tagModalVisible}
        title="添加标签"
        value={tagInput}
        onChangeText={setTagInput}
        onCancel={() => {
          setTagInput('');
          setTagModalVisible(false);
        }}
        onConfirm={handleAddTag}
        placeholder="输入标签名称"
      />

      <ConfirmDialog
        visible={!!confirmDeleteTag}
        title="删除标签"
        message={`确定要删除标签 #${confirmDeleteTag} 吗？`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => confirmDeleteTag && handleRemoveTag(confirmDeleteTag)}
        onCancel={() => setConfirmDeleteTag(null)}
        isDestructive
      />

      <ConfirmDialog
        visible={confirmDeleteNote}
        title="删除笔记"
        message="确定要删除这个笔记吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteNote(false)}
        isDestructive
      />

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
  scrollContent: {
    flexGrow: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveButton: {
    padding: 4,
  },
  iconButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 26,
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 18,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
