import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
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
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader title="洞察记录" showBackButton />
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
  list: {
    padding: 16,
    paddingTop: 100,
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
