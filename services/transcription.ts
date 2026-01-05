import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    console.log('[Transcription] 开始转写,音频URI:', audioUri);

    const defaultModel = await getDefaultModel('transcription');
    console.log('[Transcription] 默认模型配置:', defaultModel);

    if (!defaultModel) {
      throw new Error('未配置转写模型，请先在设置中配置AI转写模型');
    }

    const model = await getModelById(defaultModel.modelId);
    if (!model) {
      throw new Error('转写模型不存在');
    }

    const provider = await getProviderById(defaultModel.providerId);
    console.log('[Transcription] 提供商配置:', provider ? {
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      hasApiKey: !!provider.apiKey
    } : null);

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

    // 确保 URI 格式正确 (Android APK 环境下通常需要 file:// 前缀)
    const formattedUri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
    console.log('[Transcription] 格式化后的URI:', formattedUri);

    formData.append('file', {
      uri: formattedUri,
      type: mimeType,
      name: `audio.${extension}`,
    } as any);

    formData.append('model', model.modelId);
    formData.append('response_format', 'json');

    const url = `${provider.baseUrl}/audio/transcriptions`;
    console.log('[Transcription] 请求URL:', url);
    console.log('[Transcription] 使用模型ID:', model.modelId);

    console.log('[Transcription] 发送请求到:', url);
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: formData,
      });
    } catch (fetchError) {
      console.error('[Transcription] Fetch 错误:', fetchError);
      if (url.startsWith('http://')) {
        throw new Error(`网络请求失败: Android APK 默认禁止 HTTP 请求。请使用 HTTPS 或在 app.json 中配置 usesCleartextTraffic。错误: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`);
      }
      throw new Error(`网络请求失败: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`);
    }

    console.log('[Transcription] 响应状态码:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Transcription] 错误响应:', errorText);
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
