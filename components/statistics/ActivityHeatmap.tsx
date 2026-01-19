import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ActivityHeatmapProps {
  heatmapData: number[][];
}

/**
 * 活动热力图组件
 * 作用：显示本月笔记活动的热力图（5行7列）
 */
export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ heatmapData }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.heatmapContainer, { backgroundColor: colors.surface }]}>
      {/* Week day labels */}
      <View style={styles.weekLabels}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <Text key={index} style={[styles.weekLabel, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>
      {/* Heatmap grid */}
      <View style={styles.heatmapGrid}>
        {heatmapData.map((week, rowIndex) => (
          <View key={rowIndex} style={styles.heatmapRow}>
            {week.map((count, colIndex) => {
              let cellColor = colors.border;
              if (count === -1) {
                cellColor = colors.border + '20';
              } else if (count === 0) {
                cellColor = colors.border;
              } else if (count <= 2) {
                cellColor = colors.primary + '4D';
              } else if (count <= 5) {
                cellColor = colors.primary + '99';
              } else {
                cellColor = colors.primary;
              }

              return (
                <View
                  key={colIndex}
                  style={[
                    styles.heatmapCell,
                    { backgroundColor: cellColor }
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heatmapContainer: {
    borderRadius: 12,
    padding: 16,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  heatmapGrid: {
    gap: 4,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  heatmapCell: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
});
