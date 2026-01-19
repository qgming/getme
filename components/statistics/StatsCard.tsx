import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { formatWordCount } from './utils';

interface StatsCardProps {
  notes: number;
  days: number;
  words: number;
  tags: number;
}

/**
 * 统计卡片组件
 * 作用：显示笔记、天数、字数、标签的统计数据
 */
export const StatsCard: React.FC<StatsCardProps> = ({ notes, days, words, tags }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>{notes}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>笔记</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>{days}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>天</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>{formatWordCount(words)}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>字</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>{tags}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>标签</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 6,
  },
});
