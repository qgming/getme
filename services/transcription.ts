import { getProviderById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    const defaultModel = await getDefaultModel('transcription');
    if (!defaultModel) {
      throw new Error('未配置转写模型，请先在设置中配置AI转写模型');
    }

    const provider = await getProviderById(defaultModel.providerId);
    if (!provider) {
      throw new Error('转写服务提供商不存在');
    }

    if (!provider.apiKey) {
      throw new Error('API密钥未配置，请先在AI设置中配置API密钥');
    }

    if (!provider.baseUrl) {
      throw new Error('API地址未配置，请先在AI设置中配置API地址');
    }

    const formData = new FormData();

    const extension = audioUri.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeType = extension === 'm4a' ? 'audio/mp4' :
                     extension === 'mp3' ? 'audio/mpeg' :
                     extension === 'wav' ? 'audio/wav' :
                     extension === 'webm' ? 'audio/webm' :
                     extension === 'opus' ? 'audio/opus' : 'audio/mp4';

    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: `audio.${extension}`,
    } as any);

    formData.append('model', defaultModel.modelId);
    formData.append('response_format', 'json');

    const url = `${provider.baseUrl}/audio/transcriptions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`转写失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.text) {
      return result.text;
    } else if (result.result) {
      return result.result;
    } else if (typeof result === 'string') {
      return result;
    } else {
      throw new Error('无法识别的转写响应格式');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('转写过程中发生未知错误');
    }
  }
};
