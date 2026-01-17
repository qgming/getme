import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';
import EventSource from 'react-native-sse';
import { ChatMessage, ChatStreamCallbacks } from './aiChat';
import { AI_TOOLS, executeToolCall } from './aiTools';

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolMessage {
  role: 'tool';
  tool_call_id: string;
  name: string;
  content: string;
}

/**
 * 发送聊天消息并获取AI响应（支持工具调用的流式版本）
 * @param messages 对话历史消息
 * @param callbacks 流式回调函数
 * @returns Promise<string> 完整的AI响应内容
 */
export const sendChatMessageWithTools = async (
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
  console.log('=== AI对话请求（带工具） ===');
  console.log('模型:', model.name);
  console.log('消息数量:', apiMessages.length);
  console.log('工具数量:', AI_TOOLS.length);

  callbacks?.onThinking?.('正在思考中...');

  // 第一次API调用：可能返回工具调用或直接内容
  const result = await makeStreamingRequest(
    provider.baseUrl,
    provider.apiKey,
    model.modelId,
    apiMessages,
    callbacks
  );

  // 如果有工具调用，执行工具并进行第二次API调用
  if (result.toolCalls && result.toolCalls.length > 0) {
    console.log('检测到工具调用:', result.toolCalls.length, '个');

    // 执行所有工具调用
    const toolMessages: ToolMessage[] = [];
    for (const toolCall of result.toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        callbacks?.onToolCall?.(toolCall.function.name, args);

        const toolResult = await executeToolCall(toolCall.function.name, args);
        callbacks?.onToolResult?.(toolCall.function.name, JSON.parse(toolResult));

        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: toolResult
        });
      } catch (error) {
        console.error('工具执行失败:', toolCall.function.name, error);
        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify({
            error: true,
            message: `工具执行失败: ${error}`
          })
        });
      }
    }

    // 构建包含工具结果的新消息列表
    const messagesWithToolResults = [
      ...apiMessages,
      {
        role: 'assistant',
        content: result.content || null,
        tool_calls: result.toolCalls.map(tc => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
      },
      ...toolMessages
    ];

    console.log('=== 第二次API调用（包含工具结果） ===');
    callbacks?.onThinking?.('正在整理回答...');

    // 第二次API调用：获取基于工具结果的最终响应
    const finalResult = await makeStreamingRequest(
      provider.baseUrl,
      provider.apiKey,
      model.modelId,
      messagesWithToolResults,
      callbacks,
      false // 第二次调用不再提供工具
    );

    return finalResult.content;
  }

  // 没有工具调用，直接返回内容
  return result.content;
};

/**
 * 执行流式API请求
 */
const makeStreamingRequest = (
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: any[],
  callbacks?: ChatStreamCallbacks,
  includeTools: boolean = true
): Promise<{ content: string; toolCalls?: ToolCall[] }> => {
  return new Promise((resolve, reject) => {
    let fullContent = '';
    const toolCallsAccumulator = new Map<number, ToolCall>();

    const requestBody: any = {
      model: modelId,
      messages: messages,
      stream: true,
    };

    // 只在第一次调用时包含工具定义
    if (includeTools) {
      requestBody.tools = AI_TOOLS;
    }

    const es = new EventSource(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    es.addEventListener('open', () => {
      callbacks?.onThinking?.('');
    });

    es.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || data === '[DONE]') {
        es.close();

        // 检查是否有工具调用
        if (toolCallsAccumulator.size > 0) {
          const toolCalls = Array.from(toolCallsAccumulator.values());
          resolve({ content: fullContent, toolCalls });
        } else {
          callbacks?.onComplete?.(fullContent);
          resolve({ content: fullContent });
        }
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;

        // 处理内容流式输出
        if (delta?.content) {
          fullContent += delta.content;
          callbacks?.onStream?.(delta.content);
        }

        // 处理工具调用流式输出
        if (delta?.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const index = toolCallDelta.index;

            if (!toolCallsAccumulator.has(index)) {
              toolCallsAccumulator.set(index, {
                id: toolCallDelta.id || '',
                type: 'function',
                function: { name: '', arguments: '' }
              });
            }

            const accumulated = toolCallsAccumulator.get(index)!;

            if (toolCallDelta.id) {
              accumulated.id = toolCallDelta.id;
            }
            if (toolCallDelta.function?.name) {
              accumulated.function.name = toolCallDelta.function.name;
            }
            if (toolCallDelta.function?.arguments) {
              accumulated.function.arguments += toolCallDelta.function.arguments;
            }
          }
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
