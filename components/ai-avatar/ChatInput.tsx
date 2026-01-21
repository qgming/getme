import { Send, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardEvent,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onAbort,
  placeholder = '有问题尽管问...',
  disabled = false,
  isLoading = false,
  maxLength = 2000,
}) => {
  const { colors } = useTheme();
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const keyboardWillShow = (e: KeyboardEvent) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    };

    const keyboardWillHide = (e: KeyboardEvent) => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, keyboardWillShow);
    const hideSubscription = Keyboard.addListener(hideEvent, keyboardWillHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardHeight]);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: keyboardHeight,
        },
      ]}
    >
      <View style={styles.content}>
        {/* 主输入区域 */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
          {/* 左侧模型选择按钮 */}
          <TouchableOpacity
            style={[styles.modelButton, { backgroundColor: colors.border }]}
            onPress={() => setShowActions(!showActions)}
          >
            <View style={styles.modelButtonContent}>
              <Sparkles size={18} color={colors.text} />
            </View>
          </TouchableOpacity>

          {/* 输入框 */}
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={maxLength}
            editable={!disabled}
          />

          {/* 发送/终止按钮 */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: isLoading
                  ? colors.error
                  : value.trim() && !disabled
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={isLoading ? onAbort : handleSend}
            disabled={!isLoading && (!value.trim() || disabled)}
          >
            {isLoading ? (
              <X
                size={18}
                color="#fff"
              />
            ) : (
              <Send
                size={18}
                color={value.trim() && !disabled ? '#fff' : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 26,
  },
  content: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modelButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
