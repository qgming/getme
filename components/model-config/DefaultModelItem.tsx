import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { AIFeature } from '../../stores/defaultModelStore';

interface DefaultModelItemProps {
  feature: AIFeature;
  featureName: string;
  currentModel: string;
  onPress: () => void;
}

/**
 * Default model item component
 * 作用：显示单个AI功能的默认模型选择项
 */
export function DefaultModelItem({ feature, featureName, currentModel, onPress }: DefaultModelItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {featureName}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardValue, { color: colors.textQuaternary }]}>
          {currentModel}
        </Text>
        <ChevronRight size={20} color={colors.textQuaternary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 14,
    marginRight: 4,
  },
});
