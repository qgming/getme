import { create } from 'zustand';
import { ChatMessage } from '../services/aiChat';
import { getRecentChatMessages, saveChatMessage, deleteChatMessage } from '../database/chatMessages';

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
}));
