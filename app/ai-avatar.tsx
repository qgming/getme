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
import { ActionMenu, ActionItem } from '../components/ActionMenu';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  MessageBubble,
  MessageTimestamp,
  ToolCallIndicator,
  LoadingIndicator,
  ChatInput,
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
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const statusQueueRef = useRef<{ message: string; minDuration: number }[]>([]);
  const isProcessingQueueRef = useRef(false);

  // 处理状态队列
  const processStatusQueue = async () => {
    if (isProcessingQueueRef.current || statusQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    while (statusQueueRef.current.length > 0) {
      const item = statusQueueRef.current.shift();
      if (!item) break;

      setToolCallStatus(item.message);

      // 如果这是最后一个项目，持续显示直到被新状态替换或清空
      if (statusQueueRef.current.length === 0) {
        // 不设置超时，让状态持续显示
        isProcessingQueueRef.current = false;
        return;
      }

      // 否则按照设定的时间显示
      await new Promise(resolve => setTimeout(resolve, item.minDuration));
    }

    isProcessingQueueRef.current = false;
  };

  // 添加状态到队列
  const addStatusToQueue = (message: string, minDuration: number = 1000) => {
    // 如果队列正在处理且已经空了（最后一个状态正在持续显示）
    // 直接添加新状态并重新启动队列处理
    if (isProcessingQueueRef.current && statusQueueRef.current.length === 0) {
      statusQueueRef.current.push({ message, minDuration });
      isProcessingQueueRef.current = false;
      processStatusQueue();
    } else {
      statusQueueRef.current.push({ message, minDuration });
      processStatusQueue();
    }
  };

  // 清空队列
  const clearStatusQueue = () => {
    statusQueueRef.current = [];
    isProcessingQueueRef.current = false;
    setToolCallStatus(null);
  };

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

  // 终止当前请求
  const handleAbort = () => {
    if (abortControllerRef.current) {
      console.log('用户终止请求');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      clearStatusQueue();
      setLoading(false);
    }
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

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      await sendChatMessage([systemMessage, ...messages, userMessage], {
        abortSignal: abortControllerRef.current.signal,
        onComplete: async (fullContent: string) => {
          // 清空队列并添加完整消息
          clearStatusQueue();

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
          };
          await addMessage(assistantMessage);

          setLoading(false);
          abortControllerRef.current = null;
        },
        onThinking: (message: string) => {
          // 思考状态添加到队列，显示时间较短
          if (message) {
            addStatusToQueue(message, 300); // 思考状态显示0.3秒
          }
        },
        onToolCall: (toolName: string, args: any) => {
          const friendlyNames: { [key: string]: string } = {
            'get_notes_by_tags': '查找标签笔记',
            'get_notes_by_time_range': '查找时间范围笔记',
            'search_notes_content': '搜索笔记内容',
            'get_memories': '检索长期记忆'
          };
          const friendlyName = friendlyNames[toolName] || '处理中';

          // 根据参数生成更详细的提示
          let detailMessage = friendlyName;
          if (toolName === 'get_notes_by_tags' && args.tags) {
            detailMessage = `查找「${args.tags.join('、')}」标签`;
          } else if (toolName === 'get_notes_by_time_range' && args.days_ago) {
            detailMessage = `查找最近 ${args.days_ago} 天的笔记`;
          } else if (toolName === 'search_notes_content' && args.query) {
            detailMessage = `搜索「${args.query}」`;
          } else if (toolName === 'get_memories' && args.query) {
            detailMessage = `检索记忆：${args.query}`;
          }

          // 工具调用添加到队列，显示1.5秒
          addStatusToQueue(detailMessage, 1500);
        },
        onToolResult: (toolName: string, result: any) => {
          // 工具执行完成，不做任何操作
          // 状态会在队列中自动处理
        },
        onError: (error: Error) => {
          console.error('AI对话错误:', error);
          clearStatusQueue();
          setLoading(false);
          abortControllerRef.current = null;

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
      clearStatusQueue();
      setLoading(false);
      abortControllerRef.current = null;

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
        onAbort={handleAbort}
        disabled={isLoading}
        isLoading={isLoading}
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
