import Constants from 'expo-constants';
import * as aiDb from './aiProviders';
import * as defaultModels from './defaultModels';

export const initializeDefaultProviders = async () => {
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
    await defaultModels.setDefaultModel('parallel', mimoFlash.id, xiaomiMimo.id);
    await defaultModels.setDefaultModel('chat', mimoFlash.id, xiaomiMimo.id);
  }
};
