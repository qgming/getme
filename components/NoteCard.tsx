import { MoreHorizontal } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Note, formatFullDateTime, getPreviewText } from '../types/Note';
import { ActionItem, ActionMenu } from './ActionMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { Toast } from './Toast';
import { useTheme } from '../hooks/useTheme';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

const NoteCardComponent: React.FC<NoteCardProps> = ({ note, onPress, onDelete }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const menuButtonRef = useRef<View>(null);

  // 处理删除
  const handleDelete = () => {
    setConfirmDelete(true);
  };

  // 处理复制
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(note.content);
      setToast({ visible: true, message: '笔记内容已复制到剪贴板', type: 'success' });
    } catch {
      setToast({ visible: true, message: '复制失败，请重试', type: 'error' });
    }
  };

  const handleMenuPress = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setShowMenu(true);
  };

  const menuActions: ActionItem[] = [
    {
      label: '复制笔记',
      icon: 'copy-outline',
      onPress: handleCopy,
    },
    {
      label: '删除笔记',
      icon: 'trash-outline',
      onPress: handleDelete,
      isDestructive: true,
    },
  ];

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => onPress(note)}
        onLongPress={handleMenuPress}
        activeOpacity={0.8}
      >
        {/* 顶部：创建时间 + 菜单按钮 */}
        <View style={styles.header}>
          <Text style={[styles.date, { color: colors.textQuaternary }]}>
            {formatFullDateTime(note.createdAt)}
          </Text>
          <TouchableOpacity
            ref={menuButtonRef}
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreHorizontal size={16} color={colors.textQuaternary} />
          </TouchableOpacity>
        </View>

        {/* 中间：内容预览 */}
        <View style={styles.contentContainer}>
          <Text
            style={[styles.preview, { color: colors.textSecondary }]}
            numberOfLines={10}
            lineBreakMode="tail"
          >
            {getPreviewText(note.content, 500)}
          </Text>
        </View>

        {/* 底部：标签栏 (如果有) */}
        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {note.tags.map((tag, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}
                  onPress={() => {
                    router.push({
                      pathname: '/tag-notes',
                      params: { tag },
                    } as any);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </TouchableOpacity>

      <ActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        anchorPosition={menuPosition}
        actions={menuActions}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="删除笔记"
        message="确定要删除这个笔记吗？"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => {
          onDelete(note.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
        isDestructive
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
};

// 使用 React.memo 优化性能，避免不必要的重新渲染
export const NoteCard = React.memo(NoteCardComponent, (prevProps, nextProps) => {
  // 只有当 note 的关键属性发生变化时才重新渲染
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.content === nextProps.note.content &&
    prevProps.note.createdAt === nextProps.note.createdAt &&
    JSON.stringify(prevProps.note.tags) === JSON.stringify(nextProps.note.tags)
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    fontWeight: '400',
  },
  menuButton: {
    padding: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  contentContainer: {
    marginBottom: 0,
  },
  preview: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
});
