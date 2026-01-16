import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';
import EventSource from 'react-native-sse';
import { Note, formatFullDateTime } from '../types/Note';

const formatNotesForAI = (notes: Note[]): string => {
  return notes.map((note, index) => {
    const number = index + 1;
    const timestamp = formatFullDateTime(note.createdAt);
    const tags = note.tags && note.tags.length > 0 ? note.tags.join(', ') : '无标签';

    return `${number}. ${timestamp} | 标签: ${tags}\n${note.content}\n`;
  }).join('\n');
};

export const generateInsight = async (
  systemPrompt: string,
  notes: Note[],
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

  const formattedNotes = formatNotesForAI(notes);

  // 添加当前系统时间到系统提示词
  const currentTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const enhancedSystemPrompt = `${systemPrompt}\n\n当前系统时间：${currentTime}`;

  console.log('=== AI洞察请求 ===');
  console.log('系统提示词:', enhancedSystemPrompt);
  console.log('格式化笔记内容:\n', formattedNotes);
  console.log('==================');

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
          { role: 'system', content: enhancedSystemPrompt },
          { role: 'user', content: `请分析以下笔记内容：\n\n${formattedNotes}` }
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
