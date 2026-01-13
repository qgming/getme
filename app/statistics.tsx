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
  });
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

      let daysDiff = 0;
      if (notes.length > 0) {
        const oldestNote = notes.reduce((oldest, note) =>
          new Date(note.createdAt) < new Date(oldest.createdAt) ? note : oldest
        );
        const firstNoteDate = new Date(oldestNote.createdAt);
        const today = new Date();
        daysDiff = Math.floor((today.getTime() - firstNoteDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      setStats({
        notes: notes.length,
        tags: tags.length,
        days: daysDiff,
      });
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
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.tags}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>标签</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.days}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>天</Text>
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
});
