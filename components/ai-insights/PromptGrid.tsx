import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InsightPrompt } from '../../types/Insight';
import { PromptCard } from './PromptCard';

interface PromptGridProps {
  prompts: InsightPrompt[];
  onPromptPress: (prompt: InsightPrompt) => void;
  cardSize: number;
}

/**
 * 洞察提示网格组件
 * 作用：以2列网格形式显示所有洞察提示卡片
 */
export const PromptGrid: React.FC<PromptGridProps> = ({ prompts, onPromptPress, cardSize }) => {
  return (
    <View style={styles.promptsContainer}>
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onPress={() => onPromptPress(prompt)}
          cardSize={cardSize}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
});
