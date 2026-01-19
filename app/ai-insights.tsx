import { useLocalSearchParams, useRouter } from 'expo-router';
import { History } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import PromptInfoDrawer from '../components/PromptInfoDrawer';
import RangeFilterDrawer, { RangeFilter } from '../components/RangeFilterDrawer';
import { InsightStats, PromptGrid } from '../components/ai-insights';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';
import { INSIGHT_PROMPTS, InsightPrompt } from '../types/Insight';

const { width } = Dimensions.get('window');
const cardSize = (width - 48) / 2;

export default function AIInsightsScreen() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams();
  const { colors } = useTheme();
  const notes = useNoteStore(state => state.notes);
  const getAllTags = useNoteStore(state => state.getAllTags);
  const allTags = useMemo(() => getAllTags(), [getAllTags]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<InsightPrompt | null>(null);
  const [filters, setFilters] = useState<RangeFilter>({ time: '最近7天', notes: '', tags: [] });

  useEffect(() => {
    if (noteId) {
      setFilters({ time: '', notes: '', tags: [], noteId: noteId as string });
    }
  }, [noteId]);

  const filteredNotes = useMemo(() => {
    if (filters.noteId) {
      return notes.filter(n => n.id === filters.noteId);
    }

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
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <InsightStats
          selectedCount={filteredNotes.length}
          totalCount={notes.length}
          totalTags={allTags.length}
          onFilterPress={() => setShowDrawer(true)}
        />

        <PromptGrid
          prompts={INSIGHT_PROMPTS}
          onPromptPress={handlePromptPress}
          cardSize={cardSize}
        />
      </ScrollView>

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader
          title="AI洞察"
          showBackButton
          rightElement={<History size={24} color={colors.text} />}
          onRightPress={() => router.push('/insight-history' as any)}
        />
      </SafeAreaView>

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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 100,
  },
});
