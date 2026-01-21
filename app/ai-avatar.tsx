import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Brain } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { ChatInput } from '../components/ChatInput';
import { ActionMenu, ActionItem } from '../components/ActionMenu';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  MessageBubble,
  MessageTimestamp,
  ToolCallIndicator,
  LoadingIndicator,
  shouldShowTimestamp,
} from '../components/ai-avatar';
import { useTheme } from '../hooks/useTheme';
import { ChatMessage, createDefaultSystemPrompt, sendChatMessage } from '../services/aiChat';
import { useChatStore } from '../stores/chatStore';
import * as Clipboard from 'expo-clipboard';

export default function AIAvatarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { messages, isLoading, loadMessages, addMessage, setLoading, deleteMessage } = useChatStore();
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

  // 将消息按空行分割成多条消息
  const splitMessageByBlankLines = (content: string): string[] => {
    // 按连续的空行（两个或多个换行符）分割
    const parts = content.split(/\n\s*\n+/);
    // 过滤掉空字符串
    return parts.filter(part => part.trim().length > 0);
  };

  // 延迟函数
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    try {
      await sendChatMessage([systemMessage, ...messages, userMessage], {
        onComplete: async (fullContent: string) => {
          // 将消息按空行分割
          const messageParts = splitMessageByBlankLines(fullContent);

          // 如果只有一条消息，直接发送
          if (messageParts.length === 1) {
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: fullContent,
              timestamp: Date.now(),
            };
            await addMessage(assistantMessage);
          } else {
            // 多条消息，逐条发送，每条之间有延迟
            for (let i = 0; i < messageParts.length; i++) {
              if (i > 0) {
                // 每条消息之间延迟 800-1500ms，模拟真实打字
                await delay(800 + Math.random() * 700);
              }

              const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}-${i}`,
                role: 'assistant',
                content: messageParts[i].trim(),
                timestamp: Date.now(),
              };
              await addMessage(assistantMessage);
            }
          }

          setToolCallStatus(null);
          setLoading(false);
        },
        onThinking: (message: string) => {
          // 只在没有工具调用状态时显示思考中
          if (!toolCallStatus && message) {
            setToolCallStatus(message);
          } else if (!message) {
            // 清空思考状态，但保留工具调用状态
            if (toolCallStatus === '正在思考中...') {
              setToolCallStatus(null);
            }
          }
        },
        onToolCall: (toolName: string, args: any) => {
          const friendlyNames: { [key: string]: string } = {
            'get_notes_by_tags': '正在查找相关笔记',
            'get_notes_by_time_range': '正在查找最近的笔记',
            'search_notes_content': '正在搜索笔记内容',
            'get_memories': '正在检索记忆'
          };
          setToolCallStatus(friendlyNames[toolName] || '正在处理');
        },
        onToolResult: (toolName: string, result: any) => {
          // 工具执行完成后，显示整理回答的状态
          setToolCallStatus('正在整理回答');
        },
        onError: (error: Error) => {
          console.error('AI对话错误:', error);
          setLoading(false);
          setToolCallStatus(null);

          // 显示错误提示
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: '抱歉，我遇到了一些问题，请稍后再试。',
            timestamp: Date.now(),
          };
          addMessage(errorMessage);
        },
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      setLoading(false);
      setToolCallStatus(null);

      // 显示错误提示
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，发送消息时出现了错误。',
        timestamp: Date.now(),
      };
      await addMessage(errorMessage);
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
              {showTime && <MessageTimestamp timestamp={message.timestamp} />}
              <MessageBubble message={message} onLongPress={handleLongPress} />
            </React.Fragment>
          );
        })}

        {toolCallStatus && <ToolCallIndicator status={toolCallStatus} />}

        {isLoading && !toolCallStatus && <LoadingIndicator />}
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
});
