import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import { Alert, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Note, formatFullDateTime, getPreviewText } from '../types/Note';
import { ActionItem, ActionMenu } from './ActionMenu';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const menuButtonRef = useRef<View>(null);

  // 处理删除
  const handleDelete = () => {
    Alert.alert(
      '删除笔记',
      '确定要删除这个笔记吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => onDelete(note.id),
        },
      ]
    );
  };

  // 处理复制
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(note.content);
      Alert.alert('成功', '笔记内容已复制到剪贴板');
    } catch {
      Alert.alert('错误', '复制失败，请重试');
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
        style={styles.card}
        onPress={() => {
          console.log('NoteCard clicked, note ID:', note.id);
          onPress(note);
        }}
        onLongPress={handleMenuPress}
        activeOpacity={0.8}
      >
        {/* 顶部：创建时间 + 菜单按钮 */}
        <View style={styles.header}>
          <Text style={styles.date}>
            {formatFullDateTime(note.createdAt)}
          </Text>
          <TouchableOpacity
            ref={menuButtonRef}
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* 中间：内容预览 */}
        <View style={styles.contentContainer}>
          <Text
            style={styles.preview}
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
              // 统一使用浅蓝色风格，模仿 flomo
              return (
                <View
                  key={index}
                  style={styles.tag}
                >
                  <Text style={styles.tagText}>
                    #{tag}
                  </Text>
                </View>
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
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6', // 添加极浅的边框来平滑边缘
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: '#9ca3af', // 浅灰色日期
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
    backgroundColor: '#eff6ff', // 浅蓝色背景
  },
  tagText: {
    fontSize: 13,
    color: '#3b82f6', // 蓝色文字
    fontWeight: '500',
  },
  contentContainer: {
    marginBottom: 0,
  },
  preview: {
    fontSize: 16,
    color: '#374151', // 深灰色内容
    lineHeight: 26, // 增加行高，提升阅读体验
    letterSpacing: 0.3,
  },
});
