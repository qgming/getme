import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface CustomHeaderProps {
  title?: string;
  showBackButton?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  onBackPress?: () => void;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export function CustomHeader({
  title,
  showBackButton = false,
  leftElement,
  rightElement,
  onBackPress,
  onLeftPress,
  onRightPress,
}: CustomHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const renderLeftButton = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface }]}
          onPress={onLeftPress || handleBackPress}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      );
    }
    if (leftElement) {
      return (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface }]}
          onPress={onLeftPress}
          activeOpacity={0.7}
        >
          {leftElement}
        </TouchableOpacity>
      );
    }
    return <View style={{ width: 40 }} />;
  };

  const renderRightButton = () => {
    if (rightElement) {
      return (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface }]}
          onPress={onRightPress}
          activeOpacity={0.7}
        >
          {rightElement}
        </TouchableOpacity>
      );
    }
    return <View style={{ width: 40 }} />;
  };

  return (
    <View style={styles.header}>
      {renderLeftButton()}
      {title && (
        <View style={styles.titleCapsule}>
          <View style={[styles.titleInner, { backgroundColor: colors.surface }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>
      )}
      {renderRightButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleCapsule: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  titleInner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
