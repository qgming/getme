import { initDatabase } from './index';

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  isEnabled: boolean;
  iconName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIModel {
  id: string;
  providerId: string;
  modelId: string;
  name: string;
  createdAt: string;
}

export const getAllProviders = async (): Promise<AIProvider[]> => {
  const db = await initDatabase();
  const result = await db.getAllAsync<{
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    isEnabled: number;
    iconName: string | null;
    createdAt: string;
    updatedAt: string;
  }>('SELECT * FROM ai_providers ORDER BY createdAt DESC');
  return result.map(p => ({ ...p, isEnabled: p.isEnabled === 1, iconName: p.iconName || undefined }));
};

export const getProviderById = async (id: string): Promise<AIProvider | null> => {
  const db = await initDatabase();
  const result = await db.getFirstAsync<{
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    isEnabled: number;
    iconName: string | null;
    createdAt: string;
    updatedAt: string;
  }>('SELECT * FROM ai_providers WHERE id = ?', [id]);
  return result ? { ...result, isEnabled: result.isEnabled === 1, iconName: result.iconName || undefined } : null;
};

export const createProvider = async (provider: Omit<AIProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIProvider> => {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const id = `provider_${Date.now()}`;

  await db.runAsync(
    `INSERT INTO ai_providers (id, name, apiKey, baseUrl, isEnabled, iconName, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, provider.name, provider.apiKey, provider.baseUrl, provider.isEnabled ? 1 : 0, provider.iconName || null, now, now]
  );

  return { ...provider, id, createdAt: now, updatedAt: now };
};

export const updateProvider = async (id: string, updates: Partial<Omit<AIProvider, 'id' | 'createdAt'>>): Promise<void> => {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.apiKey !== undefined) { fields.push('apiKey = ?'); values.push(updates.apiKey); }
  if (updates.baseUrl !== undefined) { fields.push('baseUrl = ?'); values.push(updates.baseUrl); }
  if (updates.isEnabled !== undefined) { fields.push('isEnabled = ?'); values.push(updates.isEnabled ? 1 : 0); }
  if (updates.iconName !== undefined) { fields.push('iconName = ?'); values.push(updates.iconName); }
  fields.push('updatedAt = ?');
  values.push(now, id);

  await db.runAsync(`UPDATE ai_providers SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteProvider = async (id: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM ai_providers WHERE id = ?', [id]);
};

export const getModelsByProvider = async (providerId: string): Promise<AIModel[]> => {
  const db = await initDatabase();
  return await db.getAllAsync<AIModel>(
    'SELECT * FROM ai_models WHERE providerId = ? ORDER BY createdAt ASC',
    [providerId]
  );
};

export const getModelById = async (id: string): Promise<AIModel | null> => {
  const db = await initDatabase();
  return await db.getFirstAsync<AIModel>('SELECT * FROM ai_models WHERE id = ?', [id]);
};

export const createModel = async (model: Omit<AIModel, 'id' | 'createdAt'>): Promise<AIModel> => {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const id = `model_${Date.now()}`;

  await db.runAsync(
    `INSERT INTO ai_models (id, providerId, modelId, name, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [id, model.providerId, model.modelId, model.name, now]
  );

  return { id, ...model, createdAt: now };
};

export const updateModel = async (id: string, updates: Partial<Omit<AIModel, 'id' | 'providerId' | 'createdAt'>>): Promise<void> => {
  const db = await initDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.modelId !== undefined) { fields.push('modelId = ?'); values.push(updates.modelId); }
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  values.push(id);

  if (fields.length > 0) {
    await db.runAsync(`UPDATE ai_models SET ${fields.join(', ')} WHERE id = ?`, values);
  }
};

export const deleteModel = async (id: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM ai_models WHERE id = ?', [id]);
};

export const deleteModelsByProvider = async (providerId: string): Promise<void> => {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM ai_models WHERE providerId = ?', [providerId]);
};
