import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
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
      {message.role === 'user' ? (
        <Text
          style={[
            styles.messageText,
            { color: '#fff' },
          ]}
        >
          {message.content}
        </Text>
      ) : (
        <Markdown
          style={{
            body: { color: colors.text },
            heading1: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
            heading2: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
            heading3: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginVertical: 4 },
            paragraph: { color: colors.text, fontSize: 15, lineHeight: 20, marginVertical: 2 },
            strong: { fontWeight: 'bold' },
            em: { fontStyle: 'italic' },
            code_inline: { backgroundColor: colors.card, color: colors.primary, paddingHorizontal: 4, borderRadius: 4, fontSize: 14 },
            code_block: { backgroundColor: colors.card, padding: 8, borderRadius: 6, marginVertical: 4, fontSize: 14 },
            fence: { backgroundColor: colors.card, padding: 8, borderRadius: 6, marginVertical: 4, fontSize: 14 },
            bullet_list: { marginVertical: 4 },
            ordered_list: { marginVertical: 4 },
            list_item: { marginVertical: 2 },
          }}
        >
          {message.content}
        </Markdown>
      )}
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
