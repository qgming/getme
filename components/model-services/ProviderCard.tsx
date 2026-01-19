import { MoreHorizontal, Sparkles } from 'lucide-react-native';
import * as LobeIcons from '@lobehub/icons-rn';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AIProvider } from '../../stores/aiStore';
import { ActionItem, ActionMenu } from '../ActionMenu';

interface ProviderCardProps {
  provider: AIProvider;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Provider card component
 * 作用：显示AI提供商信息的卡片组件
 */
export function ProviderCard({ provider, onToggle, onEdit, onDelete }: ProviderCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const isBuiltIn = provider.id === 'default-openai';

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
      icon: 'trash-outline',
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
              <Sparkles size={30} color={colors.accent} />
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
            <MoreHorizontal size={20} color={colors.textSecondary} />
          </TouchableOpacity>
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
});
