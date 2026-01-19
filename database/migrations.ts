import { initDatabase } from './index';
import * as aiDb from './aiProviders';
import * as defaultModels from './defaultModels';
import Constants from 'expo-constants';

const CURRENT_VERSION = 5;

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
        const gemini = await aiDb.createProvider({
          name: 'Gemini',
          apiKey: Constants.expoConfig?.extra?.GEMINI_API_KEY || '',
          baseUrl: 'http://149.104.31.184:7860/v1',
          isEnabled: true,
          iconName: 'Gemini',
        });

        const geminiFlash = await aiDb.createModel({
          modelId: 'gemini-2.5-flash',
          providerId: gemini.id,
          name: 'Gemini 2.5 Flash',
        });

        await aiDb.createModel({
          modelId: 'gemini-2.5-pro',
          providerId: gemini.id,
          name: 'Gemini 2.5 Pro',
        });

        await aiDb.createModel({
          modelId: 'gemini-3-flash-preview',
          providerId: gemini.id,
          name: 'Gemini 3 Flash Preview',
        });

        await aiDb.createModel({
          modelId: 'gemini-3-pro-preview',
          providerId: gemini.id,
          name: 'Gemini 3 Pro Preview',
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
        await defaultModels.setDefaultModel('insights', geminiFlash.id, gemini.id);
        await defaultModels.setDefaultModel('avatar', geminiFlash.id, gemini.id);
        await defaultModels.setDefaultModel('tag', geminiFlash.id, gemini.id);
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
  {
    version: 5,
    migrate: async () => {
      // 将 XiaomiMimo 提供商更改为 Gemini
      const providers = await aiDb.getAllProviders();
      const xiaomiMimo = providers.find(p => p.name === 'XiaomiMimo');

      if (xiaomiMimo) {
        // 更新提供商信息
        await aiDb.updateProvider(xiaomiMimo.id, {
          name: 'Gemini',
          apiKey: Constants.expoConfig?.extra?.GEMINI_API_KEY || '',
          baseUrl: 'http://149.104.31.184:7860/v1',
          iconName: 'Gemini',
        });

        // 删除旧的 XiaomiMimo 模型
        const oldModels = await aiDb.getModelsByProvider(xiaomiMimo.id);
        for (const model of oldModels) {
          await aiDb.deleteModel(model.id);
        }

        // 创建新的 Gemini 模型
        const geminiFlash = await aiDb.createModel({
          modelId: 'gemini-2.5-flash',
          providerId: xiaomiMimo.id,
          name: 'Gemini 2.5 Flash',
        });

        await aiDb.createModel({
          modelId: 'gemini-2.5-pro',
          providerId: xiaomiMimo.id,
          name: 'Gemini 2.5 Pro',
        });

        await aiDb.createModel({
          modelId: 'gemini-3-flash-preview',
          providerId: xiaomiMimo.id,
          name: 'Gemini 3 Flash Preview',
        });

        await aiDb.createModel({
          modelId: 'gemini-3-pro-preview',
          providerId: xiaomiMimo.id,
          name: 'Gemini 3 Pro Preview',
        });

        // 更新默认模型为 Gemini 2.5 Flash
        await defaultModels.setDefaultModel('insights', geminiFlash.id, xiaomiMimo.id);
        await defaultModels.setDefaultModel('avatar', geminiFlash.id, xiaomiMimo.id);
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
