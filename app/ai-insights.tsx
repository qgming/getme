import { History, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { INSIGHT_PROMPTS, InsightPrompt } from '../types/Insight';
import { useNoteStore } from '../stores';

type RangeType = 'recent7' | 'recent30' | 'last10' | 'tag';

interface RangeOption {
  id: RangeType;
  label: string;
  icon: string;
}

const RANGE_OPTIONS: RangeOption[] = [
  { id: 'recent7', label: '最近7天', icon: '📅' },
  { id: 'recent30', label: '最近一个月', icon: '📆' },
  { id: 'last10', label: '最近10条笔记', icon: '📝' },
  { id: 'tag', label: '某个标签', icon: '🏷️' },
];

export default function AIInsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const notes = useNoteStore(state => state.notes);
  const getAllTags = useNoteStore(state => state.getAllTags);
  const allTags = useMemo(() => getAllTags(), [getAllTags]);
  const [selectedRange, setSelectedRange] = useState<RangeType>('recent7');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showTagPicker, setShowTagPicker] = useState(false);

  const notesCount = useMemo(() => {
    const now = new Date();
    switch (selectedRange) {
      case 'recent7':
        return notes.filter(n => {
          const noteDate = new Date(n.createdAt);
          const diffDays = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        }).length;
      case 'recent30':
        return notes.filter(n => {
          const noteDate = new Date(n.createdAt);
          const diffDays = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 30;
        }).length;
      case 'last10':
        return Math.min(10, notes.length);
      case 'tag':
        return selectedTag ? notes.filter(n => n.tags?.includes(selectedTag)).length : 0;
      default:
        return 0;
    }
  }, [notes, selectedRange, selectedTag]);

  const handlePromptPress = (prompt: InsightPrompt) => {
    router.push({
      pathname: '/insight-result',
      params: {
        promptId: prompt.id,
        promptTitle: prompt.title,
        range: selectedRange,
        tag: selectedTag,
      },
    } as any);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/insight-history' as any)} style={styles.iconButton}>
          <History size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.primary }]}>选择任意视角，开始洞察</Text>

        {/* Stats */}
        <Text style={[styles.stats, { color: colors.textMuted }]}>
          {notes.length}条笔记 / {allTags.length} 标签 / {notesCount} 条符合范围
        </Text>

        {/* Range Selection */}
        <View style={styles.rangeContainer}>
          {RANGE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.rangeOption,
                { backgroundColor: colors.surface },
                selectedRange === option.id && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={() => {
                setSelectedRange(option.id);
                if (option.id === 'tag') {
                  setShowTagPicker(true);
                }
              }}
            >
              <Text style={styles.rangeIcon}>{option.icon}</Text>
              <Text style={[styles.rangeLabel, { color: colors.text }]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tag Picker */}
        {showTagPicker && selectedRange === 'tag' && (
          <View style={[styles.tagPicker, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tagPickerTitle, { color: colors.text }]}>选择标签</Text>
            <View style={styles.tagList}>
              {allTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagItem,
                    { backgroundColor: colors.background },
                    selectedTag === tag && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Prompts */}
        <View style={styles.promptsContainer}>
          {INSIGHT_PROMPTS.map(prompt => (
            <TouchableOpacity
              key={prompt.id}
              style={[styles.promptCard, { backgroundColor: colors.surface }]}
              onPress={() => handlePromptPress(prompt)}
            >
              <View style={styles.promptHeader}>
                <Text style={styles.promptIcon}>{prompt.icon}</Text>
                <View style={styles.promptInfo}>
                  <Text style={[styles.promptTitle, { color: colors.text }]}>{prompt.title}</Text>
                  <Text style={[styles.promptAuthor, { color: colors.textMuted }]}>by {prompt.author}</Text>
                </View>
              </View>
              <Text style={[styles.promptDescription, { color: colors.textSecondary }]}>{prompt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stats: {
    fontSize: 14,
    marginBottom: 24,
  },
  rangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  rangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  rangeIcon: {
    fontSize: 16,
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagPicker: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tagPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
  },
  promptsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  promptCard: {
    padding: 16,
    borderRadius: 12,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  promptIcon: {
    fontSize: 32,
  },
  promptInfo: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  promptAuthor: {
    fontSize: 12,
  },
  promptDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
