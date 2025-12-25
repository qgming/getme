import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionMenu } from '../components/ActionMenu';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { useNoteStore } from '../stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;

export default function SidebarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notes, getStatistics, getAllTags, pinnedTags, togglePinTag, loadPinnedTags } = useNoteStore();
  const [stats, setStats] = useState({
    notes: 0,
    tags: 0,
    days: 0,
  });
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  const translateX = useSharedValue(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadPinnedTags();

        const statistics = await getStatistics();
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
          notes: statistics.totalNotes,
          tags: tags.length,
          days: daysDiff,
        });
        setAllTags(tags);
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };

    loadData();
  }, [getStatistics, getAllTags, loadPinnedTags]);

  const handleClose = () => {
    router.back();
  };

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
        runOnJS(handleClose)();
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
      onPress: () => router.back(),
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
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={handleClose}
        activeOpacity={1}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logoText}>MING</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.notes}</Text>
                <Text style={styles.statLabel}>笔记</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.tags}</Text>
                <Text style={styles.statLabel}>标签</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.days}</Text>
                <Text style={styles.statLabel}>天</Text>
              </View>
            </View>

            {/* Activity Graph */}
            <ActivityHeatmap notes={notes} width={SIDEBAR_WIDTH} />

            {/* Main Menu */}
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, item.isActive && styles.menuItemActive]}
                  onPress={item.onPress}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.isActive ? '#FFFFFF' : '#1f2937'}
                  />
                  <Text style={[styles.menuTitle, item.isActive && styles.menuTitleActive]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pinned Tags */}
            {pinnedTags.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>置顶标签</Text>
                </View>
                <View style={styles.tagList}>
                  {pinnedTags.map((tag, index) => (
                    <View key={`pinned-${index}`} style={styles.tagItem}>
                      <TouchableOpacity
                        style={styles.tagLeft}
                        onPress={() => {
                          router.push({
                            pathname: '/tag-notes',
                            params: { tag },
                          } as any);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={getTagIcon(tag)}
                          size={18}
                          color="#1f2937"
                        />
                        <Text style={styles.tagText}>{tag}</Text>
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
                        <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
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
                  <Text style={styles.sectionTitle}>全部标签</Text>
                </View>
                <View style={styles.tagList}>
                  {allTags.map((tag, index) => {
                    return (
                      <View key={index} style={styles.tagItem}>
                        <TouchableOpacity
                          style={styles.tagLeft}
                          onPress={() => {
                            router.push({
                              pathname: '/tag-notes',
                              params: { tag },
                            } as any);
                          }}
                        >
                          <MaterialCommunityIcons
                            name={getTagIcon(tag)}
                            size={18}
                            color="#1f2937"
                          />
                          <Text style={styles.tagText}>{tag}</Text>
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
                          <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
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
          setSelectedTag(null);
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
              console.log('编辑标签:', selectedTag);
            },
          },
          {
            label: '仅删除标签',
            icon: 'pricetag-outline',
            onPress: () => {
              console.log('仅删除标签:', selectedTag);
            },
          },
          {
            label: '删除标签和笔记',
            icon: 'trash-outline',
            onPress: () => {
              console.log('删除标签和笔记:', selectedTag);
            },
            isDestructive: true,
          },
        ]}
      />
    </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
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
    color: '#1f2937',
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
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
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
  menuItemActive: {
    backgroundColor: '#2ecc71',
  },
  menuTitle: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuTitleActive: {
    color: '#FFFFFF',
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
    color: '#D2B48C',
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
    color: '#1f2937',
    marginLeft: 12,
  },
  moreButton: {
    padding: 4,
  },
});
