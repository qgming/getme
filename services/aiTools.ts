import { getNotesByTags, getNotesByTimeRange, searchNotes } from '../database/notes';
import { Note } from '../types/Note';

// Tool schema definitions for OpenAI function calling
export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_notes_by_tags",
      description: "检索包含特定标签的笔记。当用户询问关于特定主题、分类或标签的笔记时使用此工具。",
      parameters: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
            description: "要搜索的标签数组，例如 ['工作', '学习']"
          },
          match_mode: {
            type: "string",
            enum: ["any", "all"],
            description: "匹配模式：'any' 表示匹配任意一个标签（OR逻辑），'all' 表示匹配所有标签（AND逻辑）。默认为 'any'"
          },
          limit: {
            type: "number",
            description: "返回的最大笔记数量，默认10条，最多50条"
          }
        },
        required: ["tags"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_notes_by_time_range",
      description: "检索特定时间范围内创建或更新的笔记。当用户询问最近的笔记或特定时间段的笔记时使用此工具。",
      parameters: {
        type: "object",
        properties: {
          days_ago: {
            type: "number",
            description: "从今天往前推的天数，例如 7 表示最近7天，30 表示最近30天"
          },
          date_field: {
            type: "string",
            enum: ["createdAt", "updatedAt"],
            description: "按哪个日期字段过滤：'createdAt' 表示创建时间，'updatedAt' 表示更新时间。默认为 'updatedAt'"
          },
          limit: {
            type: "number",
            description: "返回的最大笔记数量，默认10条，最多50条"
          }
        },
        required: ["days_ago"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_notes_content",
      description: "在笔记内容中搜索包含特定关键词的笔记。当用户想要查找包含特定词语或短语的笔记时使用此工具。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索关键词或短语"
          },
          limit: {
            type: "number",
            description: "返回的最大笔记数量，默认10条，最多50条"
          }
        },
        required: ["query"]
      }
    }
  }
];

/**
 * Format notes for AI consumption with truncation and limits
 */
const formatNotesForAI = (notes: Note[]): any => {
  const MAX_CONTENT_LENGTH = 500;
  const MAX_NOTES = 20;

  const truncatedNotes = notes.slice(0, MAX_NOTES).map(note => ({
    id: note.id,
    content: note.content.length > MAX_CONTENT_LENGTH
      ? note.content.substring(0, MAX_CONTENT_LENGTH) + '...[内容已截断]'
      : note.content,
    tags: note.tags || [],
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  }));

  return {
    total_count: notes.length,
    returned_count: truncatedNotes.length,
    notes: truncatedNotes,
    truncated: notes.length > MAX_NOTES,
    message: notes.length > MAX_NOTES
      ? `找到 ${notes.length} 条笔记，仅返回前 ${MAX_NOTES} 条`
      : notes.length === 0
      ? '未找到匹配的笔记'
      : undefined
  };
};

/**
 * Execute get_notes_by_tags tool
 */
const executeGetNotesByTags = async (args: any): Promise<string> => {
  const { tags, match_mode = 'any', limit = 10 } = args;

  if (!Array.isArray(tags) || tags.length === 0) {
    return JSON.stringify({
      error: true,
      message: '标签参数无效，必须提供至少一个标签'
    });
  }

  const notes = await getNotesByTags(tags, match_mode, Math.min(limit, 50));
  return JSON.stringify(formatNotesForAI(notes));
};

/**
 * Execute get_notes_by_time_range tool
 */
const executeGetNotesByTimeRange = async (args: any): Promise<string> => {
  const { days_ago, date_field = 'updatedAt', limit = 10 } = args;

  if (typeof days_ago !== 'number' || days_ago < 0) {
    return JSON.stringify({
      error: true,
      message: '天数参数无效，必须是非负数'
    });
  }

  const notes = await getNotesByTimeRange(days_ago, date_field, Math.min(limit, 50));
  return JSON.stringify(formatNotesForAI(notes));
};

/**
 * Execute search_notes_content tool
 */
const executeSearchNotes = async (args: any): Promise<string> => {
  const { query, limit = 10 } = args;

  if (typeof query !== 'string' || query.trim().length === 0) {
    return JSON.stringify({
      error: true,
      message: '搜索关键词无效，必须提供非空字符串'
    });
  }

  const notes = await searchNotes(query);
  const limitedNotes = notes.slice(0, Math.min(limit, 50));
  return JSON.stringify(formatNotesForAI(limitedNotes));
};

/**
 * Main tool execution dispatcher
 */
export const executeToolCall = async (
  toolName: string,
  args: any
): Promise<string> => {
  try {
    console.log(`Executing tool: ${toolName}`, args);

    switch (toolName) {
      case 'get_notes_by_tags':
        return await executeGetNotesByTags(args);
      case 'get_notes_by_time_range':
        return await executeGetNotesByTimeRange(args);
      case 'search_notes_content':
        return await executeSearchNotes(args);
      default:
        throw new Error(`未知的工具: ${toolName}`);
    }
  } catch (error: any) {
    console.error(`Tool execution failed: ${toolName}`, error);
    return JSON.stringify({
      error: true,
      message: `工具执行失败: ${error.message}`,
      tool: toolName
    });
  }
};
