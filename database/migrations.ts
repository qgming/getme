import { initDatabase } from './index';
import * as aiDb from './aiProviders';
import * as defaultModels from './defaultModels';
import Constants from 'expo-constants';

const CURRENT_VERSION = 4;

interface Migration {
  version: number;
  migrate: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    migrate: async () => {
      // 初始版本，创建默认提供商和模型
      const providers = await aiDb.getAllProviders();

      if (providers.length === 0) {
        const xiaomiMimo = await aiDb.createProvider({
          name: 'XiaomiMimo',
          apiKey: Constants.expoConfig?.extra?.XIAOMIMIMO_API_KEY || '',
          baseUrl: 'https://api.xiaomimimo.com/v1',
          isEnabled: true,
          iconName: 'XiaomiMimo',
        });

        const mimoFlash = await aiDb.createModel({
          modelId: 'mimo-v2-flash',
          providerId: xiaomiMimo.id,
          name: 'MiMo V2 Flash',
        });

        const siliconflow = await aiDb.createProvider({
          name: 'SiliconFlow',
          apiKey: Constants.expoConfig?.extra?.SILICONFLOW_API_KEY || '',
          baseUrl: 'https://api.siliconflow.cn/v1',
          isEnabled: true,
          iconName: 'SiliconCloud',
        });

        await aiDb.createModel({
          modelId: 'deepseek-ai/DeepSeek-V3.2',
          providerId: siliconflow.id,
          name: 'DeepSeek V3.2',
        });

        const senseVoice = await aiDb.createModel({
          modelId: 'FunAudioLLM/SenseVoiceSmall',
          providerId: siliconflow.id,
          name: 'SenseVoiceSmall',
        });

        await defaultModels.setDefaultModel('transcription', senseVoice.id, siliconflow.id);
        await defaultModels.setDefaultModel('insights', mimoFlash.id, xiaomiMimo.id);
        await defaultModels.setDefaultModel('avatar', mimoFlash.id, xiaomiMimo.id);
        await defaultModels.setDefaultModel('tag', mimoFlash.id, xiaomiMimo.id);
      }
    },
  },
  {
    version: 2,
    migrate: async () => {
      // 添加 Qwen3-8B 模型并更新 AI 标签默认模型
      const providers = await aiDb.getAllProviders();
      const siliconflow = providers.find(p => p.name === 'SiliconFlow');

      if (siliconflow) {
        // 检查是否已存在 Qwen3-8B 模型
        const existingModels = await aiDb.getModelsByProvider(siliconflow.id);
        const qwen3Exists = existingModels.some(m => m.modelId === 'Qwen/Qwen3-8B');

        if (!qwen3Exists) {
          const qwen3 = await aiDb.createModel({
            modelId: 'Qwen/Qwen3-8B',
            providerId: siliconflow.id,
            name: 'Qwen3-8B',
          });

          // 更新 AI 标签的默认模型
          await defaultModels.setDefaultModel('tag', qwen3.id, siliconflow.id);
        } else {
          // 如果模型已存在，只更新默认模型设置
          const qwen3Model = existingModels.find(m => m.modelId === 'Qwen/Qwen3-8B');
          if (qwen3Model) {
            await defaultModels.setDefaultModel('tag', qwen3Model.id, siliconflow.id);
          }
        }
      }
    },
  },
  {
    version: 3,
    migrate: async () => {
      // 创建聊天消息表
      const db = await initDatabase();

      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
      `);

      await db.runAsync(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp
        ON chat_messages(timestamp DESC);
      `);
    },
  },
  {
    version: 4,
    migrate: async () => {
      // 创建记忆表并设置默认记忆提取模型
      const db = await initDatabase();

      // 创建记忆表
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS avatar_memories (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          category TEXT,
          source_start_timestamp INTEGER NOT NULL,
          source_end_timestamp INTEGER NOT NULL,
          source_message_count INTEGER NOT NULL,
          extraction_model TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      await db.runAsync(`
        CREATE INDEX IF NOT EXISTS idx_avatar_memories_created
        ON avatar_memories(createdAt DESC);
      `);

      await db.runAsync(`
        CREATE INDEX IF NOT EXISTS idx_avatar_memories_category
        ON avatar_memories(category);
      `);

      // 设置默认记忆提取模型（使用 Qwen3-8B）
      const providers = await aiDb.getAllProviders();
      const siliconflow = providers.find(p => p.name === 'SiliconFlow');

      if (siliconflow) {
        const existingModels = await aiDb.getModelsByProvider(siliconflow.id);
        const qwen3Model = existingModels.find(m => m.modelId === 'Qwen/Qwen3-8B');

        if (qwen3Model) {
          await defaultModels.setDefaultModel('memory', qwen3Model.id, siliconflow.id);
        }
      }
    },
  },
];

export const getCurrentVersion = async (): Promise<number> => {
  const db = await initDatabase();
  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM db_version WHERE id = 1'
  );
  return result?.version || 0;
};

export const setVersion = async (version: number): Promise<void> => {
  const db = await initDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO db_version (id, version, updatedAt) VALUES (1, ?, ?)',
    [version, now]
  );
};

export const runMigrations = async (): Promise<void> => {
  const currentVersion = await getCurrentVersion();

  console.log(`Current database version: ${currentVersion}`);
  console.log(`Target database version: ${CURRENT_VERSION}`);

  if (currentVersion >= CURRENT_VERSION) {
    console.log('Database is up to date');
    return;
  }

  // 执行所有需要的迁移
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration to version ${migration.version}...`);
      try {
        await migration.migrate();
        await setVersion(migration.version);
        console.log(`Migration to version ${migration.version} completed`);
      } catch (error) {
        console.error(`Migration to version ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  console.log('All migrations completed successfully');
};
