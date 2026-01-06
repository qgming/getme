import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useInsightStore } from '../stores';
import { InsightRecord } from '../types/Insight';

export default function InsightHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const records = useInsightStore(state => state.records);
  const loadRecords = useInsightStore(state => state.loadRecords);
  const deleteRecord = useInsightStore(state => state.deleteRecord);

  useEffect(() => {
    loadRecords();
  }, []);

  const handleRecordPress = (record: InsightRecord) => {
    router.push({
      pathname: '/insight-result',
      params: { recordId: record.id },
    } as any);
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
  };

  const renderItem = ({ item }: { item: InsightRecord }) => {
    const firstLine = item.content.split('\n').find(line => line.trim())?.replace(/^#+\s*/, '').trim() || '';

    return (
      <TouchableOpacity
        style={[styles.recordCard, { backgroundColor: colors.card }]}
        onPress={() => handleRecordPress(item)}
      >
        <View style={styles.recordHeader}>
          <Text style={[styles.recordTitle, { color: colors.text }]}>{item.promptTitle}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Trash2 size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.recordPreview, { color: colors.textSecondary }]} numberOfLines={2}>
          {firstLine}
        </Text>
        <Text style={[styles.recordDate, { color: colors.textMuted }]}>
          {new Date(item.createdAt).toLocaleString('zh-CN')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>洞察记录</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>暂无洞察记录</Text>
          </View>
        }
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  recordCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  recordPreview: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  recordDate: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
  },
});
