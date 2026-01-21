import { getModelById, getProviderById } from "../database/aiProviders";
import { getDefaultModel } from "../database/defaultModels";
import { saveMemory } from "../database/memories";
import { Memory } from "../types/Memory";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface MemoryExtractionResult {
  memories: {
    content: string;
    category: "personal" | "preference" | "goal" | "fact" | "relationship";
  }[];
}

export const extractMemoriesFromConversation = async (
  messages: ChatMessage[],
): Promise<Memory[]> => {
  try {
    const defaultModel = await getDefaultModel("memory");
    if (!defaultModel) {
      console.log("[记忆提取] 未配置记忆提取模型");
      return [];
    }

    const model = await getModelById(defaultModel.modelId);
    const provider = await getProviderById(defaultModel.providerId);

    if (!model || !provider || !provider.apiKey) {
      console.log("[记忆提取] 模型或提供商配置不完整");
      return [];
    }

    // Format conversation for extraction
    const formattedConversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => `[${m.role === "user" ? "用户" : "AI"}]: ${m.content}`)
      .join("\n\n");

    const currentTime = new Date().toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const prompt = `当前系统时间：${currentTime}

分析以下对话记录，提取关于用户的重要记忆信息。

对话记录：
${formattedConversation}

提取要求：
1. 提取用户的个人信息、偏好、习惯、目标、计划等
2. 提取用户提到的重要事实、关系、项目等
3. 每条记忆应该是独立的、具体的、有价值的
4. 记忆应该是长期有用的信息，不是临时性的对话内容
5. 提取1-3条记忆，宁缺毋滥

记忆分类：
- personal: 个人信息（姓名、职业、背景等）
- preference: 偏好习惯（喜好、工作方式等）
- goal: 目标计划（学习计划、项目目标等）
- fact: 重要事实（正在做的事、使用的工具等）
- relationship: 人际关系（提到的人名、关系等）

返回JSON格式：
{
  "memories": [
    {
      "content": "记忆内容描述",
      "category": "分类"
    }
  ]
}

只返回JSON，不要其他文字。`;

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.modelId,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error("API返回结果为空");
    }

    const result: MemoryExtractionResult = JSON.parse(resultText);
    const extractedMemories = result.memories || [];

    // Save to database
    const savedMemories: Memory[] = [];
    const sourceStart = messages[0].timestamp;
    const sourceEnd = messages[messages.length - 1].timestamp;

    for (const mem of extractedMemories) {
      if (mem.content && mem.content.trim().length > 10) {
        const saved = await saveMemory({
          content: mem.content,
          category: mem.category || null,
          source_start_timestamp: sourceStart,
          source_end_timestamp: sourceEnd,
          source_message_count: messages.length,
          extraction_model: model.modelId,
        });
        savedMemories.push(saved);
      }
    }

    console.log(`[记忆提取] 成功提取 ${savedMemories.length} 条记忆`);
    return savedMemories;
  } catch (error) {
    console.error("[记忆提取] 提取失败:", error);
    return [];
  }
};

// Background extraction wrapper (non-blocking)
export const extractMemoriesInBackground = (messages: ChatMessage[]): void => {
  // Run extraction without blocking
  extractMemoriesFromConversation(messages).catch((error) => {
    console.error("[记忆提取] 后台提取失败:", error);
  });
};
