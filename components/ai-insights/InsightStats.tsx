import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Filter } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface InsightStatsProps {
  selectedCount: number;
  totalCount: number;
  totalTags: number;
  onFilterPress: () => void;
}

/**
 * AI洞察统计组件
 * 作用：显示已选择的笔记数量和总统计信息，包含筛选按钮
 */
export const InsightStats: React.FC<InsightStatsProps> = ({
  selectedCount,
  totalCount,
  totalTags,
  onFilterPress,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsInfo}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            已选择 <Text style={[styles.statsHighlight, { color: colors.primary }]}>{selectedCount}</Text> 条笔记
          </Text>
          <Text style={[styles.statsDetail, { color: colors.textMuted }]}>
            共 {totalCount} 条 · {totalTags} 个标签
          </Text>
        </View>
        <TouchableOpacity
          onPress={onFilterPress}
          style={[styles.filterButton, { backgroundColor: colors.background }]}
        >
          <Filter size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsInfo: {
    flex: 1,
  },
  statsText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  statsHighlight: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsDetail: {
    fontSize: 13,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
