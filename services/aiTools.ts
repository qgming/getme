import { getNotesByTags, getNotesByTimeRange, searchNotes } from '../database/notes';
import { Note } from '../types/Note';

// Tool schema definitions for OpenAI function calling
export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_notes_by_tags",
      description: "根据标签检索笔记。主动使用场景：用户提到任何主题词（工作、学习、生活、项目、想法等）、询问某个分类的内容、或问题可能与特定标签相关时，立即调用此工具。不要猜测，先查询再回答。",
      parameters: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
            description: "要搜索的标签数组，例如 ['工作', '学习']。可以尝试多个相关标签以获取更全面的结果。"
          },
          match_mode: {
            type: "string",
            enum: ["any", "all"],
            description: "匹配模式：'any' 表示匹配任意一个标签（OR逻辑，推荐用于扩大搜索范围），'all' 表示匹配所有标签（AND逻辑，用于精确查询）。默认为 'any'"
          },
          limit: {
            type: "number",
            description: "返回的最大笔记数量，默认10条，最多50条。如果需要更全面了解，可以设置更大的值。"
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
      description: "检索特定时间范围内的笔记。主动使用场景：用户问'最近'、'这周'、'这个月'、'今天'等任何时间相关问题时，或询问'我在忙什么'、'我做了什么'、'有什么进展'等需要了解近期状态的问题时，立即调用此工具。这是了解用户当前状态的关键工具。",
      parameters: {
        type: "object",
        properties: {
          days_ago: {
            type: "number",
            description: "从今天往前推的天数。常用值：1=今天，7=最近一周，30=最近一个月，90=最近三个月。根据用户问题灵活选择合适的时间范围。"
          },
          date_field: {
            type: "string",
            enum: ["createdAt", "updatedAt"],
            description: "按哪个日期字段过滤：'createdAt' 表示创建时间，'updatedAt' 表示更新时间（推荐，能看到最新修改的笔记）。默认为 'updatedAt'"
          },
          limit: {
            type: "number",
            description: "返回的最大笔记数量，默认10条，最多50条。如果需要更全面了解近期情况，可以设置更大的值。"
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
      description: "在笔记内容中搜索关键词。主动使用场景：用户问'我有没有记录过X'、'我之前想过Y吗'、'关于Z的笔记'等任何涉及具体内容查找的问题时，立即调用此工具。这是最灵活的搜索工具，可以找到任何包含关键词的笔记。当不确定用什么标签时，优先使用此工具。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "搜索关键词或短语。可以是用户提到的任何词语、概念、人名、项目名等。支持模糊匹配，会返回所有包含该关键词的笔记。"
          },
          limit: {
            type: "number",
            description: "返回的最大笔记数量，默认10条，最多50条。如果第一次搜索结果太少，可以换个关键词再试。"
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
