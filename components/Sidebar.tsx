import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionMenu } from './ActionMenu';
import { ActivityHeatmap } from './ActivityHeatmap';
import { DialogInput } from './DialogInput';
import { useNoteStore } from '../stores';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export function Sidebar({ visible, onClose }: SidebarProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { notes, getStatistics, getAllTags, pinnedTags, togglePinTag, loadPinnedTags, renameTag, deleteTag, deleteTagWithNotes } = useNoteStore();
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

  const translateX = useSharedValue(-SIDEBAR_WIDTH);

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
    if (visible) {
      translateX.value = withTiming(0, { duration: 250 });
      loadData();
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, loadData]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -50 || e.velocityX < -500) {
        translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const menuItems = [
    {
      icon: 'grid',
      title: '全部笔记',
      isActive: true,
      onPress: onClose,
    },
    {
      icon: 'sparkles-outline',
      title: '每日回顾',
      onPress: () => {},
    },
    {
      icon: 'aperture-outline',
      title: 'AI 洞察',
      onPress: () => {},
    },
  ];

  const getTagIcon = (tag: string) => {
    if (tag.includes('方法论')) return 'book-open-variant';
    if (tag.includes('思考')) return 'thought-bubble-outline';
    if (tag.includes('产品')) return 'monitor';
    return 'pound';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.container, { backgroundColor: colors.surface }, animatedStyle]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.logoText, { color: colors.text }]}>MING</Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    onClose();
                    router.push('/settings');
                  }}
                >
                  <Ionicons name="settings-outline" size={22} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.notes}</Text>
                  <Text style={[styles.statLabel, { color: colors.textQuaternary }]}>笔记</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.tags}</Text>
                  <Text style={[styles.statLabel, { color: colors.textQuaternary }]}>标签</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.days}</Text>
                  <Text style={[styles.statLabel, { color: colors.textQuaternary }]}>天</Text>
                </View>
              </View>

              {/* Activity Graph */}
              <ActivityHeatmap notes={notes} width={SIDEBAR_WIDTH} />

              {/* Main Menu */}
              <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.menuItem, item.isActive && { backgroundColor: colors.accent }]}
                    onPress={item.onPress}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.isActive ? '#FFFFFF' : colors.text}
                    />
                    <Text style={[styles.menuTitle, { color: item.isActive ? '#FFFFFF' : colors.text }]}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pinned Tags */}
              {pinnedTags.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.tan }]}>置顶标签</Text>
                  </View>
                  <View style={styles.tagList}>
                    {pinnedTags.map((tag, index) => (
                      <View key={`pinned-${index}`} style={styles.tagItem}>
                        <TouchableOpacity
                          style={styles.tagLeft}
                          onPress={() => {
                            onClose();
                            router.push({
                              pathname: '/tag-notes',
                              params: { tag },
                            } as any);
                          }}
                        >
                          <MaterialCommunityIcons
                            name={getTagIcon(tag)}
                            size={18}
                            color={colors.text}
                          />
                          <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.currentTarget.measure((x, y, _width, height, pageX, pageY) => {
                              setSelectedTag(tag);
                              setMenuAnchor({ x: pageX, y: pageY + height });
                              setShowActionMenu(true);
                            });
                          }}
                          style={styles.moreButton}
                        >
                          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textQuaternary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* All Tags */}
              {allTags.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.tan }]}>全部标签</Text>
                  </View>
                  <View style={styles.tagList}>
                    {allTags.map((tag, index) => {
                      return (
                        <View key={index} style={styles.tagItem}>
                          <TouchableOpacity
                            style={styles.tagLeft}
                            onPress={() => {
                              onClose();
                              router.push({
                                pathname: '/tag-notes',
                                params: { tag },
                              } as any);
                            }}
                          >
                            <MaterialCommunityIcons
                              name={getTagIcon(tag)}
                              size={18}
                              color={colors.text}
                            />
                            <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.currentTarget.measure((x, y, _width, height, pageX, pageY) => {
                                setSelectedTag(tag);
                                setMenuAnchor({ x: pageX, y: pageY + height });
                                setShowActionMenu(true);
                              });
                            }}
                            style={styles.moreButton}
                          >
                            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textQuaternary} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </GestureDetector>

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
                if (selectedTag) {
                  Alert.alert(
                    '仅删除标签',
                    `确定要删除标签"${selectedTag}"吗？笔记将保留。`,
                    [
                      { text: '取消', style: 'cancel' },
                      {
                        text: '删除',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteTag(selectedTag);
                          await loadData();
                        },
                      },
                    ]
                  );
                }
              },
            },
            {
              label: '删除标签和笔记',
              icon: 'trash-outline',
              onPress: () => {
                if (selectedTag) {
                  Alert.alert(
                    '删除标签和笔记',
                    `确定要删除标签"${selectedTag}"及其所有笔记吗？此操作无法撤销。`,
                    [
                      { text: '取消', style: 'cancel' },
                      {
                        text: '删除',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteTagWithNotes(selectedTag);
                          await loadData();
                        },
                      },
                    ]
                  );
                }
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SIDEBAR_WIDTH,
    height: SCREEN_HEIGHT,
  },
  scrollContent: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statItem: {
    marginRight: 40,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  menuList: {
    paddingHorizontal: 12,
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  tagList: {
    paddingHorizontal: 12,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
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
