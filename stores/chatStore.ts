import { create } from 'zustand';
import { ChatMessage } from '../services/aiChat';
import { getRecentChatMessages, saveChatMessage, deleteChatMessage, clearAllChatMessages } from '../database/chatMessages';
import { extractMemoriesInBackground } from '../services/aiMemoryExtraction';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingContent: string;

  // 加载历史消息
  loadMessages: () => Promise<void>;

  // 添加消息
  addMessage: (message: ChatMessage) => Promise<void>;

  // 设置加载状态
  setLoading: (loading: boolean) => void;

  // 设置流式内容
  setStreamingContent: (content: string) => void;

  // 清空流式内容
  clearStreamingContent: () => void;

  // 删除消息
  deleteMessage: (messageId: string) => Promise<void>;

  // 清空所有消息
  clearAllMessages: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  streamingContent: '',

  loadMessages: async () => {
    const historyMessages = await getRecentChatMessages(500);
    set({ messages: historyMessages });
  },

  addMessage: async (message: ChatMessage) => {
    await saveChatMessage(message);
    set((state) => ({ messages: [...state.messages, message] }));

    // Trigger memory extraction every 20 conversation messages
    const conversationMessages = get().messages.filter(m => m.role !== 'system');
    if (conversationMessages.length % 20 === 0 && conversationMessages.length > 0) {
      console.log(`[记忆提取] 达到${conversationMessages.length}条对话，触发记忆提取`);
      extractMemoriesInBackground(conversationMessages.slice(-20));
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setStreamingContent: (content: string) => {
    set((state) => ({ streamingContent: state.streamingContent + content }));
  },

  clearStreamingContent: () => {
    set({ streamingContent: '' });
  },

  deleteMessage: async (messageId: string) => {
    await deleteChatMessage(messageId);
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));
  },

  clearAllMessages: async () => {
    await clearAllChatMessages();
    set({ messages: [] });
  },
}));
