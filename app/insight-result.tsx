import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { useTheme } from '../hooks/useTheme';
import { generateInsight as generateAIInsight } from '../services/aiInsights';
import { useInsightStore, useNoteStore } from '../stores';
import { INSIGHT_PROMPTS } from '../types/Insight';

export default function InsightResultScreen() {
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const notes = useNoteStore(state => state.notes);
  const saveRecord = useInsightStore(state => state.saveRecord);

  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [thinking, setThinking] = useState('');
  const records = useInsightStore(state => state.records);

  // 用于节流更新的 ref
  const contentBufferRef = useRef('');
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 标记是否已经开始生成，防止重复执行
  const hasStartedRef = useRef(false);

  const { promptId, promptTitle, range, tag, recordId, filters: filtersParam } = params as { promptId?: string; promptTitle?: string; range?: string; tag?: string; recordId?: string; filters?: string };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  const getFilteredNotes = useCallback(() => {
    if (filtersParam) {
      const filters = JSON.parse(filtersParam);
      const now = new Date();
      let result = notes;

      // 如果有指定的 noteId，只返回该笔记
      if (filters.noteId) {
        return notes.filter(n => n.id === filters.noteId);
      }

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
  }, [filtersParam, notes, range, tag]);

  const generateInsight = useCallback(async () => {
    try {
      const prompt = INSIGHT_PROMPTS.find(p => p.id === promptId);
      if (!prompt || !promptId || !promptTitle) return;

      const filteredNotes = getFilteredNotes();

      // 重置缓冲区
      contentBufferRef.current = '';

      const result = await generateAIInsight(
        prompt.systemPrompt,
        filteredNotes,
        (msg) => setThinking(msg),
        (chunk) => {
          // 直接在这里实现节流逻辑，避免依赖外部函数
          contentBufferRef.current += chunk;
          if (!updateTimerRef.current) {
            updateTimerRef.current = setTimeout(() => {
              setContent(contentBufferRef.current);
              updateTimerRef.current = null;
            }, 150);
          }
        }
      );

      // 流式传输完成后，刷新所有剩余内容
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
      setContent(contentBufferRef.current);

      await saveRecord({
        promptId,
        promptTitle,
        range: filtersParam || `${range}${tag ? `:${tag}` : ''}`,
        content: result,
      });

      // 确保所有内容更新和保存完成后才关闭加载状态
      setTimeout(() => {
        setIsStreaming(false);
      }, 200);
    } catch (error) {
      console.error('生成洞察失败:', error);
      setContent('生成洞察时出错，请重试。');
      setIsStreaming(false);
    }
  }, [promptId, promptTitle, range, tag, filtersParam, saveRecord, getFilteredNotes]);

  useEffect(() => {
    if (recordId) {
      const record = records.find(r => r.id === recordId);
      if (record) {
        setContent(record.content);
        setIsStreaming(false);
      }
    } else {
      // 只在第一次执行时生成洞察
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        generateInsight();
      }
    }
  }, [recordId, records, generateInsight]);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {thinking && (
          <View style={[styles.thinkingBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>{thinking}</Text>
          </View>
        )}

        {content && (
          <Markdown
            style={{
              body: { color: colors.text },
              heading1: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginVertical: 12 },
              heading2: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
              heading3: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
              paragraph: { color: colors.text, fontSize: 18, lineHeight: 24, marginVertical: 4 },
              strong: { fontWeight: 'bold' },
              em: { fontStyle: 'italic' },
              code_inline: { backgroundColor: colors.card, color: colors.primary, paddingHorizontal: 4, borderRadius: 4 },
              code_block: { backgroundColor: colors.card, padding: 12, borderRadius: 8, marginVertical: 8 },
              fence: { backgroundColor: colors.card, padding: 12, borderRadius: 8, marginVertical: 8 },
              bullet_list: { marginVertical: 8 },
              ordered_list: { marginVertical: 8 },
              list_item: { marginVertical: 4 },
            }}
          >
            {content}
          </Markdown>
        )}
      </ScrollView>

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader
          title={recordId ? records.find(r => r.id === recordId)?.promptTitle : promptTitle}
          showBackButton
          rightElement={
            isStreaming ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  loadingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 50,
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
