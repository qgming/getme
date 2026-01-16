import { initDatabase } from './index';

export interface PersonalizationInfo {
  id: number;
  name: string | null;
  about: string | null;
  updatedAt: string;
}

export const getPersonalizationInfo = async (): Promise<PersonalizationInfo | null> => {
  const db = await initDatabase();
  const result = await db.getFirstAsync<PersonalizationInfo>(
    'SELECT * FROM personalization WHERE id = 1'
  );
  return result || null;
};

export const savePersonalizationInfo = async (name: string, about: string): Promise<void> => {
  const db = await initDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR REPLACE INTO personalization (id, name, about, updatedAt)
     VALUES (1, ?, ?, ?)`,
    [name, about, now]
  );
};
