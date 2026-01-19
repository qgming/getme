import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { formatMessageTime } from './utils';

interface MessageTimestampProps {
  timestamp: number;
}

/**
 * 消息时间戳组件
 * 作用：显示消息时间分隔符
 */
export const MessageTimestamp: React.FC<MessageTimestampProps> = ({ timestamp }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.timestampContainer}>
      <Text style={[styles.timestampText, { color: colors.textTertiary }]}>
        {formatMessageTime(timestamp)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timestampText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
