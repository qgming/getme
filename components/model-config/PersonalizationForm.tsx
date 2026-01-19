import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface PersonalizationFormProps {
  initialName?: string;
  initialAbout?: string;
  onNameChange: (name: string) => void;
  onAboutChange: (about: string) => void;
}

/**
 * Personalization form component
 * 作用：个性化信息表单组件
 */
export function PersonalizationForm({
  initialName = '',
  initialAbout = '',
  onNameChange,
  onAboutChange
}: PersonalizationFormProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.text }]}>姓名</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.background,
            color: colors.text,
          }]}
          value={initialName}
          onChangeText={onNameChange}
          placeholder="请输入你的姓名"
          placeholderTextColor={colors.textQuaternary}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.text }]}>关于我</Text>
        <TextInput
          style={[styles.textArea, {
            backgroundColor: colors.background,
            color: colors.text,
          }]}
          value={initialAbout}
          onChangeText={onAboutChange}
          placeholder="介绍一下你自己，包括职业、兴趣爱好、目标等"
          placeholderTextColor={colors.textQuaternary}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          这些信息将帮助AI更好地了解你，提供更个性化的服务
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
