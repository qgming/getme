import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIModel {
  id: string;
  name: string;
  description?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  isDefault?: boolean;
  models?: AIModel[];
  iconName?: string;
}

interface AIStore {
  providers: AIProvider[];
  addProvider: (provider: Omit<AIProvider, 'id'>) => void;
  updateProvider: (id: string, provider: Partial<AIProvider>) => void;
  deleteProvider: (id: string) => void;
  setDefaultProvider: (id: string) => void;
  loadProviders: () => Promise<void>;
}

const STORAGE_KEY = '@ai_providers';

// 默认的AI配置
const defaultProviders: AIProvider[] = [
  {
    id: 'default-openai',
    name: 'OpenAI',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    isDefault: true,
    iconName: 'OpenAI',
    models: [
      { id: 'gpt-4', name: 'GPT-4', description: '最强大的模型，适合复杂任务' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '快速且经济的模型' },
    ],
  },
];

export const useAIStore = create<AIStore>((set, get) => ({
  providers: defaultProviders,

  addProvider: (provider) => {
    const newProvider: AIProvider = {
      ...provider,
      id: Date.now().toString(),
      isDefault: false,
    };
    const updatedProviders = [...get().providers, newProvider];
    set({ providers: updatedProviders });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProviders));
  },

  updateProvider: (id, updates) => {
    const updatedProviders = get().providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    set({ providers: updatedProviders });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProviders));
  },

  deleteProvider: (id) => {
    const updatedProviders = get().providers.filter((p) => p.id !== id);
    set({ providers: updatedProviders });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProviders));
  },

  setDefaultProvider: (id) => {
    const updatedProviders = get().providers.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    set({ providers: updatedProviders });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProviders));
  },

  loadProviders: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const providers = JSON.parse(stored);
        set({ providers });
      }
    } catch (error) {
      console.error('Failed to load AI providers:', error);
    }
  },
}));
