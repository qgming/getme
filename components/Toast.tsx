import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide: () => void;
}

let globalShowToast: ((message: string, type?: 'success' | 'error' | 'info', duration?: number) => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration?: number) {
  if (globalShowToast) {
    globalShowToast(message, type, duration);
  }
}

export function setGlobalToastHandler(handler: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void) {
  globalShowToast = handler;
}

export function Toast({ visible, message, type = 'success', duration = 2000, onHide }: ToastProps) {
  const { colors } = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.9,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onHide());
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, opacity, scale, duration, onHide]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: type === 'error' ? colors.red : colors.primaryDark,
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    pointerEvents: 'none',
  },
  toast: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    maxWidth: '90%',
  },
  message: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
