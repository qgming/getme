import { ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from '../hooks/useTheme';
import { INSIGHT_PROMPTS } from '../types/Insight';
import { useNoteStore, useInsightStore } from '../stores';
import { generateInsight as generateAIInsight } from '../services/aiInsights';

export default function InsightResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const notes = useNoteStore(state => state.notes);
  const saveRecord = useInsightStore(state => state.saveRecord);

  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [thinking, setThinking] = useState('');
  const records = useInsightStore(state => state.records);

  const { promptId, promptTitle, range, tag, recordId, filters: filtersParam } = params as { promptId?: string; promptTitle?: string; range?: string; tag?: string; recordId?: string; filters?: string };

  useEffect(() => {
    if (recordId) {
      const record = records.find(r => r.id === recordId);
      if (record) {
        setContent(record.content);
        setIsStreaming(false);
      }
    } else {
      generateInsight();
    }
  }, [recordId]);

  const getFilteredNotes = () => {
    if (filtersParam) {
      const filters = JSON.parse(filtersParam);
      const now = new Date();
      let result = notes;

      if (filters.time) {
        result = result.filter(n => {
          const noteDate = new Date(n.createdAt);
          const diffDays = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
          if (filters.time === '最近7天') return diffDays <= 7;
          if (filters.time === '最近15天') return diffDays <= 15;
          if (filters.time === '最近30天') return diffDays <= 30;
          if (filters.time === '最近100天') return diffDays <= 100;
          if (filters.time === '最近365天') return diffDays <= 365;
          return false;
        });
      } else if (filters.notes) {
        let maxCount = 0;
        if (filters.notes === '最近10条') maxCount = 10;
        if (filters.notes === '最近50条') maxCount = 50;
        if (filters.notes === '最近100条') maxCount = 100;
        result = result.slice(0, maxCount);
      } else if (filters.tags.length > 0) {
        result = result.filter(n => n.tags?.some(tag => filters.tags.includes(tag)));
      }

      return result;
    }

    const now = new Date();
    switch (range) {
      case 'recent7':
        return notes.filter(n => {
          const diffDays = (now.getTime() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        });
      case 'recent30':
        return notes.filter(n => {
          const diffDays = (now.getTime() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 30;
        });
      case 'last10':
        return notes.slice(0, 10);
      case 'tag':
        return tag ? notes.filter(n => n.tags?.includes(tag)) : [];
      default:
        return notes;
    }
  };

  const generateInsight = async () => {
    try {
      const prompt = INSIGHT_PROMPTS.find(p => p.id === promptId);
      if (!prompt || !promptId || !promptTitle) return;

      const filteredNotes = getFilteredNotes();

      const result = await generateAIInsight(
        prompt.systemPrompt,
        filteredNotes,
        (msg) => setThinking(msg),
        (chunk) => setContent(prev => prev + chunk)
      );

      setIsStreaming(false);

      await saveRecord({
        promptId,
        promptTitle,
        range: filtersParam || `${range}${tag ? `:${tag}` : ''}`,
        content: result,
      });
    } catch (error) {
      console.error('生成洞察失败:', error);
      setContent('生成洞察时出错，请重试。');
      setIsStreaming(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {recordId ? records.find(r => r.id === recordId)?.promptTitle : promptTitle}
        </Text>
        {isStreaming ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.container}>
        {thinking && (
          <View style={[styles.thinkingBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>{thinking}</Text>
          </View>
        )}

        {content && (
          <MarkdownDisplay
            style={{
              body: { color: colors.text, fontSize: 16, lineHeight: 24 },
              heading1: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
              heading2: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
              heading3: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 4 },
              paragraph: { color: colors.text, marginBottom: 12 },
              list_item: { color: colors.text, marginBottom: 4 },
              code_inline: { backgroundColor: colors.card, color: colors.primary, paddingHorizontal: 4, borderRadius: 4 },
              code_block: { backgroundColor: colors.card, padding: 12, borderRadius: 8, marginVertical: 8 },
            }}
          >
            {content}
          </MarkdownDisplay>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  thinkingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
  },
  streamingIndicator: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
