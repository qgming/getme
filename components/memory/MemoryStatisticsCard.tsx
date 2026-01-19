import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface MemoryStatisticsCardProps {
  count: number;
  lastExtraction: string | null;
}

/**
 * 记忆统计卡片组件
 * 作用：显示总记忆数和最近提取时间
 */
export const MemoryStatisticsCard: React.FC<MemoryStatisticsCardProps> = ({
  count,
  lastExtraction,
}) => {
  const { colors } = useTheme();

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '未提取';
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

  return (
    <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>{count}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>总记忆数</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {formatTime(lastExtraction)}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>最近提取</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
});
