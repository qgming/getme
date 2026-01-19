import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface MemoryExtractionButtonProps {
  isExtracting: boolean;
  onPress: () => void;
}

/**
 * 手动提取记忆按钮组件
 * 作用：手动触发从最近对话中提取记忆
 */
export const MemoryExtractionButton: React.FC<MemoryExtractionButtonProps> = ({
  isExtracting,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.extractButton, { backgroundColor: colors.primary }]}
      onPress={onPress}
      disabled={isExtracting}
    >
      {isExtracting ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.extractButtonText}>手动提取最近对话记忆</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  extractButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  extractButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
