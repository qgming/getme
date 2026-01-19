export interface Memory {
  id: string;
  content: string;
  category: 'personal' | 'preference' | 'goal' | 'fact' | 'relationship' | null;
  source_start_timestamp: number;
  source_end_timestamp: number;
  source_message_count: number;
  extraction_model: string;
  createdAt: string;
  updatedAt: string;
}

export const MEMORY_CATEGORIES = [
  { value: 'all', label: '全部', icon: '📋' },
  { value: 'personal', label: '个人', icon: '👤' },
  { value: 'preference', label: '偏好', icon: '⭐' },
  { value: 'goal', label: '目标', icon: '🎯' },
  { value: 'fact', label: '事实', icon: '📌' },
  { value: 'relationship', label: '关系', icon: '👥' },
];
