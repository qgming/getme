import { useRouter } from 'expo-router';
import { ArrowLeft, Filter, History } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PromptInfoDrawer from '../components/PromptInfoDrawer';
import RangeFilterDrawer, { RangeFilter } from '../components/RangeFilterDrawer';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';
import { INSIGHT_PROMPTS, InsightPrompt } from '../types/Insight';

const { width } = Dimensions.get('window');
const cardSize = (width - 48) / 2;

export default function AIInsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const notes = useNoteStore(state => state.notes);
  const getAllTags = useNoteStore(state => state.getAllTags);
  const allTags = useMemo(() => getAllTags(), [getAllTags]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<InsightPrompt | null>(null);
  const [filters, setFilters] = useState<RangeFilter>({ time: '最近7天', notes: '', tags: [] });

  const filteredNotes = useMemo(() => {
    if (!filters.time && !filters.notes && filters.tags.length === 0) {
      return notes;
    }

    let result = notes;

    if (filters.time) {
      const now = new Date();
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
  }, [notes, filters]);

  const handlePromptPress = (prompt: InsightPrompt) => {
    setSelectedPrompt(prompt);
    setShowInfoDrawer(true);
  };

  const handleStartInsight = () => {
    if (selectedPrompt) {
      const promptToUse = selectedPrompt;
      setSelectedPrompt(null);
      router.push({
        pathname: '/insight-result',
        params: {
          promptId: promptToUse.id,
          promptTitle: promptToUse.title,
          filters: JSON.stringify(filters),
        },
      } as any);
    }
  };

  const handleCloseDetailDrawer = () => {
    setSelectedPrompt(null);
    setShowInfoDrawer(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI洞察</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/insight-history' as any)} style={styles.iconButton}>
            <History size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.statsContent}>
            <View style={styles.statsInfo}>
              <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                已选择 <Text style={[styles.statsHighlight, { color: colors.primary }]}>{filteredNotes.length}</Text> 条笔记
              </Text>
              <Text style={[styles.statsDetail, { color: colors.textMuted }]}>
                共 {notes.length} 条 · {allTags.length} 个标签
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDrawer(true)}
              style={[styles.filterButton, { backgroundColor: colors.background }]}
            >
              <Filter size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Prompts */}
        <View style={styles.promptsContainer}>
          {INSIGHT_PROMPTS.map(prompt => (
            <TouchableOpacity
              key={prompt.id}
              style={[styles.promptCard, { backgroundColor: colors.surface, width: cardSize, height: cardSize }]}
              onPress={() => handlePromptPress(prompt)}
            >
              <Text style={styles.promptIcon}>{prompt.icon}</Text>
              <Text style={[styles.promptTitle, { color: colors.text }]}>{prompt.title}</Text>
              <Text style={[styles.promptAuthor, { color: colors.textMuted }]}>by {prompt.author}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <RangeFilterDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        allTags={allTags}
        selectedFilters={filters}
        onApply={setFilters}
      />

      <PromptInfoDrawer
        visible={showInfoDrawer}
        prompt={selectedPrompt}
        onClose={handleCloseDetailDrawer}
        onStartInsight={handleStartInsight}
      />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsInfo: {
    flex: 1,
  },
  statsText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  statsHighlight: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsDetail: {
    fontSize: 13,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
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
