import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface MemorySelectionBarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete: () => void;
}

/**
 * 记忆批量选择操作栏组件
 * 作用：显示已选择数量，提供全选、取消、批量删除按钮
 */
export const MemorySelectionBar: React.FC<MemorySelectionBarProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.selectionBar, { backgroundColor: colors.surface }]}>
      <Text style={[styles.selectionText, { color: colors.text }]}>
        已选择 {selectedCount} 条
      </Text>
      <View style={styles.selectionActions}>
        <TouchableOpacity style={styles.selectionButton} onPress={onSelectAll}>
          <Text style={[styles.selectionButtonText, { color: colors.primary }]}>全选</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectionButton} onPress={onClearSelection}>
          <Text style={[styles.selectionButtonText, { color: colors.textSecondary }]}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectionButton} onPress={onBatchDelete}>
          <Text style={[styles.selectionButtonText, { color: colors.red }]}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
