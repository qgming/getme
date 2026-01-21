import { create } from 'zustand';
import { Memory } from '../types/Memory';
import {
  deleteMemory as dbDeleteMemory,
  deleteMemories as dbDeleteMemories,
  getMemoriesByCategory,
  searchMemories as dbSearchMemories,
  getMemoryCount,
  getLastExtractionTime,
  clearAllMemories,
} from '../database/memories';

interface MemoryStore {
  memories: Memory[];
  isLoading: boolean;
  selectedCategory: string;
  searchQuery: string;
  selectedMemories: Set<string>;

  loadMemories: () => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  deleteSelectedMemories: () => Promise<void>;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  toggleMemorySelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  refreshMemories: () => Promise<void>;
  getStatistics: () => Promise<{ count: number; lastExtraction: string | null }>;
  clearAllMemories: () => Promise<void>;
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  memories: [],
  isLoading: false,
  selectedCategory: 'all',
  searchQuery: '',
  selectedMemories: new Set(),

  loadMemories: async () => {
    set({ isLoading: true });
    try {
      const { selectedCategory, searchQuery } = get();

      let memories: Memory[];
      if (searchQuery.trim()) {
        memories = await dbSearchMemories(searchQuery, selectedCategory, 100);
      } else {
        memories = await getMemoriesByCategory(selectedCategory);
      }

      set({ memories, isLoading: false });
    } catch (error) {
      console.error('Failed to load memories:', error);
      set({ isLoading: false });
    }
  },

  deleteMemory: async (id: string) => {
    await dbDeleteMemory(id);
    set((state) => ({
      memories: state.memories.filter(m => m.id !== id),
      selectedMemories: new Set([...state.selectedMemories].filter(sid => sid !== id)),
    }));
  },

  deleteSelectedMemories: async () => {
    const { selectedMemories } = get();
    const ids = Array.from(selectedMemories);

    if (ids.length === 0) return;

    await dbDeleteMemories(ids);
    set((state) => ({
      memories: state.memories.filter(m => !selectedMemories.has(m.id)),
      selectedMemories: new Set(),
    }));
  },

  setCategory: (category: string) => {
    set({ selectedCategory: category, selectedMemories: new Set() });
    get().loadMemories();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, selectedMemories: new Set() });
    // Debounce will be handled in the UI component
  },

  toggleMemorySelection: (id: string) => {
    set((state) => {
      const newSelection = new Set(state.selectedMemories);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedMemories: newSelection };
    });
  },

  clearSelection: () => {
    set({ selectedMemories: new Set() });
  },

  selectAll: () => {
    const { memories } = get();
    set({ selectedMemories: new Set(memories.map(m => m.id)) });
  },

  refreshMemories: async () => {
    await get().loadMemories();
  },

  getStatistics: async () => {
    const count = await getMemoryCount();
    const lastExtraction = await getLastExtractionTime();
    return { count, lastExtraction };
  },

  clearAllMemories: async () => {
    await clearAllMemories();
    set({ memories: [], selectedMemories: new Set() });
  },
}));
