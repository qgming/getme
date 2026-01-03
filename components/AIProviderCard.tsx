import { Ionicons } from '@expo/vector-icons';
import * as LobeIcons from '@lobehub/icons-rn';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AIProvider } from '../stores/aiStore';
import { ActionItem, ActionMenu } from './ActionMenu';

interface AIProviderCardProps {
  provider: AIProvider;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AIProviderCard({ provider, onToggle, onEdit, onDelete }: AIProviderCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const isBuiltIn = provider.id === 'default-openai';

  // 动态获取图标组件
  const IconComponent = provider.iconName ? (LobeIcons as any)[provider.iconName] : null;

  const handleMorePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setShowMenu(true);
  };

  const menuActions: ActionItem[] = [
    {
      label: provider.isEnabled ? '停用' : '启用',
      icon: provider.isEnabled ? 'close-circle-outline' : 'checkmark-circle-outline',
      onPress: () => {
        setShowMenu(false);
        onToggle();
      },
    },
    {
      label: '编辑',
      icon: 'create-outline',
      onPress: () => {
        setShowMenu(false);
        onEdit();
      },
    },
    ...(!isBuiltIn ? [{
      label: '删除',
      icon: 'trash-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        setShowMenu(false);
        onDelete();
      },
      isDestructive: true,
    }] : []),
  ];

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/ai-provider?id=${provider.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {IconComponent?.Avatar ? (
              <IconComponent.Avatar size={30} />
            ) : (
              <Ionicons name="sparkles" size={30} color={colors.accent} />
            )}
            <Text style={[styles.name, { color: colors.text }]}>{provider.name}</Text>
            {provider.isEnabled && (
              <View style={[styles.enabledBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.enabledText}>已启用</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={handleMorePress}
            style={styles.moreButton}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Base URL</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
              {provider.baseUrl}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>API Key</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
              {provider.apiKey ? '••••••••' + provider.apiKey.slice(-4) : '未设置'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <ActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        anchorPosition={menuPosition}
        actions={menuActions}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  enabledBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  enabledText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 4,
  },
  infoContainer: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
});
