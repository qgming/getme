import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      dbInstance = await SQLite.openDatabaseAsync('notes.db');

      await dbInstance.runAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          tags TEXT
        );
      `);

      await dbInstance.runAsync(`
        CREATE TABLE IF NOT EXISTS ai_providers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          apiKey TEXT NOT NULL,
          baseUrl TEXT NOT NULL,
          isEnabled INTEGER DEFAULT 1,
          iconName TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      const columns = await dbInstance.getAllAsync<{ name: string }>(
        "PRAGMA table_info(ai_providers)"
      );
      const hasIsDefault = columns.some(col => col.name === 'isDefault');
      const hasIsEnabled = columns.some(col => col.name === 'isEnabled');

      if (hasIsDefault && !hasIsEnabled) {
        await dbInstance.runAsync(`
          ALTER TABLE ai_providers RENAME COLUMN isDefault TO isEnabled;
        `);
        await dbInstance.runAsync(`
          UPDATE ai_providers SET isEnabled = 1;
        `);
      }

      await dbInstance.runAsync(`
        CREATE TABLE IF NOT EXISTS ai_models (
          id TEXT PRIMARY KEY,
          providerId TEXT NOT NULL,
          modelId TEXT NOT NULL,
          name TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (providerId) REFERENCES ai_providers(id) ON DELETE CASCADE
        );
      `);

      const modelColumns = await dbInstance.getAllAsync<{ name: string }>(
        "PRAGMA table_info(ai_models)"
      );
      const hasModelId = modelColumns.some(col => col.name === 'modelId');

      if (!hasModelId) {
        await dbInstance.runAsync(`ALTER TABLE ai_models ADD COLUMN modelId TEXT`);
        await dbInstance.runAsync(`UPDATE ai_models SET modelId = id WHERE modelId IS NULL`);
      }

      await dbInstance.runAsync(`
        CREATE TABLE IF NOT EXISTS default_models (
          feature TEXT PRIMARY KEY,
          modelId TEXT NOT NULL,
          providerId TEXT NOT NULL,
          FOREIGN KEY (modelId) REFERENCES ai_models(id) ON DELETE CASCADE,
          FOREIGN KEY (providerId) REFERENCES ai_providers(id) ON DELETE CASCADE
        );
      `);

      return dbInstance;
    } catch (error) {
      dbInstance = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};
