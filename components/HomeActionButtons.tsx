import { useRouter } from 'expo-router';
import { BarChart3, Sparkles, Bot } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

export const HomeActionButtons = () => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/ai-avatar' as any)}
      >
        <Bot size={20} color={colors.text} />
        <Text style={[styles.buttonText, { color: colors.text }]}>AI 分身</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/ai-insights' as any)}
      >
        <Sparkles size={20} color={colors.text} />
        <Text style={[styles.buttonText, { color: colors.text }]}>AI 洞察</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/statistics' as any)}
      >
        <BarChart3 size={20} color={colors.text} />
        <Text style={[styles.buttonText, { color: colors.text }]}>数据统计</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
