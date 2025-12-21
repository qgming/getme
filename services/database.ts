import * as SQLite from 'expo-sqlite';
import { Note } from '../types/Note';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// 初始化数据库 - 使用单例模式确保只初始化一次
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  // 如果已经初始化，直接返回
  if (dbInstance) {
    return dbInstance;
  }

  // 如果正在初始化中，等待初始化完成
  if (initPromise) {
    return initPromise;
  }

  // 创建新的初始化Promise
  initPromise = (async () => {
    try {
      console.log('开始初始化数据库...');

      // 打开数据库
      dbInstance = await SQLite.openDatabaseAsync('notes.db');
      console.log('数据库打开成功');

      // 创建表
      await dbInstance.runAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          tags TEXT
        );
      `);
      console.log('数据库表创建完成');

      return dbInstance;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      // 重置状态，允许重试
      dbInstance = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

// 获取所有笔记
export const getAllNotes = async (): Promise<Note[]> => {
  try {
    const db = await initDatabase();
    const result = await db.getAllAsync<Note & { tags: string | null }>(
      'SELECT * FROM notes ORDER BY updatedAt DESC'
    );

    return result.map(note => {
      let parsedTags: string[] = [];
      try {
        parsedTags = note.tags ? JSON.parse(note.tags) : [];
        if (!Array.isArray(parsedTags)) parsedTags = [];
      } catch (e) {
        console.error('解析标签失败:', note.id, e);
        parsedTags = [];
      }
      return {
        ...note,
        tags: parsedTags,
      };
    });
  } catch (error) {
    console.error('获取所有笔记失败:', error);
    return [];
  }
};

// 获取单个笔记
export const getNoteById = async (id: string): Promise<Note | null> => {
  try {
    if (!id) return null;

    const db = await initDatabase();
    const result = await db.getFirstAsync<Note & { tags: string | null }>(
      'SELECT * FROM notes WHERE id = ?',
      [String(id)]
    );

    if (!result) return null;

    let parsedTags: string[] = [];
    try {
      parsedTags = result.tags ? JSON.parse(result.tags) : [];
      if (!Array.isArray(parsedTags)) parsedTags = [];
    } catch (e) {
      console.error('解析标签失败:', result.id, e);
      parsedTags = [];
    }

    return {
      ...result,
      tags: parsedTags,
    };
  } catch (error) {
    console.error('获取笔记失败:', error);
    return null;
  }
};

// 创建或更新笔记
export const saveNote = async (note: Omit<Note, 'createdAt'> & { createdAt?: string }): Promise<Note> => {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const noteToSave = {
    id: note.id || `note_${Date.now()}`,
    content: note.content || '',
    createdAt: note.createdAt || now,
    updatedAt: now,
    tags: note.tags || [],
  };

  const tagsString = JSON.stringify(noteToSave.tags);

  await db.runAsync(
    `INSERT OR REPLACE INTO notes (id, content, createdAt, updatedAt, tags)
     VALUES (?, ?, ?, ?, ?)`,
    [
      noteToSave.id,
      noteToSave.content,
      noteToSave.createdAt,
      noteToSave.updatedAt,
      tagsString
    ]
  );

  return noteToSave;
};

// 删除笔记
export const deleteNote = async (id: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM notes WHERE id = ?', [String(id)]);
};

// 搜索笔记
export const searchNotes = async (query: string): Promise<Note[]> => {
  try {
    if (!query.trim()) return [];

    const db = await initDatabase();
    const searchTerm = `%${query.trim()}%`;

    const result = await db.getAllAsync<Note & { tags: string | null }>(
      `SELECT * FROM notes
       WHERE content LIKE ? OR tags LIKE ?
       ORDER BY updatedAt DESC`,
      [searchTerm, searchTerm]
    );

    return result.map(note => {
      let parsedTags: string[] = [];
      try {
        parsedTags = note.tags ? JSON.parse(note.tags) : [];
        if (!Array.isArray(parsedTags)) parsedTags = [];
      } catch (e) {
        console.error('解析标签失败:', note.id, e);
        parsedTags = [];
      }
      return {
        ...note,
        tags: parsedTags,
      };
    });
  } catch (error) {
    console.error('搜索笔记失败:', error);
    return [];
  }
};

// 获取统计信息
export const getStats = async (): Promise<{
  totalNotes: number;
  monthlyNotes: number;
  taggedNotes: number;
}> => {
  try {
    const db = await initDatabase();

    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes'
    );

    const monthlyResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM notes
       WHERE createdAt >= date('now', '-30 days')`
    );

    const taggedResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM notes
       WHERE tags IS NOT NULL AND tags != '[]'`
    );

    return {
      totalNotes: totalResult?.count || 0,
      monthlyNotes: monthlyResult?.count || 0,
      taggedNotes: taggedResult?.count || 0,
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return { totalNotes: 0, monthlyNotes: 0, taggedNotes: 0 };
  }
};