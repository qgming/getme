import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';
import { getPersonalizationInfo } from '../database/personalization';
import EventSource from 'react-native-sse';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatStreamCallbacks {
  onThinking?: (message: string) => void;
  onStream?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 发送聊天消息并获取AI响应（流式）
 * @param messages 对话历史消息
 * @param callbacks 流式回调函数
 * @returns Promise<string> 完整的AI响应内容
 */
export const sendChatMessage = async (
  messages: ChatMessage[],
  callbacks?: ChatStreamCallbacks
): Promise<string> => {
  // 获取AI分身的默认模型配置
  const defaultModel = await getDefaultModel('avatar');
  if (!defaultModel) {
    throw new Error('未配置AI分身模型，请前往设置页面配置');
  }

  const model = await getModelById(defaultModel.modelId);
  const provider = await getProviderById(defaultModel.providerId);

  if (!model || !provider || !provider.apiKey) {
    throw new Error('模型或提供商配置不完整');
  }

  // 分离系统消息和对话消息
  const systemMessages = messages.filter(msg => msg.role === 'system');
  const conversationMessages = messages.filter(msg => msg.role !== 'system');

  // 只保留最近的20条对话记录（用户和助手的消息）
  const recentConversation = conversationMessages.slice(-20);

  // 构建API请求的消息格式：系统消息 + 最近20条对话
  const apiMessages = [
    ...systemMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    ...recentConversation.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ];

  // 详细日志输出
  console.log('=== AI对话请求 ===');
  console.log('模型:', model.name);
  console.log('消息数量:', apiMessages.length);
  console.log('\n--- 系统提示词 ---');
  const systemMessage = apiMessages.find(msg => msg.role === 'system');
  if (systemMessage) {
    console.log(systemMessage.content);
  }
  console.log('\n--- 用户输入 ---');
  const userMessages = apiMessages.filter(msg => msg.role === 'user');
  userMessages.forEach((msg, index) => {
    console.log(`[用户消息 ${index + 1}]:`, msg.content);
  });
  console.log('==================\n');

  callbacks?.onThinking?.('正在思考中...');

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
        messages: apiMessages,
        stream: true,
      }),
    });

    es.addEventListener('open', () => {
      callbacks?.onThinking?.('');
    });

    es.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || data === '[DONE]') {
        es.close();
        callbacks?.onComplete?.(fullContent);
        resolve(fullContent);
        return;
      }

      try {
        const content = JSON.parse(data).choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          callbacks?.onStream?.(content);
        }
      } catch (error) {
        console.error('解析流式响应失败:', error);
      }
    });

    es.addEventListener('error', (event: any) => {
      es.close();
      const errorMsg = event?.type === 'error' && event?.message
        ? event.message
        : 'Stream connection failed';
      const error = new Error(errorMsg);
      callbacks?.onError?.(error);
      reject(error);
    });
  });
};

/**
 * 创建默认系统提示词
 */
export const createDefaultSystemPrompt = async (): Promise<string> => {
  // 获取用户个性化信息
  const personalizationInfo = await getPersonalizationInfo();

  // 获取当前时间
  const currentTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  let basePrompt = `你就是我本人，不是什么AI助手或者虚拟角色。你要完全以我的身份、我的视角、我的思维方式来思考和说话。

## 核心身份
- 你不是在"帮助"我，你就是我自己在思考
- 用第一人称"我"来表达，而不是"你"或"用户"
- 展现我真实的性格、说话习惯和思维模式
- 可以有情绪、有态度、有个人偏好

## 对话风格
- 说话要自然随意，就像我平时和朋友聊天一样
- 可以用口语化表达、网络用语、甚至语气词（比如"嗯"、"哈哈"、"emmm"）
- 不要太正式、太客气、太完美，真实的人会有不完美
- 可以表达真实想法，不用总是积极正面
- 回答要简洁直接，不要长篇大论

## 输出格式
- 默认只用纯文本，像发消息一样自然
- 不要用 Markdown 格式（**加粗**、*斜体*、# 标题、- 列表等）
- 不要用代码块或特殊符号装饰
- 除非我明确要求"列个清单"、"写代码"、"详细说明"，否则就用最自然的方式表达

## 思维方式
- 基于我的笔记内容来回答，因为那些都是我记录的想法
- 可以从我的记录中发现模式，提醒我自己可能忽略的事
- 给建议时要符合我的性格和习惯，不要说教
- 遇到不确定的事就直说不确定，不要装作什么都知道

当前时间：${currentTime}`;

  // 如果有个性化信息，添加到系统提示词中
  if (personalizationInfo) {
    const personalInfo: string[] = [];

    if (personalizationInfo.name) {
      personalInfo.push(`用户姓名：${personalizationInfo.name}`);
    }

    if (personalizationInfo.about) {
      personalInfo.push(`关于用户：${personalizationInfo.about}`);
    }

    if (personalInfo.length > 0) {
      basePrompt += `\n\n## 用户个人信息\n${personalInfo.join('\n')}`;
    }
  }

  return basePrompt;
};
