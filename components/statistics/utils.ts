/**
 * 格式化字数显示
 * @param count - 字数
 * @returns 格式化后的字数字符串
 */
export const formatWordCount = (count: number): string => {
  if (count >= 100000) {
    return (count / 10000).toFixed(1) + 'W';
  } else if (count >= 10000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};
