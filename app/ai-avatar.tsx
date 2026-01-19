import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Brain } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { ChatInput } from '../components/ChatInput';
import { ActionMenu, ActionItem } from '../components/ActionMenu';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTheme } from '../hooks/useTheme';
import { ChatMessage, createDefaultSystemPrompt } from '../services/aiChat';
import { sendChatMessageWithTools } from '../services/aiChatWithTools';
import { useChatStore } from '../stores/chatStore';
import * as Clipboard from 'expo-clipboard';

// 格式化时间显示
const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  const oneDay = 24 * 60 * 60 * 1000;

  // 今天
  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 昨天
  const yesterday = new Date(now.getTime() - oneDay);
  if (date.getDate() === yesterday.getDate()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // 其他日期
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 判断是否需要显示时间分隔（超过1小时）
const shouldShowTimestamp = (currentMsg: ChatMessage, prevMsg?: ChatMessage): boolean => {
  if (!prevMsg) return true;
  const timeDiff = currentMsg.timestamp - prevMsg.timestamp;
  const oneHour = 60 * 60 * 1000;
  return timeDiff > oneHour;
};

export default function AIAvatarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { messages, isLoading, streamingContent, loadMessages, addMessage, setLoading, setStreamingContent, clearStreamingContent, deleteMessage } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [systemMessage, setSystemMessage] = useState<ChatMessage>({
    id: 'system',
    role: 'system',
    content: '',
    timestamp: Date.now(),
  });
  const scrollViewRef = useRef<ScrollView>(null);

  // ActionMenu 状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

  // Toast 状态
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ConfirmDialog 状态
  const [confirmVisible, setConfirmVisible] = useState(false);

  // 工具调用状态
  const [toolCallStatus, setToolCallStatus] = useState<string | null>(null);

  // 初始化：加载系统提示词
  useEffect(() => {
    const initSystemPrompt = async () => {
      const prompt = await createDefaultSystemPrompt();
      setSystemMessage({
        id: 'system',
        role: 'system',
        content: prompt,
        timestamp: Date.now(),
      });
    };
    initSystemPrompt();
  }, []);

  // 初始化：加载历史消息
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 处理长按消息
  const handleLongPress = (message: ChatMessage, event: any) => {
    setSelectedMessage(message);
    setMenuPosition({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setMenuVisible(true);
  };

  // 复制消息内容
  const handleCopyMessage = async () => {
    if (selectedMessage) {
      await Clipboard.setStringAsync(selectedMessage.content);
      setToastMessage('已复制到剪贴板');
      setToastVisible(true);
    }
  };

  // 删除消息
  const handleDeleteMessage = () => {
    if (selectedMessage) {
      setConfirmVisible(true);
    }
  };

  // 确认删除消息
  const handleConfirmDelete = async () => {
    if (selectedMessage) {
      await deleteMessage(selectedMessage.id);
      setConfirmVisible(false);
      setToastMessage('消息已删除');
      setToastVisible(true);
    }
  };

  // 跳转到记忆管理页面
  const handleMemoryPress = () => {
    router.push('/memory-management');
  };

  // ActionMenu 操作项
  const menuActions: ActionItem[] = [
    {
      label: '复制',
      icon: 'copy-outline',
      onPress: handleCopyMessage,
    },
    {
      label: '删除',
      icon: 'trash-outline',
      onPress: handleDeleteMessage,
      isDestructive: true,
    },
  ];

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    await addMessage(userMessage);
    setInputText('');
    setLoading(true);
    clearStreamingContent();

    try {
      const assistantMessageId = `assistant-${Date.now()}`;

      await sendChatMessageWithTools([systemMessage, ...messages, userMessage], {
        onStream: (chunk: string) => {
          setStreamingContent(chunk);
        },
        onComplete: async (fullContent: string) => {
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
          };
          await addMessage(assistantMessage);
          clearStreamingContent();
          setToolCallStatus(null);
          setLoading(false);
        },
        onToolCall: (toolName: string, args: any) => {
          const friendlyNames: { [key: string]: string } = {
            'get_notes_by_tags': '正在检索标签笔记',
            'get_notes_by_time_range': '正在检索时间范围笔记',
            'search_notes_content': '正在搜索笔记内容'
          };
          setToolCallStatus(friendlyNames[toolName] || '正在调用工具');
        },
        onToolResult: (toolName: string, result: any) => {
          setToolCallStatus(null);
        },
        onError: (error: Error) => {
          console.error('AI对话错误:', error);
          setLoading(false);
          clearStreamingContent();
          setToolCallStatus(null);
        },
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      setLoading(false);
      clearStreamingContent();
      setToolCallStatus(null);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : undefined;
          const showTime = shouldShowTimestamp(message, prevMessage);

          return (
            <React.Fragment key={message.id}>
              {/* 时间分隔 */}
              {showTime && (
                <View style={styles.timestampContainer}>
                  <Text style={[styles.timestampText, { color: colors.textTertiary }]}>
                    {formatMessageTime(message.timestamp)}
                  </Text>
                </View>
              )}

              {/* 消息气泡 */}
              <Pressable
                onLongPress={(event) => handleLongPress(message, event)}
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
            </React.Fragment>
          );
        })}

        {/* 流式输出中的消息 */}
        {isLoading && streamingContent && (
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface }]}>
            <Text style={[styles.messageText, { color: colors.text }]}>
              {streamingContent}
            </Text>
          </View>
        )}

        {/* 工具调用指示器 */}
        {toolCallStatus && (
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface }]}>
            <View style={styles.toolCallIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.toolCallText, { color: colors.textSecondary }]}>
                {toolCallStatus}
              </Text>
            </View>
          </View>
        )}

        {/* 加载指示器 */}
        {isLoading && !streamingContent && !toolCallStatus && (
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>

      {/* 输入框组件 */}
      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        disabled={isLoading}
        placeholder="有问题尽管问..."
      />

      {/* ActionMenu 组件 */}
      <ActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorPosition={menuPosition}
        actions={menuActions}
      />

      {/* Toast 组件 */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        onHide={() => setToastVisible(false)}
      />

      {/* ConfirmDialog 组件 */}
      <ConfirmDialog
        visible={confirmVisible}
        title="删除消息"
        message="确定要删除这条消息吗？"
        confirmText="删除"
        cancelText="取消"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader
          title="AI分身"
          showBackButton
          rightElement={<Brain size={20} color={colors.text} />}
          onRightPress={handleMemoryPress}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 100,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
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
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timestampText: {
    fontSize: 12,
    opacity: 0.6,
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
