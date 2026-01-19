import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface StreamingMessageProps {
  content: string;
}

/**
 * 流式消息组件
 * 作用：显示正在流式输出的AI消息
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({ content }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface }]}>
      <Text style={[styles.messageText, { color: colors.text }]}>
        {content}
      </Text>
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
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
});
