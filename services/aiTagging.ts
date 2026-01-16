import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';

interface TagResult {
  tags: string[];
}

export const generateTags = async (content: string): Promise<string[]> => {
  try {
    const defaultModel = await getDefaultModel('tag');
    if (!defaultModel) {
      console.log('[AI标签] 未配置AI标签模型');
      return [];
    }

    const model = await getModelById(defaultModel.modelId);
    const provider = await getProviderById(defaultModel.providerId);

    if (!model || !provider || !provider.apiKey) {
      console.log('[AI标签] 模型或提供商配置不完整');
      return [];
    }

    const currentTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });

    const prompt = `当前系统时间：${currentTime}

分析以下笔记内容，提取最重要的关键词作为标签。

笔记内容：
${content}

核心要求：
1. 只从原文中提取明确出现的关键词，不要自己造词或总结
2. 最多提取5个标签
3. 优先提取：人名、地名、书名/作品名、具体时间、核心主题词
4. 标签必须具体明确，能独立理解

禁止：
❌ 推理或总结出原文没有的词
❌ 使用代词（他、她、这里、那里）
❌ 使用泛指词（朋友、同事、公司、工作、学习）
❌ 使用相对时间（今天、昨天、最近）

示例：
原文："今天和张三在星巴克讨论了《原则》这本书，计划下周一开始实践"
✅ 正确：["张三", "星巴克", "《原则》", "下周一"]
❌ 错误：["讨论", "计划", "实践", "朋友", "今天"]

只返回JSON格式：{"tags": ["标签1", "标签2"]}
不要返回其他文字。`;

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error('API返回结果为空');
    }

    const result: TagResult = JSON.parse(resultText);

    const tags = (result.tags || [])
      .filter(tag => tag && tag.trim().length > 0)
      .slice(0, 5); // 确保不超过5个

    return [...new Set(tags)];
  } catch (error) {
    console.error('[AI标签] 生成失败:', error);
    return [];
  }
};
