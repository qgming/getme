import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import { useNoteStore } from '../stores';
import { formatFullDateTime, Note, validateNote } from '../types/Note';

export default function NoteEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const noteStore = useNoteStore();
  const { createNote, updateNote, deleteNoteById } = noteStore;

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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
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

  // 检查内容是否有变化
  const hasChanges = () => {
    const contentChanged = content.trim() !== originalContent.trim();
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(originalTags);
    return contentChanged || tagsChanged;
  };

  // 处理返回并自动保存（仅在有变化且未手动保存时）
  const handleBack = async () => {
    if (hasChanges() && content.trim() && !isSaving) {
      await handleSave(false);
    }
    router.back();
  };

  // 处理保存
  const handleSave = async (showFeedback = true) => {
    if (!content.trim()) return;

    const noteData = {
      id: noteId || undefined,
      content: content.trim(),
      tags: tags,
    };

    const validation = validateNote(noteData);
    if (!validation.valid) {
      if (showFeedback) Alert.alert('提示', validation.errors.join(', '));
      return;
    }

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
        await updateNote(existingNote);
      } else {
        // 创建新笔记
        const savedNote = await createNote(noteData);
        setNoteId(savedNote.id);
        setCreatedAt(savedNote.createdAt);
      }

      // 保存成功后更新原始内容，标记为无变化
      setOriginalContent(content.trim());
      setOriginalTags(tags);

      if (showFeedback) {
        Alert.alert('成功', '笔记已保存');
      }
    } catch (error) {
      console.error('保存失败:', error);
      if (showFeedback) Alert.alert('错误', '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
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
    if (!hasChanges() || isSaving) return;
    await handleSave(false);
  };

  // 渲染头部
  const renderHeader = () => {
    const showSaveButton = hasChanges();

    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={showSaveButton ? handleManualSave : handleBack}
          activeOpacity={0.7}
        >
          {showSaveButton ? (
            <Ionicons name="checkmark" size={28} color="#10b981" />
          ) : (
            <Ionicons name="chevron-back" size={28} color="#9ca3af" />
          )}
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {isSaving && <ActivityIndicator size="small" color="#6366f1" style={{ marginRight: 8 }} />}
          <View ref={menuButtonRef}>
            <TouchableOpacity style={styles.headerButton} onPress={handleShowMenu}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // 渲染底部工具栏
  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <TouchableOpacity style={styles.toolbarButton}>
        <MaterialCommunityIcons name="pound" size={24} color="#4b5563" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolbarButton}>
        <Ionicons name="image-outline" size={24} color="#4b5563" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolbarButton}>
        <MaterialCommunityIcons name="format-bold" size={24} color="#4b5563" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolbarButton}>
        <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#4b5563" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolbarButton}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#4b5563" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderHeader()}

        <ScrollView
          ref={scrollViewRef}
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          contentInset={{ bottom: keyboardHeight }}
          scrollIndicatorInsets={{ bottom: keyboardHeight }}
        >
          <Text style={styles.dateText}>{formatFullDateTime(createdAt)}</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="输入内容..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#d1d5db"
            autoFocus={true}
          />
        </ScrollView>

        {renderToolbar()}
      </View>

      <ActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorPosition={anchorPosition}
        actions={menuActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  contentInput: {
    fontSize: 18,
    lineHeight: 26,
    color: '#374151',
    minHeight: 200,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingBottom: Platform.OS === 'ios' ? 0 : 12,
  },
  toolbarButton: {
    padding: 8,
  },
});
