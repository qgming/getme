import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ToolCallIndicatorProps {
  status: string;
}

/**
 * 工具调用指示器组件
 * 作用：显示AI正在执行的工具调用状态
 */
export const ToolCallIndicator: React.FC<ToolCallIndicatorProps> = ({ status }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface }]}>
      <View style={styles.toolCallIndicator}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.toolCallText, { color: colors.textSecondary }]}>
          {status}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  toolCallIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolCallText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
