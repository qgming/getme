import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ActivityHeatmapProps {
  notes: Array<{ createdAt: string }>;
  width: number;
}

export function ActivityHeatmap({ notes, width }: ActivityHeatmapProps) {
  const { colors } = useTheme();

  const heatmapData = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 125); // ~18 weeks

    const activityMap = new Map<string, number>();

    notes.forEach(note => {
      const date = new Date(note.createdAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
    });

    const days: Array<{ date: Date; count: number; isToday: boolean }> = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.push({
        date: new Date(d),
        count: activityMap.get(dateKey) || 0,
        isToday: d.getTime() === endDate.getTime()
      });
    }

    return days;
  }, [notes]);

  const getColor = (count: number) => {
    if (count === 0) return colors.heatmap[0];
    if (count === 1) return colors.heatmap[1];
    if (count === 2) return colors.heatmap[2];
    if (count === 3) return colors.heatmap[3];
    return colors.heatmap[4];
  };

  const cellSize = (width - 17 * 4) / 18;
  const currentMonth = new Date().toLocaleDateString('zh-CN', { month: 'long' });
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('zh-CN', { month: 'long' });

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {heatmapData.map((day, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: getColor(day.count),
              },
              day.isToday && { borderWidth: 1, borderColor: colors.primaryDark },
            ]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: colors.textQuaternary }]}>{lastMonth}</Text>
        <Text style={[styles.label, { color: colors.textQuaternary }]}>{currentMonth}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    borderRadius: 2,
  },
  labels: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-around',
    paddingRight: 20,
  },
  label: {
    fontSize: 12,
  },
});
