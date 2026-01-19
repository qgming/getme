import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { InsightPrompt } from '../../types/Insight';

interface PromptCardProps {
  prompt: InsightPrompt;
  onPress: () => void;
  cardSize: number;
}

/**
 * 洞察提示卡片组件
 * 作用：显示单个洞察提示，包含图标、标题和作者
 */
export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onPress, cardSize }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.promptCard,
        { backgroundColor: colors.surface, width: cardSize, height: cardSize },
      ]}
      onPress={onPress}
    >
      <Text style={styles.promptIcon}>{prompt.icon}</Text>
      <Text style={[styles.promptTitle, { color: colors.text }]}>{prompt.title}</Text>
      <Text style={[styles.promptAuthor, { color: colors.textMuted }]}>by {prompt.author}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  promptCard: {
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  promptAuthor: {
    fontSize: 11,
    textAlign: 'center',
  },
});
