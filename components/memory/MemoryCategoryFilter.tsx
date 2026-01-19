import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MEMORY_CATEGORIES } from '../../types/Memory';

interface MemoryCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

/**
 * 记忆分类筛选组件
 * 作用：按分类筛选记忆（全部/个人/偏好/目标/事实/关系）
 */
export const MemoryCategoryFilter: React.FC<MemoryCategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
      {MEMORY_CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.value}
          style={[
            styles.categoryChip,
            {
              backgroundColor: selectedCategory === cat.value ? colors.primary : colors.surface,
            },
          ]}
          onPress={() => onCategoryChange(cat.value)}
        >
          <Text style={styles.categoryIcon}>{cat.icon}</Text>
          <Text
            style={[
              styles.categoryLabel,
              {
                color: selectedCategory === cat.value ? '#fff' : colors.text,
              },
            ]}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 14,
  },
});
