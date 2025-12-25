import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface ActionItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDestructive?: boolean;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition: { x: number; y: number } | null;
  actions: ActionItem[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_WIDTH = 180;
const MENU_ITEM_HEIGHT = 48;
const MENU_PADDING = 8;
const SCREEN_EDGE_PADDING = 10;

export const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  onClose,
  anchorPosition,
  actions,
}) => {
  const { colors } = useTheme();

  if (!anchorPosition) return null;

  // 计算菜单实际高度
  const menuHeight = actions.length * MENU_ITEM_HEIGHT + MENU_PADDING * 2;

  // 智能判断垂直位置：优先显示在触发点下方，如果空间不足则显示在上方
  let top = anchorPosition.y;
  const spaceBelow = SCREEN_HEIGHT - anchorPosition.y;
  const spaceAbove = anchorPosition.y;

  if (spaceBelow >= menuHeight + SCREEN_EDGE_PADDING) {
    // 下方空间充足，显示在触发点下方
    top = anchorPosition.y;
  } else if (spaceAbove >= menuHeight + SCREEN_EDGE_PADDING) {
    // 下方空间不足但上方空间充足，显示在触发点上方
    top = anchorPosition.y - menuHeight;
  } else {
    // 上下空间都不足，选择空间较大的一侧，并调整到安全位置
    if (spaceBelow > spaceAbove) {
      top = SCREEN_HEIGHT - menuHeight - SCREEN_EDGE_PADDING;
    } else {
      top = SCREEN_EDGE_PADDING;
    }
  }

  // 智能判断水平位置：默认显示在触发点左侧，如果空间不足则显示在右侧
  let left = anchorPosition.x - MENU_WIDTH + 20;

  // 水平边界检查
  if (left < SCREEN_EDGE_PADDING) {
    // 左侧空间不足，尝试显示在触发点右侧
    left = anchorPosition.x - 20;
    // 如果右侧也超出，则贴近右边缘
    if (left + MENU_WIDTH > SCREEN_WIDTH - SCREEN_EDGE_PADDING) {
      left = SCREEN_WIDTH - MENU_WIDTH - SCREEN_EDGE_PADDING;
    }
  } else if (left + MENU_WIDTH > SCREEN_WIDTH - SCREEN_EDGE_PADDING) {
    // 右侧超出，贴近右边缘
    left = SCREEN_WIDTH - MENU_WIDTH - SCREEN_EDGE_PADDING;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <View
          style={[
            styles.menuContainer,
            {
              top: top,
              left: left,
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {actions.map((action, index) => (
            <Pressable
              key={index}
              style={[
                styles.menuItem,
                index > 0 && styles.borderTop,
              ]}
              onPress={() => {
                action.onPress();
                onClose();
              }}
              android_ripple={{ color: colors.surfaceSecondary }}
            >
              <Ionicons
                name={action.icon}
                size={18}
                color={action.isDestructive ? colors.red : colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuText,
                  { color: action.isDestructive ? colors.red : colors.textSecondary },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: 12,
    padding: 4,
    width: MENU_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  borderTop: {},
  menuText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
