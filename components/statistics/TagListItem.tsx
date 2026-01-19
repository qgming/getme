import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Hash, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface TagListItemProps {
  tag: string;
  onPress: () => void;
  onMorePress: (event: any) => void;
}

/**
 * 标签列表项组件
 * 作用：显示单个标签，支持点击查看和更多操作
 */
export const TagListItem: React.FC<TagListItemProps> = ({ tag, onPress, onMorePress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.tagItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.tagLeft}>
        <Hash size={18} color={colors.text} />
        <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
      </View>
      <TouchableOpacity
        onPress={onMorePress}
        style={styles.moreButton}
      >
        <MoreHorizontal size={18} color={colors.textQuaternary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagText: {
    fontSize: 16,
    marginLeft: 12,
  },
  moreButton: {
    padding: 4,
  },
});
