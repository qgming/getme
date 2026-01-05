import * as aiDb from './aiProviders';
import * as defaultModels from './defaultModels';

export const initializeDefaultProviders = async () => {
  const providers = await aiDb.getAllProviders();

  if (providers.length === 0) {
    const xiaomiMimo = await aiDb.createProvider({
      name: 'XiaomiMimo',
      apiKey: '',
      baseUrl: 'https://api.xiaomimimo.com/v1',
      isEnabled: true,
      iconName: 'XiaomiMimo',
    });

    const mimoFlash = await aiDb.createModel({
      modelId: 'mimo-v2-flash',
      providerId: xiaomiMimo.id,
      name: 'MiMo V2 Flash',
    });

    const deepseek = await aiDb.createProvider({
      name: 'DeepSeek',
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/v1',
      isEnabled: true,
      iconName: 'DeepSeek',
    });

    await aiDb.createModel({
      modelId: 'deepseek-chat',
      providerId: deepseek.id,
      name: 'DeepSeek Chat',
    });

    const siliconflow = await aiDb.createProvider({
      name: 'SiliconFlow',
      apiKey: '',
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

    await defaultModels.setDefaultModel('transcription', senseVoice.modelId, siliconflow.id);
    await defaultModels.setDefaultModel('chat', mimoFlash.modelId, xiaomiMimo.id);
  }
};
