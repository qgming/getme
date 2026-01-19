import { initDatabase } from './index';
import { Memory } from '../types/Memory';

export const saveMemory = async (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> => {
  const db = await initDatabase();
  const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO avatar_memories (
      id, content, category, source_start_timestamp, source_end_timestamp,
      source_message_count, extraction_model, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      memory.content,
      memory.category,
      memory.source_start_timestamp,
      memory.source_end_timestamp,
      memory.source_message_count,
      memory.extraction_model,
      now,
      now,
    ]
  );

  return {
    id,
    ...memory,
    createdAt: now,
    updatedAt: now,
  };
};

export const getAllMemories = async (): Promise<Memory[]> => {
  const db = await initDatabase();
  return await db.getAllAsync<Memory>(
    'SELECT * FROM avatar_memories ORDER BY createdAt DESC'
  );
};

export const getMemoryById = async (id: string): Promise<Memory | null> => {
  const db = await initDatabase();
  return await db.getFirstAsync<Memory>(
    'SELECT * FROM avatar_memories WHERE id = ?',
    [id]
  );
};

export const searchMemories = async (
  query: string,
  category: string = 'all',
  limit: number = 5
): Promise<Memory[]> => {
  const db = await initDatabase();
  const searchTerm = `%${query.trim()}%`;

  let sql = 'SELECT * FROM avatar_memories WHERE content LIKE ?';
  const params: any[] = [searchTerm];

  if (category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY createdAt DESC LIMIT ?';
  params.push(limit);

  return await db.getAllAsync<Memory>(sql, params);
};

export const getMemoriesByCategory = async (category: string): Promise<Memory[]> => {
  const db = await initDatabase();

  if (category === 'all') {
    return getAllMemories();
  }

  return await db.getAllAsync<Memory>(
    'SELECT * FROM avatar_memories WHERE category = ? ORDER BY createdAt DESC',
    [category]
  );
};

export const updateMemory = async (id: string, content: string): Promise<void> => {
  const db = await initDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    'UPDATE avatar_memories SET content = ?, updatedAt = ? WHERE id = ?',
    [content, now, id]
  );
};

export const deleteMemory = async (id: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM avatar_memories WHERE id = ?', [id]);
};

export const deleteMemories = async (ids: string[]): Promise<void> => {
  const db = await initDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `DELETE FROM avatar_memories WHERE id IN (${placeholders})`,
    ids
  );
};

export const getMemoryCount = async (): Promise<number> => {
  const db = await initDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM avatar_memories'
  );
  return result?.count || 0;
};

export const getLastExtractionTime = async (): Promise<string | null> => {
  const db = await initDatabase();
  const result = await db.getFirstAsync<{ createdAt: string }>(
    'SELECT createdAt FROM avatar_memories ORDER BY createdAt DESC LIMIT 1'
  );
  return result?.createdAt || null;
};

export const clearAllMemories = async (): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM avatar_memories');
};
