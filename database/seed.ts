import * as aiDb from './aiProviders';

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

    await aiDb.createModel({
      id: 'mimo-v2-flash',
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
      id: 'deepseek-chat',
      providerId: deepseek.id,
      name: 'DeepSeek Chat',
    });

    await aiDb.createModel({
      id: 'deepseek-reasoner',
      providerId: deepseek.id,
      name: 'DeepSeek Reasoner',
    });

    const siliconflow = await aiDb.createProvider({
      name: 'SiliconFlow',
      apiKey: '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      isEnabled: true,
      iconName: 'SiliconFlow',
    });

    await aiDb.createModel({
      id: 'deepseek-ai/DeepSeek-V3.2',
      providerId: siliconflow.id,
      name: 'DeepSeek V3.2',
    });

    await aiDb.createModel({
      id: 'FunAudioLLM/SenseVoiceSmall',
      providerId: siliconflow.id,
      name: 'SenseVoiceSmall',
    });
  }
};
