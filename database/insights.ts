import { initDatabase } from './index';
import { InsightRecord } from '../types/Insight';

export const getAllInsightRecords = async (): Promise<InsightRecord[]> => {
  const db = await initDatabase();
  return await db.getAllAsync<InsightRecord>(
    'SELECT * FROM insight_records ORDER BY createdAt DESC'
  );
};

export const getInsightRecordById = async (id: string): Promise<InsightRecord | null> => {
  const db = await initDatabase();
  return await db.getFirstAsync<InsightRecord>(
    'SELECT * FROM insight_records WHERE id = ?',
    [id]
  );
};

export const saveInsightRecord = async (record: Omit<InsightRecord, 'id' | 'createdAt'>): Promise<InsightRecord> => {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const id = `insight_${Date.now()}`;

  await db.runAsync(
    `INSERT INTO insight_records (id, promptId, promptTitle, range, content, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, record.promptId, record.promptTitle, record.range, record.content, now]
  );

  return { ...record, id, createdAt: now };
};

export const deleteInsightRecord = async (id: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM insight_records WHERE id = ?', [id]);
};
