import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * 记忆列表空状态组件
 * 作用：当没有记忆或搜索无结果时显示提示信息
 */
export const MemoryEmptyState: React.FC<{ hasSearchQuery: boolean }> = ({ hasSearchQuery }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {hasSearchQuery ? '未找到匹配的记忆' : '暂无记忆记录'}
      </Text>
      <Text style={[styles.emptyHint, { color: colors.textQuaternary }]}>
        记忆会在对话达到20条时自动提取
      </Text>
    </View>
  );
};

/**
 * 记忆列表加载状态组件
 * 作用：显示加载动画
 */
export const MemoryLoadingState: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
