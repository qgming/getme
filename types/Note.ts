export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

// 标签建议
export const SUGGESTED_TAGS = ['工作', '学习', '生活', '想法', '计划', '技术', '阅读', '旅行'];

// 笔记验证
export const validateNote = (note: Partial<Note>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!note.content || note.content.trim().length === 0) {
    errors.push('内容不能为空');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// 从内容中提取预览文本
export const getPreviewText = (content: string, maxLength: number = 100): string => {
  const text = content.replace(/[#*`]/g, '').trim().replace(/\s+/g, ' ');
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// 格式化日期
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays <= 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

// 格式化完整日期时间 (年月日时分秒)
export const formatFullDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取标签颜色
export const getTagColor = (tag: string): { bg: string; text: string } => {
  const colors = [
    { bg: '#e0e7ff', text: '#4f46e5' }, // 紫色
    { bg: '#dbeafe', text: '#2563eb' }, // 蓝色
    { bg: '#d1fae5', text: '#059669' }, // 绿色
    { bg: '#fef3c7', text: '#d97706' }, // 橙色
    { bg: '#fce7f3', text: '#db2777' }, // 粉色
    { bg: '#e0e7ff', text: '#7c3aed' }, // 深紫
  ];

  const index = tag.charCodeAt(0) % colors.length;
  return colors[index];
};
