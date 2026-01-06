import { getProviderById, getModelById } from '../database/aiProviders';
import { getDefaultModel } from '../database/defaultModels';

interface TagResult {
  people: string[];
  books: string[];
  locations: string[];
  times: string[];
  topics: string[];
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

    const prompt = `分析以下笔记内容，提取关键信息并生成标签。标签必须具体明确，能够独立理解。

笔记内容：
${content}

请以JSON格式返回结果，包含以下字段：
{
  "people": ["张三", "李四"],
  "books": ["《人类简史》", "《三体》"],
  "locations": ["北京", "上海"],
  "times": ["2024年1月", "周一上午"],
  "topics": ["机器学习", "项目管理"]
}

核心原则：
- 每个标签必须能独立看懂，不依赖笔记上下文
- 只提取明确出现的专有名词和关键信息
- 总标签数控制在3-6个，宁缺毋滥
- 不是每个类别都必须有，按需提取

提取规则：
1. 人名：只提取完整的真实人名或知名人物（如"乔布斯"、"马斯克"、"张三"）
   ❌ 禁止：代词（他、她）、泛指（朋友、同事）、不完整姓名

2. 书名/作品：只提取完整的书名、电影名、文章标题等（如"《原则》"、"《肖申克的救赎》"）
   ❌ 禁止：类型词（小说、电影）、不完整书名

3. 地点：只提取具体地点名称（如"杭州西湖"、"硅谷"、"星巴克"）
   ❌ 禁止："这里"、"那里"、"公司"、"家"等模糊词

4. 时间：只提取具体时间表述（如"2024年3月"、"春节期间"、"周五下午"）
   ❌ 禁止："第一天"、"今天"、"昨天"、"最近"等相对时间

5. 主题：只提取1-2个核心主题关键词，必须具体明确（如"React开发"、"产品设计"、"时间管理"）
   ❌ 禁止："新闻"、"想法"、"笔记"、"工作"、"学习"等泛泛的词

示例对比：
❌ 错误：["第一天", "新闻", "朋友", "这里", "今天"]
✅ 正确：["乔布斯", "《史蒂夫·乔布斯传》", "硅谷", "产品设计"]

只返回JSON，不要其他文字。`;

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

    const allTags = [
      ...(result.people || []),
      ...(result.books || []),
      ...(result.locations || []),
      ...(result.times || []),
      ...(result.topics || []),
    ].filter(tag => tag && tag.trim().length > 0);

    return [...new Set(allTags)];
  } catch (error) {
    console.error('[AI标签] 生成失败:', error);
    return [];
  }
};
