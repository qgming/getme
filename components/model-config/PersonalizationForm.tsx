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
    <>
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>姓名</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.surface,
            color: colors.text,
          }]}
          value={initialName}
          onChangeText={onNameChange}
          placeholder="请输入你的姓名"
          placeholderTextColor={colors.textQuaternary}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>关于我</Text>
        <TextInput
          style={[styles.textArea, {
            backgroundColor: colors.surface,
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
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
  },
});
