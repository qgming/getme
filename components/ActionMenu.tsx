import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  onClose,
  anchorPosition,
  actions,
}) => {
  if (!anchorPosition) return null;

  // 计算菜单位置，防止超出屏幕边界
  let top = anchorPosition.y;
  let left = anchorPosition.x - MENU_WIDTH + 20; // 默认显示在点击位置左侧一点

  // 边界检查
  if (left < 10) left = 10;
  if (left + MENU_WIDTH > SCREEN_WIDTH - 10) left = SCREEN_WIDTH - MENU_WIDTH - 10;
  if (top + 100 > SCREEN_HEIGHT - 50) top = anchorPosition.y - 100; // 如果太靠下，向上显示

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.menuContainer,
            {
              top: top,
              left: left,
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
              android_ripple={{ color: '#f3f4f6' }}
            >
              <Ionicons
                name={action.icon}
                size={18}
                color={action.isDestructive ? '#ef4444' : '#374151'}
              />
              <Text
                style={[
                  styles.menuText,
                  action.isDestructive && styles.deleteText,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', // 改为透明，或者极淡的颜色
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    width: MENU_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  borderTop: {
    // borderTopWidth: 1,
    // borderTopColor: '#f3f4f6',
  },
  menuText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  deleteText: {
    color: '#ef4444',
  },
});
