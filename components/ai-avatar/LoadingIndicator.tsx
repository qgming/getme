import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * 加载指示器组件
 * 作用：显示AI正在思考的加载状态
 */
export const LoadingIndicator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface }]}>
      <ActivityIndicator size="small" color={colors.primary} />
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
});
