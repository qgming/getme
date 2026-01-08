import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { InsightPrompt } from '../types/Insight';

interface PromptInfoDrawerProps {
  visible: boolean;
  prompt: InsightPrompt | null;
  onClose: () => void;
  onStartInsight: () => void;
}

export default function PromptInfoDrawer({ visible, prompt, onClose, onStartInsight }: PromptInfoDrawerProps) {
  const { colors } = useTheme();

  if (!prompt) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.drawer, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <View style={styles.promptHeader}>
              <Text style={styles.icon}>{prompt.icon}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{prompt.title}</Text>
            </View>
          </View>
          <ScrollView style={styles.content}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{prompt.description}</Text>
            <Text style={[styles.author, { color: colors.textMuted }]}>作者: {prompt.author}</Text>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={onStartInsight}
            >
              <Text style={styles.buttonText}>开始洞察</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  author: {
    fontSize: 12,
  },
  footer: {
    padding: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
