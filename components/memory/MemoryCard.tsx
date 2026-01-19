import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit2, Trash2, Check, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Memory, MEMORY_CATEGORIES } from '../../types/Memory';

interface MemoryCardProps {
  memory: Memory;
  isEditing: boolean;
  editingContent: string;
  onEditPress: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditContentChange: (text: string) => void;
  onDeletePress: () => void;
}

/**
 * 记忆卡片组件
 * 作用：显示单条记忆，支持查看、编辑、删除操作
 *
 * 按钮说明：
 * - 编辑按钮：编辑记忆内容
 * - 删除按钮：删除该条记忆
 * - 确认按钮：保存编辑
 * - 取消按钮：取消编辑
 */
export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  isEditing,
  editingContent,
  onEditPress,
  onEditSave,
  onEditCancel,
  onEditContentChange,
  onDeletePress,
}) => {
  const { colors } = useTheme();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getCategoryIcon = (category: string | null) => {
    const cat = MEMORY_CATEGORIES.find(c => c.value === category);
    return cat?.icon || '📋';
  };

  const getCategoryLabel = (category: string | null) => {
    const cat = MEMORY_CATEGORIES.find(c => c.value === category);
    return cat?.label || '未分类';
  };

  return (
    <View
      style={[
        styles.memoryCard,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.memoryHeader}>
        <View style={styles.memoryCategory}>
          <Text style={styles.memoryCategoryIcon}>{getCategoryIcon(memory.category)}</Text>
          <Text style={[styles.memoryCategoryText, { color: colors.textSecondary }]}>
            {getCategoryLabel(memory.category)}
          </Text>
        </View>
        <Text style={[styles.memoryTime, { color: colors.textQuaternary }]}>
          {formatTime(memory.createdAt)}
        </Text>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.editInput, { backgroundColor: colors.background, color: colors.text }]}
            value={editingContent}
            onChangeText={onEditContentChange}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.editButton} onPress={onEditSave}>
              <Check size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={onEditCancel}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={[styles.memoryContent, { color: colors.text }]}>{memory.content}</Text>
          <View style={styles.memoryActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
              <Edit2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onDeletePress}>
              <Trash2 size={16} color={colors.red} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  memoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryCategoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  memoryCategoryText: {
    fontSize: 12,
  },
  memoryTime: {
    fontSize: 12,
  },
  memoryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  memoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  editContainer: {
    gap: 8,
  },
  editInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
});
