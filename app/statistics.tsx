import { useRouter } from 'expo-router';
import { Hash, MoreHorizontal } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionMenu } from '../components/ActionMenu';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CustomHeader } from '../components/CustomHeader';
import { DialogInput } from '../components/DialogInput';
import { useTheme } from '../hooks/useTheme';
import { useNoteStore } from '../stores';

// Format word count for display
const formatWordCount = (count: number): string => {
  if (count >= 100000) {
    return (count / 10000).toFixed(1) + 'W';
  } else if (count >= 10000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};

export default function DataStatisticsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const getStatistics = useNoteStore(state => state.getStatistics);
  const getAllTags = useNoteStore(state => state.getAllTags);
  const pinnedTags = useNoteStore(state => state.pinnedTags);
  const togglePinTag = useNoteStore(state => state.togglePinTag);
  const loadPinnedTags = useNoteStore(state => state.loadPinnedTags);
  const renameTag = useNoteStore(state => state.renameTag);
  const deleteTag = useNoteStore(state => state.deleteTag);
  const deleteTagWithNotes = useNoteStore(state => state.deleteTagWithNotes);
  const [stats, setStats] = useState({
    notes: 0,
    tags: 0,
    days: 0,
    words: 0,
  });
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [confirmDeleteTag, setConfirmDeleteTag] = useState(false);
  const [confirmDeleteTagWithNotes, setConfirmDeleteTagWithNotes] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await loadPinnedTags();
      await getStatistics();

      const tags = getAllTags();
      const notes = useNoteStore.getState().notes;

      // Count unique dates (different note dates count as separate days)
      let uniqueDays = 0;
      if (notes.length > 0) {
        const uniqueDates = new Set(
          notes.map(note => {
            const date = new Date(note.createdAt);
            // Format as YYYY-MM-DD to ensure same day notes are counted once
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          })
        );
        uniqueDays = uniqueDates.size;
      }

      // Calculate total word count
      const totalWords = notes.reduce((sum, note) => {
        return sum + (note.content?.length || 0);
      }, 0);

      // Calculate heatmap data for current month (5 rows x 7 columns)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = firstDay.getDay();

      // Create a map of date -> note count
      const noteCounts = new Map<string, number>();
      notes.forEach(note => {
        const noteDate = new Date(note.createdAt);
        if (noteDate.getFullYear() === year && noteDate.getMonth() === month) {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(noteDate.getDate()).padStart(2, '0')}`;
          noteCounts.set(dateKey, (noteCounts.get(dateKey) || 0) + 1);
        }
      });

      // Build 5x7 grid (5 rows, 7 columns, starting with Sunday)
      const heatmap: number[][] = [];
      const totalDays = lastDay.getDate();

      for (let row = 0; row < 5; row++) {
        const weekRow: number[] = [];
        for (let col = 0; col < 7; col++) {
          // Calculate which day this cell represents
          const dayIndex = row * 7 + col;
          const actualDay = dayIndex - firstDayOfWeek + 1;

          if (actualDay < 1 || actualDay > totalDays) {
            // Empty cell (before month starts or after month ends)
            weekRow.push(-1);
          } else {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
            weekRow.push(noteCounts.get(dateKey) || 0);
          }
        }
        heatmap.push(weekRow);
      }

      setStats({
        notes: notes.length,
        tags: tags.length,
        days: uniqueDays,
        words: totalWords,
      });
      setHeatmapData(heatmap);
      setAllTags(tags);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, [loadPinnedTags, getStatistics, getAllTags]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statsContainer}>
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.notes}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>笔记</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.days}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>天</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatWordCount(stats.words)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>字</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.tags}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>标签</Text>
            </View>
          </View>
        </View>

        {/* Heatmap Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>本月笔记</Text>
          <View style={[styles.heatmapContainer, { backgroundColor: colors.surface }]}>
            {/* Week day labels */}
            <View style={styles.weekLabels}>
              {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                <Text key={index} style={[styles.weekLabel, { color: colors.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>
            {/* Heatmap grid */}
            <View style={styles.heatmapGrid}>
              {heatmapData.map((week, rowIndex) => (
                <View key={rowIndex} style={styles.heatmapRow}>
                  {week.map((count, colIndex) => {
                    // Determine color intensity based on note count
                    let cellColor = colors.border;
                    if (count === -1) {
                      // Empty cell (outside current month)
                      cellColor = 'transparent';
                    } else if (count === 0) {
                      // No notes
                      cellColor = colors.border;
                    } else if (count <= 2) {
                      // 1-2 notes - light (30% opacity)
                      cellColor = colors.primary + '4D';
                    } else if (count <= 5) {
                      // 3-5 notes - medium (60% opacity)
                      cellColor = colors.primary + '99';
                    } else {
                      // 6+ notes - full color
                      cellColor = colors.primary;
                    }

                    return (
                      <View
                        key={colIndex}
                        style={[
                          styles.heatmapCell,
                          { backgroundColor: cellColor }
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        {pinnedTags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>置顶标签</Text>
            {pinnedTags.map((tag, index) => (
              <TouchableOpacity
                key={`pinned-${index}`}
                style={[styles.tagItem, { backgroundColor: colors.surface }]}
                onPress={() => {
                  router.push({
                    pathname: '/tag-notes',
                    params: { tag },
                  } as any);
                }}
              >
                <View style={styles.tagLeft}>
                  <Hash size={18} color={colors.text} />
                  <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    e.currentTarget.measure((_x, _y, _width, height, pageX, pageY) => {
                      setSelectedTag(tag);
                      setMenuAnchor({ x: pageX, y: pageY + height });
                      setShowActionMenu(true);
                    });
                  }}
                  style={styles.moreButton}
                >
                  <MoreHorizontal size={18} color={colors.textQuaternary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {allTags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>全部标签</Text>
            {allTags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.tagItem, { backgroundColor: colors.surface }]}
                onPress={() => {
                  router.push({
                    pathname: '/tag-notes',
                    params: { tag },
                  } as any);
                }}
              >
                <View style={styles.tagLeft}>
                  <Hash size={18} color={colors.text} />
                  <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    e.currentTarget.measure((_x, _y, _width, height, pageX, pageY) => {
                      setSelectedTag(tag);
                      setMenuAnchor({ x: pageX, y: pageY + height });
                      setShowActionMenu(true);
                    });
                  }}
                  style={styles.moreButton}
                >
                  <MoreHorizontal size={18} color={colors.textQuaternary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <CustomHeader title="数据统计" showBackButton />
      </SafeAreaView>

      {/* Action Menu */}
      <ActionMenu
        visible={showActionMenu}
        onClose={() => {
          setShowActionMenu(false);
          setMenuAnchor(null);
        }}
        anchorPosition={menuAnchor}
        actions={[
          {
            label: selectedTag && pinnedTags.includes(selectedTag) ? '取消置顶' : '置顶',
            icon: 'push-outline',
            onPress: async () => {
              if (selectedTag) {
                await togglePinTag(selectedTag);
                const tags = getAllTags();
                setAllTags(tags);
              }
            },
          },
          {
            label: '编辑名称',
            icon: 'create-outline',
            onPress: () => {
              const tagToRename = selectedTag;
              setShowActionMenu(false);
              setNewTagName(tagToRename || '');
              setSelectedTag(tagToRename);
              setShowRenameDialog(true);
            },
          },
          {
            label: '仅删除标签',
            icon: 'pricetag-outline',
            onPress: () => {
              setShowActionMenu(false);
              setConfirmDeleteTag(true);
            },
          },
          {
            label: '删除标签和笔记',
            icon: 'trash-outline',
            onPress: () => {
              setShowActionMenu(false);
              setConfirmDeleteTagWithNotes(true);
            },
            isDestructive: true,
          },
        ]}
      />

      {/* Rename Dialog */}
      <DialogInput
        visible={showRenameDialog}
        title="编辑标签名称"
        value={newTagName}
        onChangeText={setNewTagName}
        onCancel={() => {
          setShowRenameDialog(false);
          setNewTagName('');
        }}
        onConfirm={async () => {
          if (selectedTag && newTagName.trim() && newTagName !== selectedTag) {
            try {
              await renameTag(selectedTag, newTagName.trim());
              await loadData();
            } catch (error) {
              console.error('重命名标签失败:', error);
            }
          }
          setShowRenameDialog(false);
          setNewTagName('');
          setSelectedTag(null);
        }}
        placeholder="输入新标签名称"
      />

      <ConfirmDialog
        visible={confirmDeleteTag}
        title="仅删除标签"
        message={`确定要删除标签"${selectedTag}"吗？笔记将保留。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={async () => {
          if (selectedTag) {
            await deleteTag(selectedTag);
            await loadData();
          }
          setConfirmDeleteTag(false);
        }}
        onCancel={() => setConfirmDeleteTag(false)}
        isDestructive
      />

      <ConfirmDialog
        visible={confirmDeleteTagWithNotes}
        title="删除标签和笔记"
        message={`确定要删除标签"${selectedTag}"及其所有笔记吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={async () => {
          if (selectedTag) {
            await deleteTagWithNotes(selectedTag);
            await loadData();
          }
          setConfirmDeleteTagWithNotes(false);
        }}
        onCancel={() => setConfirmDeleteTagWithNotes(false)}
        isDestructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 20,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 6,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagText: {
    fontSize: 16,
    marginLeft: 12,
  },
  moreButton: {
    padding: 4,
  },
  heatmapContainer: {
    borderRadius: 12,
    padding: 16,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  heatmapGrid: {
    gap: 4,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  heatmapCell: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
});
