import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import { DialogInput } from '../components/DialogInput';
import { useNoteStore } from '../stores';
import { formatFullDateTime, Note, validateNote } from '../types/Note';
import { useTheme } from '../hooks/useTheme';

export default function NoteEditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const noteStore = useNoteStore();
  const { createNote, updateNoteSilently, deleteNoteById } = noteStore;

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

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const contentRef = useRef('');
  const tagsRef = useRef<string[]>([]);

  // 简化的键盘处理：当键盘显示时自动滚动到底部
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // 延迟滚动，确保键盘完全显示
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
    };
  }, []);

  // 加载传入的笔记数据
  useEffect(() => {
    const loadNote = async () => {
      try {
        console.log('NoteEditor开始加载, params.noteId:', params.noteId);

        if (params.noteId) {
          const id = params.noteId as string;
          console.log('正在加载笔记ID:', id);

          const note = await noteStore.getNoteById(id);
          console.log('获取到的笔记数据:', note);

          if (note) {
            console.log('成功加载笔记，设置内容:', note.content.substring(0, 50));
            contentRef.current = note.content;
            tagsRef.current = note.tags || [];
            setContent(note.content);
            setOriginalContent(note.content);
            setTags(note.tags || []);
            setOriginalTags(note.tags || []);
            setNoteId(note.id);
            setCreatedAt(note.createdAt);
          } else {
            console.log('未找到ID为', id, '的笔记');
            Alert.alert('错误', '未找到该笔记');
          }
        } else {
          console.log('没有noteId参数，新建笔记模式');
          // 新建笔记时，设置原始内容为空
          setOriginalContent('');
          setOriginalTags([]);
        }
      } catch (error) {
        console.error('加载笔记失败:', error);
        Alert.alert('错误', '加载笔记失败');
      }
    };

    loadNote();
  }, [params.noteId, noteStore]);

  // 处理保存
  const handleSave = useCallback(async (showFeedback = true) => {
    if (!contentRef.current.trim()) return;

    const noteData = {
      id: noteId || undefined,
      content: contentRef.current.trim(),
      tags: tagsRef.current,
    };

    const validation = validateNote(noteData);
    if (!validation.valid) {
      if (showFeedback) Alert.alert('提示', validation.errors.join(', '));
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (noteId) {
        // 更新现有笔记
        const existingNote: Note = {
          ...noteData,
          id: noteId,
          createdAt: createdAt,
          updatedAt: new Date().toISOString(),
        };
        await updateNoteSilently(existingNote);
      } else {
        // 创建新笔记
        const savedNote = await createNote(noteData);
        setNoteId(savedNote.id);
        setCreatedAt(savedNote.createdAt);
      }

      // 保存成功后更新原始内容，标记为无变化
      setOriginalContent(contentRef.current.trim());
      setOriginalTags(tagsRef.current);

      if (showFeedback) {
        Alert.alert('成功', '笔记已保存');
      }
    } catch (error) {
      console.error('保存失败:', error);
      if (showFeedback) Alert.alert('错误', '保存失败，请重试');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [noteId, createdAt, updateNoteSilently, createNote]);

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


  // 处理返回
  const handleBack = () => {
    const hasContentChange = contentRef.current.trim() !== originalContent.trim();
    const hasTagsChange = JSON.stringify(tagsRef.current) !== JSON.stringify(originalTags);
    if (contentRef.current.trim() && (hasContentChange || hasTagsChange) && !isSavingRef.current) {
      handleSave(false);
    }
    router.back();
  };

  // 删除笔记
  const handleDelete = () => {
    if (!noteId) return;

    Alert.alert(
      '删除笔记',
      '确定要删除这个笔记吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNoteById(noteId);
              router.back();
            } catch (error) {
              console.error('删除失败:', error);
              Alert.alert('错误', '删除失败，请重试');
            }
          },
        },
      ]
    );
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
  };

  // 渲染头部
  const renderHeader = () => {
    const contentChanged = content.trim() !== originalContent.trim();
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
    const showSaveButton = contentChanged || tagsChanged;

    return (
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={showSaveButton ? handleManualSave : handleBack}
          activeOpacity={0.7}
        >
          {showSaveButton ? (
            <Ionicons name="checkmark" size={28} color={colors.primaryDark} />
          ) : (
            <Ionicons name="chevron-back" size={28} color={colors.textQuaternary} />
          )}
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {isSaving && <ActivityIndicator size="small" color={colors.blue} style={{ marginRight: 8 }} />}
          <View ref={menuButtonRef}>
            <TouchableOpacity style={styles.headerButton} onPress={handleShowMenu}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.textQuaternary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}

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
                  style={[styles.tag, { backgroundColor: colors.blueLight }]}
                  onPress={() => handleRemoveTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, { color: colors.blue }]}>#{tag}</Text>
                  <Ionicons name="close-circle" size={14} color={colors.blue} style={styles.tagClose} />
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
            autoFocus={true}
          />
        </ScrollView>

        {/* 底部工具栏 */}
        <View style={[styles.toolbar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: colors.surface }]}
            onPress={() => setTagModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag-outline" size={22} color={colors.blue} />
          </TouchableOpacity>
        </View>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
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
    minHeight: 200,
    paddingHorizontal: 18,
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
  tagClose: {
    marginLeft: 2,
  },
  toolbarSafeArea: {},
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderTopWidth: 1,
  },
  toolbarButton: {
    padding: 6,
    borderRadius: 8,
  },
});
