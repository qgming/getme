import { initDatabase } from './index';

export interface DefaultModel {
  feature: string;
  modelId: string;
  providerId: string;
}

export const getDefaultModel = async (feature: string): Promise<DefaultModel | null> => {
  const db = await initDatabase();
  return await db.getFirstAsync<DefaultModel>(
    'SELECT * FROM default_models WHERE feature = ?',
    [feature]
  );
};

export const setDefaultModel = async (feature: string, modelId: string, providerId: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO default_models (feature, modelId, providerId) VALUES (?, ?, ?)`,
    [feature, modelId, providerId]
  );
};

export const getAllDefaultModels = async (): Promise<DefaultModel[]> => {
  const db = await initDatabase();
  return await db.getAllAsync<DefaultModel>('SELECT * FROM default_models');
};
