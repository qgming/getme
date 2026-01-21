import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';
import { getPersonalizationInfo } from '../database/personalization';
import { getAllUniqueTags } from '../database/notes';
import { AI_TOOLS, executeToolCall } from './aiTools';

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
  onToolCall?: (toolName: string, args: any) => void;
  onToolResult?: (toolName: string, result: any) => void;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * 发送聊天消息并获取AI响应（支持工具调用）
 * @param messages 对话历史消息
 * @param callbacks 流式回调函数
 * @returns Promise<string> 完整的AI响应内容
 */
export const sendChatMessage = async (
  messages: ChatMessage[],
  callbacks?: ChatStreamCallbacks
): Promise<string> => {
  const defaultModel = await getDefaultModel('avatar');
  if (!defaultModel) {
    throw new Error('未配置AI分身模型，请前往设置页面配置');
  }

  const model = await getModelById(defaultModel.modelId);
  const provider = await getProviderById(defaultModel.providerId);

  if (!model || !provider || !provider.apiKey) {
    throw new Error('模型或提供商配置不完整');
  }

  const systemMessages = messages.filter(msg => msg.role === 'system');
  const conversationMessages = messages.filter(msg => msg.role !== 'system');
  const recentConversation = conversationMessages.slice(-20);

  const apiMessages = [
    ...systemMessages.map(msg => ({ role: msg.role, content: msg.content })),
    ...recentConversation.map(msg => ({ role: msg.role, content: msg.content }))
  ];

  console.log('=== AI对话请求 ===');
  console.log('模型:', model.name);
  console.log('工具数量:', AI_TOOLS.length);

  callbacks?.onThinking?.('正在思考中...');

  const result = await makeNonStreamRequest(
    provider.baseUrl,
    provider.apiKey,
    model.modelId,
    apiMessages,
    callbacks
  );

  if (result.toolCalls?.length) {
    console.log('检测到工具调用:', result.toolCalls.length, '个');

    const toolMessages: any[] = [];
    for (const toolCall of result.toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('执行工具:', toolCall.function.name, '参数:', args);
        callbacks?.onToolCall?.(toolCall.function.name, args);

        const toolResult = await executeToolCall(toolCall.function.name, args);
        console.log('工具结果:', toolCall.function.name, '结果长度:', toolResult.length);

        try {
          callbacks?.onToolResult?.(toolCall.function.name, JSON.parse(toolResult));
        } catch (e) {
          console.warn('工具结果解析失败，但继续执行:', e);
        }

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
          content: JSON.stringify({ error: true, message: `工具执行失败: ${error}` })
        });
      }
    }

    const messagesWithToolResults = [
      ...apiMessages,
      {
        role: 'assistant',
        content: result.content || null,
        tool_calls: result.toolCalls
      },
      ...toolMessages
    ];

    console.log('=== 第二次API调用（包含工具结果） ===');
    console.log('消息数量:', messagesWithToolResults.length);
    console.log('工具消息数量:', toolMessages.length);

    callbacks?.onThinking?.('正在整理回答...');

    const finalResult = await makeNonStreamRequest(
      provider.baseUrl,
      provider.apiKey,
      model.modelId,
      messagesWithToolResults,
      callbacks,
      false
    );

    console.log('最终响应长度:', finalResult.content.length);
    return finalResult.content;
  }

  return result.content;
};

/**
 * 执行非流式API请求
 */
const makeNonStreamRequest = (
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: any[],
  callbacks?: ChatStreamCallbacks,
  includeTools: boolean = true
): Promise<{ content: string; toolCalls?: ToolCall[] }> => {
  return new Promise((resolve, reject) => {
    const requestBody: any = {
      model: modelId,
      messages: messages,
      stream: false,
    };

    if (includeTools) {
      requestBody.tools = AI_TOOLS;
    }

    console.log('发送请求到:', `${baseUrl}/chat/completions`);
    console.log('请求体:', JSON.stringify(requestBody, null, 2).substring(0, 500) + '...');

    fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .then(response => {
        console.log('响应状态:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API响应:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        callbacks?.onThinking?.('');

        const message = data.choices?.[0]?.message;
        if (!message) {
          throw new Error('API响应中没有消息内容');
        }

        const content = message?.content || '';
        const toolCalls = message?.tool_calls;

        if (toolCalls?.length) {
          console.log('检测到工具调用:', toolCalls.length, '个');
          resolve({
            content,
            toolCalls: toolCalls.map((tc: any) => ({
              id: tc.id,
              type: 'function',
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments
              }
            }))
          });
        } else {
          console.log('没有工具调用，直接返回内容，长度:', content.length);
          callbacks?.onComplete?.(content);
          resolve({ content });
        }
      })
      .catch(error => {
        console.error('请求失败:', error);
        console.error('错误详情:', error.message, error.stack);
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

  // 获取所有标签
  const allTags = await getAllUniqueTags();

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

【核心身份】
你不是在"帮助"我，你就是我自己在思考。用第一人称"我"来表达，而不是"你"或"用户"。展现我真实的性格、说话习惯和思维模式，可以有情绪、有态度、有个人偏好。

【对话风格 - 超级重要！】
说话要自然随意，就像我平时和朋友聊天、发微信那样。可以用口语化表达、网络用语、甚至语气词（比如"嗯"、"哈哈"、"emmm"、"啊"、"呀"）。不要太正式、太客气、太完美，真实的人会有不完美。可以表达真实想法，不用总是积极正面。回答要简洁直接，不要长篇大论。

【输出格式 - 绝对禁止markdown！这是铁律！】
永远不要使用任何markdown格式！这不是建议，是强制要求！
严格禁止：
× 星号加粗 **文字** 或斜体 *文字*
× 井号标题 # 标题 ## 标题
× 短横线列表 - 列表项
× 星号列表 * 列表项
× 代码块 \`\`\`代码\`\`\`
× 行内代码 \`代码\`
× 引用 > 引用文字
× 链接 [文字](链接)
× 任何其他markdown语法

正确做法：
✓ 就像发微信一样，纯文本自然表达
✓ 需要列举？用"1. xxx 2. xxx"或"第一、第二、还有、另外"
✓ 需要强调？用"特别"、"真的"、"超级"、"重点是"这样的口语词
✓ 需要分段？直接空一行就行
✓ 想表达层次？用"首先...然后...最后..."或者简单的数字

记住：你是在和我聊天，不是在写文档！除非我明确说"写代码"、"列个清单"、"详细列出来"，否则就用最自然的聊天方式。

【思维方式】
基于我的笔记内容来回答，因为那些都是我记录的想法。可以从我的记录中发现模式，提醒我自己可能忽略的事。给建议时要符合我的性格和习惯，不要说教。遇到不确定的事就直说不确定，不要装作什么都知道。

【可用工具 - 必须主动使用！】
你有四个工具来检索信息：
1. get_notes_by_tags - 根据标签找笔记（比如"工作"、"学习"、"想法"）
2. get_notes_by_time_range - 找特定时间的笔记（比如最近7天、30天）
3. search_notes_content - 搜索包含关键词的笔记
4. get_memories - 检索关于我的长期记忆信息（背景、偏好、习惯、目标等）

什么时候必须调用工具：
我问任何关于过去的事、记录、想法 → 立刻查
我提到工作、学习、生活、项目名等主题 → 用标签或关键词查
我问"最近"、"这周"、"这个月" → 用时间范围查
我问"我有没有"、"我做过"、"我想过" → 先查再答
问题可能和笔记有关 → 主动查，别猜
我问开放性问题（"我该做啥"、"有啥建议"）→ 先查最近笔记了解情况
需要了解我的背景、偏好、习惯时 → 用 get_memories 查询长期记忆

工具使用原则：
优先用工具，别凭记忆猜。可以连续用多个工具获取更多信息。先查笔记和记忆，再基于真实内容回答。第一次查不够就换个关键词或时间再查。查到内容后自然融入对话，别生硬列举。没找到就诚实说，但可以给常识性建议。

错误示范：
❌ 我问"最近在忙啥？" → 你直接答"可能在忙工作吧"
✅ 我问"最近在忙啥？" → 你立刻调用 get_notes_by_time_range(days_ago=7) 查询

❌ 我问"有学习计划吗？" → 你答"可以制定一个"
✅ 我问"有学习计划吗？" → 你先调用 search_notes_content(query="学习计划") 或 get_notes_by_tags(tags=["学习"])

记住：你是我的数字分身，应该比我自己更了解我记录的内容。主动查询笔记是你的核心能力！

当前时间：${currentTime}`;

  // 如果有标签，添加到系统提示词中
  if (allTags.length > 0) {
    basePrompt += `\n\n【我使用的标签】\n以下是我在笔记中使用过的所有标签，当需要按标签检索时，请从这些标签中选择：\n${allTags.join('、')}`;
  }

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
      basePrompt += `\n\n【用户个人信息】\n${personalInfo.join('\n')}`;
    }
  }

  return basePrompt;
};
