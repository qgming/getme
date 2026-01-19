import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ChatMessage } from '../../services/aiChat';

interface MessageBubbleProps {
  message: ChatMessage;
  onLongPress: (message: ChatMessage, event: any) => void;
}

/**
 * 消息气泡组件
 * 作用：显示单条聊天消息，支持长按操作
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onLongPress }) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onLongPress={(event) => onLongPress(message, event)}
      style={[
        styles.messageBubble,
        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
        { backgroundColor: message.role === 'user' ? colors.primary : colors.surface },
      ]}
    >
      <Text
        style={[
          styles.messageText,
          { color: message.role === 'user' ? '#fff' : colors.text },
        ]}
      >
        {message.content}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
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
