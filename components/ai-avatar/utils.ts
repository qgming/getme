import { ChatMessage } from '../../services/aiChat';

/**
 * 格式化消息时间显示
 * @param timestamp - 消息时间戳
 * @returns 格式化后的时间字符串
 */
export const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  const oneDay = 24 * 60 * 60 * 1000;

  // 今天
  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  // 昨天
  const yesterday = new Date(now.getTime() - oneDay);
  if (date.getDate() === yesterday.getDate()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // 其他日期
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 判断是否需要显示时间分隔（超过1小时）
 * @param currentMsg - 当前消息
 * @param prevMsg - 前一条消息
 * @returns 是否显示时间戳
 */
export const shouldShowTimestamp = (currentMsg: ChatMessage, prevMsg?: ChatMessage): boolean => {
  if (!prevMsg) return true;
  const timeDiff = currentMsg.timestamp - prevMsg.timestamp;
  const oneHour = 60 * 60 * 1000;
  return timeDiff > oneHour;
};
