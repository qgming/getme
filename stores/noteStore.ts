import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';
import {
  initDatabase,
  getAllNotes,
  saveNote,
  deleteNote,
  searchNotes,
  getStats,
  getNoteById
} from '../services/database';

// 定义状态接口
interface NoteState {
  // 状态
  notes: Note[];
  loading: boolean;
  initialized: boolean;
  pinnedTags: string[];

  // 计算属性
  totalNotes: number;
  monthlyNotes: number;
  taggedNotes: number;

  // 动作
  initialize: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  createNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (note: Note) => Promise<Note>;
  deleteNoteById: (id: string) => Promise<void>;
  searchNotesByQuery: (query: string) => Promise<Note[]>;
  getStatistics: () => Promise<{ totalNotes: number; monthlyNotes: number; taggedNotes: number }>;
  getNoteById: (id: string) => Promise<Note | null>;

  // 工具方法
  getNote: (id: string) => Note | undefined;
  getNotesByTag: (tag: string) => Note[];
  getAllTags: () => string[];
  hasNotes: () => boolean;

  // 标签置顶
  togglePinTag: (tag: string) => Promise<void>;
  loadPinnedTags: () => Promise<void>;

  // 标签管理
  renameTag: (oldTag: string, newTag: string) => Promise<void>;
  deleteTag: (tag: string) => Promise<void>;
  deleteTagWithNotes: (tag: string) => Promise<void>;
}

// 创建 Zustand store
export const useNoteStore = create<NoteState>((set, get) => ({
  // 初始状态
  notes: [],
  loading: true,
  initialized: false,
  pinnedTags: [],

  // 计算属性初始值
  totalNotes: 0,
  monthlyNotes: 0,
  taggedNotes: 0,

  // 初始化应用
  initialize: async () => {
    try {
      console.log('开始初始化NoteStore...');
      set({ loading: true });
      await initDatabase();
      console.log('数据库初始化完成');
      const notes = await getAllNotes();
      console.log('获取到的笔记数量:', notes.length);
      set({ notes, initialized: true, loading: false });
      console.log('NoteStore初始化完成');
    } catch (error) {
      console.error('初始化失败:', error);
      set({ notes: [], initialized: true, loading: false });
    }
  },

  // 刷新笔记列表
  refreshNotes: async () => {
    try {
      const notes = await getAllNotes();
      set({ notes });
    } catch (error) {
      console.error('刷新笔记失败:', error);
      throw error;
    }
  },

  // 创建笔记
  createNote: async (noteData: Partial<Note>): Promise<Note> => {
    try {
      const newNote = {
        ...noteData,
        id: `note_${Date.now()}`,
      } as Omit<Note, 'createdAt'> & { createdAt?: string };

      const savedNote = await saveNote(newNote);

      // 更新状态
      set(state => ({
        notes: [savedNote, ...state.notes],
        totalNotes: state.totalNotes + 1,
        monthlyNotes: state.monthlyNotes + 1,
        taggedNotes: savedNote.tags && savedNote.tags.length > 0
          ? state.taggedNotes + 1
          : state.taggedNotes
      }));

      return savedNote;
    } catch (error) {
      console.error('创建笔记失败:', error);
      throw error;
    }
  },

  // 更新笔记
  updateNote: async (note: Note): Promise<Note> => {
    try {
      const updatedNote = await saveNote(note);

      // 更新状态
      set(state => ({
        notes: state.notes.map(n => n.id === note.id ? updatedNote : n)
      }));

      return updatedNote;
    } catch (error) {
      console.error('更新笔记失败:', error);
      throw error;
    }
  },

  // 删除笔记
  deleteNoteById: async (id: string) => {
    try {
      await deleteNote(id);

      // 更新状态
      set(state => {
        const noteToDelete = state.notes.find(n => n.id === id);
        const hasTags = noteToDelete?.tags && noteToDelete.tags.length > 0;

        return {
          notes: state.notes.filter(n => n.id !== id),
          totalNotes: Math.max(0, state.totalNotes - 1),
          monthlyNotes: Math.max(0, state.monthlyNotes - 1),
          taggedNotes: hasTags ? Math.max(0, state.taggedNotes - 1) : state.taggedNotes
        };
      });
    } catch (error) {
      console.error('删除笔记失败:', error);
      throw error;
    }
  },

  // 搜索笔记
  searchNotesByQuery: async (query: string): Promise<Note[]> => {
    try {
      if (!query.trim()) return [];
      return await searchNotes(query);
    } catch (error) {
      console.error('搜索笔记失败:', error);
      throw error;
    }
  },

  // 获取统计信息
  getStatistics: async () => {
    try {
      const stats = await getStats();

      // 更新状态中的统计信息
      set({
        totalNotes: stats.totalNotes,
        monthlyNotes: stats.monthlyNotes,
        taggedNotes: stats.taggedNotes
      });

      return stats;
    } catch (error) {
      console.error('获取统计失败:', error);
      throw error;
    }
  },

  // 获取单个笔记
  getNoteById: async (id: string): Promise<Note | null> => {
    try {
      // 首先尝试从内存中获取
      const cachedNote = get().notes.find(n => n.id === id);
      if (cachedNote) {
        console.log('从内存缓存中找到笔记:', id);
        return cachedNote;
      }

      // 如果内存中没有，从数据库获取
      console.log('从数据库中查找笔记:', id);
      const note = await getNoteById(id);
      console.log('数据库查询结果:', note);
      return note;
    } catch (error) {
      console.error('获取笔记失败:', error);
      return null;
    }
  },

  // 工具方法：从状态中获取笔记
  getNote: (id: string) => {
    return get().notes.find(n => n.id === id);
  },

  // 工具方法：按标签筛选笔记
  getNotesByTag: (tag: string) => {
    return get().notes.filter(n => n.tags?.includes(tag));
  },

  // 工具方法：获取所有唯一标签（置顶标签在前）
  getAllTags: () => {
    const tags = new Set<string>();
    get().notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    const allTags = Array.from(tags);
    const pinnedTags = get().pinnedTags;

    // 排序：置顶标签在前，其他标签在后
    return allTags.sort((a, b) => {
      const aPinned = pinnedTags.includes(a);
      const bPinned = pinnedTags.includes(b);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.localeCompare(b);
    });
  },

  // 工具方法：检查是否存在笔记
  hasNotes: () => {
    return get().notes.length > 0;
  },

  // 加载置顶标签
  loadPinnedTags: async () => {
    try {
      const pinnedTagsString = await AsyncStorage.getItem('pinnedTags');
      const pinnedTags = pinnedTagsString ? JSON.parse(pinnedTagsString) : [];
      set({ pinnedTags });
      return pinnedTags;
    } catch (error) {
      console.error('加载置顶标签失败:', error);
      return [];
    }
  },

  // 切换标签置顶状态
  togglePinTag: async (tag: string) => {
    try {
      const currentPinned = get().pinnedTags;
      const isPinned = currentPinned.includes(tag);

      let newPinnedTags: string[];
      if (isPinned) {
        newPinnedTags = currentPinned.filter(t => t !== tag);
      } else {
        newPinnedTags = [...currentPinned, tag];
      }

      await AsyncStorage.setItem('pinnedTags', JSON.stringify(newPinnedTags));
      set({ pinnedTags: newPinnedTags });
    } catch (error) {
      console.error('切换标签置顶失败:', error);
    }
  },

  // 重命名标签
  renameTag: async (oldTag: string, newTag: string) => {
    try {
      const notes = get().notes;
      const notesToUpdate = notes.filter(note => note.tags?.includes(oldTag));

      for (const note of notesToUpdate) {
        const updatedNote = {
          ...note,
          tags: note.tags!.map(t => t === oldTag ? newTag : t)
        };
        await saveNote(updatedNote);
      }

      const pinnedTags = get().pinnedTags;
      if (pinnedTags.includes(oldTag)) {
        const newPinnedTags = pinnedTags.map(t => t === oldTag ? newTag : t);
        await AsyncStorage.setItem('pinnedTags', JSON.stringify(newPinnedTags));
        set({ pinnedTags: newPinnedTags });
      }

      await get().refreshNotes();
    } catch (error) {
      console.error('重命名标签失败:', error);
      throw error;
    }
  },

  // 仅删除标签
  deleteTag: async (tag: string) => {
    try {
      const notes = get().notes;
      const updatedNotes = notes.map(note => {
        if (note.tags?.includes(tag)) {
          return {
            ...note,
            tags: note.tags.filter(t => t !== tag)
          };
        }
        return note;
      });

      for (const note of updatedNotes) {
        if (notes.find(n => n.id === note.id)?.tags?.includes(tag)) {
          await saveNote(note);
        }
      }

      const pinnedTags = get().pinnedTags;
      if (pinnedTags.includes(tag)) {
        const newPinnedTags = pinnedTags.filter(t => t !== tag);
        await AsyncStorage.setItem('pinnedTags', JSON.stringify(newPinnedTags));
        set({ pinnedTags: newPinnedTags });
      }

      await get().refreshNotes();
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  },

  // 删除标签和笔记
  deleteTagWithNotes: async (tag: string) => {
    try {
      const notes = get().notes;
      const notesToDelete = notes.filter(note => note.tags?.includes(tag));

      for (const note of notesToDelete) {
        await deleteNote(note.id);
      }

      const pinnedTags = get().pinnedTags;
      if (pinnedTags.includes(tag)) {
        const newPinnedTags = pinnedTags.filter(t => t !== tag);
        await AsyncStorage.setItem('pinnedTags', JSON.stringify(newPinnedTags));
        set({ pinnedTags: newPinnedTags });
      }

      await get().refreshNotes();
    } catch (error) {
      console.error('删除标签和笔记失败:', error);
      throw error;
    }
  },
}));

// 导出便捷的 hooks 和 actions
export const noteActions = {
  initialize: () => useNoteStore.getState().initialize(),
  refreshNotes: () => useNoteStore.getState().refreshNotes(),
  createNote: (note: Partial<Note>) => useNoteStore.getState().createNote(note),
  updateNote: (note: Note) => useNoteStore.getState().updateNote(note),
  deleteNoteById: (id: string) => useNoteStore.getState().deleteNoteById(id),
  searchNotesByQuery: (query: string) => useNoteStore.getState().searchNotesByQuery(query),
  getStatistics: () => useNoteStore.getState().getStatistics(),
  getNoteById: (id: string) => useNoteStore.getState().getNoteById(id),
  getNote: (id: string) => useNoteStore.getState().getNote(id),
  getNotesByTag: (tag: string) => useNoteStore.getState().getNotesByTag(tag),
  getAllTags: () => useNoteStore.getState().getAllTags(),
  hasNotes: () => useNoteStore.getState().hasNotes(),
  togglePinTag: (tag: string) => useNoteStore.getState().togglePinTag(tag),
  loadPinnedTags: () => useNoteStore.getState().loadPinnedTags(),
};