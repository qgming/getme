import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';
import EventSource from 'react-native-sse';

export const generateInsight = async (
  systemPrompt: string,
  notesContent: string,
  onThinking?: (message: string) => void,
  onStream?: (chunk: string) => void
): Promise<string> => {
  const defaultModel = await getDefaultModel('insights');
  if (!defaultModel) throw new Error('未配置AI洞察模型');

  const model = await getModelById(defaultModel.modelId);
  const provider = await getProviderById(defaultModel.providerId);

  if (!model || !provider || !provider.apiKey) {
    throw new Error('模型或提供商配置不完整');
  }

  onThinking?.('正在分析笔记内容...');

  return new Promise((resolve, reject) => {
    let fullContent = '';

    const es = new EventSource(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请分析以下笔记内容：\n\n${notesContent}` }
        ],
        stream: true,
      }),
    });

    es.addEventListener('open', () => {
      onThinking?.('');
    });

    es.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || data === '[DONE]') {
        es.close();
        resolve(fullContent);
        return;
      }

      try {
        const content = JSON.parse(data).choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          onStream?.(content);
        }
      } catch {}
    });

    es.addEventListener('error', (event: any) => {
      es.close();
      const errorMsg = event?.type === 'error' && event?.message
        ? event.message
        : 'Stream connection failed';
      reject(new Error(errorMsg));
    });
  });
};
