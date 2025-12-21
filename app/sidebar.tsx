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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNoteStore } from '../stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;

interface SidebarItem {
  icon: string;
  title: string;
  onPress: () => void;
  color?: string;
  isActive?: boolean;
  iconType?: 'ionicons' | 'material';
}

interface TagItem {
  id: string;
  name: string;
  icon: string;
  isPinned?: boolean;
}

export default function SidebarScreen() {
  const router = useRouter();
  const { getStatistics } = useNoteStore();
  const [stats, setStats] = useState({
    notes: 0,
    tags: 0,
    days: 1384, // 模拟数据
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // 模拟标签数据
  const pinnedTags: TagItem[] = [
    { id: '1', name: '📖方法论', icon: 'book' },
    { id: '2', name: '🤔思考人生', icon: 'pound' },
  ];

  const allTags: TagItem[] = [
    { id: '1', name: '📖方法论', icon: 'book' },
    { id: '2', name: '🤔思考人生', icon: 'pound' },
    { id: '3', name: '💻产品思考', icon: 'laptop' },
  ];

  // 加载统计数据
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const statistics = await getStatistics();
        setStats({
          notes: statistics.totalNotes,
          tags: statistics.taggedNotes,
          days: 1384,
        });
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [getStatistics]);

  const handleBack = () => {
    router.back();
  };

  // 渲染贡献图 (Activity Graph) 模拟
  const renderActivityGraph = () => {
    const rows = 7;
    const cols = 18;
    const cells = [];
    for (let i = 0; i < rows * cols; i++) {
      const isActive = i === 42 || i === 120; // 模拟活跃点
      cells.push(
        <View
          key={i}
          style={[
            styles.graphCell,
            isActive && styles.graphCellActive,
            i === rows * cols - 1 && styles.graphCellToday,
          ]}
        />
      );
    }

    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphGrid}>{cells}</View>
        <View style={styles.graphLabels}>
          <Text style={styles.graphLabel}>10月</Text>
          <Text style={styles.graphLabel}>11月</Text>
          <Text style={styles.graphLabel}>12月</Text>
        </View>
      </View>
    );
  };

  const menuItems: SidebarItem[] = [
    {
      icon: 'grid',
      title: '全部笔记',
      isActive: true,
      onPress: () => router.back(),
    },
    {
      icon: 'sparkles',
      title: '每日回顾',
      onPress: () => {},
    },
    {
      icon: 'radio-button-off',
      title: 'AI 洞察',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={handleBack} activeOpacity={1} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.logoText}>MING</Text>
                <View style={styles.proBadge}>
                  <Ionicons name="flash" size={10} color="#D97706" />
                  <Text style={styles.proText}>升级PRO</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={22} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="settings-outline" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
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
            {renderActivityGraph()}

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
                    color={item.isActive ? '#FFFFFF' : '#4b5563'}
                  />
                  <Text style={[styles.menuTitle, item.isActive && styles.menuTitleActive]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pinned Tags */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>置顶标签</Text>
            </View>
            <View style={styles.tagList}>
              {pinnedTags.map((tag) => (
                <TouchableOpacity key={tag.id} style={styles.tagItem}>
                  <View style={styles.tagLeft}>
                    {tag.icon === 'pound' ? (
                      <MaterialCommunityIcons name="pound" size={18} color="#4b5563" />
                    ) : (
                      <Text style={styles.tagEmoji}>📙</Text>
                    )}
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>

            {/* All Tags */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>全部标签</Text>
              <TouchableOpacity>
                <Ionicons name="options-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagList}>
              {allTags.map((tag) => (
                <TouchableOpacity key={tag.id} style={styles.tagItem}>
                  <View style={styles.tagLeft}>
                    {tag.icon === 'pound' ? (
                      <MaterialCommunityIcons name="pound" size={18} color="#4b5563" />
                    ) : tag.icon === 'laptop' ? (
                      <Text style={styles.tagEmoji}>💻</Text>
                    ) : (
                      <Text style={styles.tagEmoji}>📙</Text>
                    )}
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#f9fafb',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
    marginLeft: 2,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
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
  graphContainer: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  graphGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: 4,
  },
  graphCell: {
    width: (SIDEBAR_WIDTH - 40 - 17 * 4) / 18,
    height: (SIDEBAR_WIDTH - 40 - 17 * 4) / 18,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  graphCellActive: {
    backgroundColor: '#34d399',
  },
  graphCellToday: {
    borderWidth: 1,
    borderColor: '#10b981',
  },
  graphLabels: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  graphLabel: {
    fontSize: 12,
    color: '#9CA3AF',
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
    backgroundColor: '#34d399',
  },
  menuTitle: {
    fontSize: 16,
    color: '#4b5563',
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
    fontSize: 14,
    color: '#D1D5DB',
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
  },
  tagEmoji: {
    fontSize: 16,
    marginRight: 12,
  },
  tagText: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 12,
  },
});
