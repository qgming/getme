import { Stack } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { Toast } from '../components/Toast';
import { useTheme } from '../hooks/useTheme';
import { getPersonalizationInfo, savePersonalizationInfo } from '../database/personalization';

export default function PersonalizationScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadPersonalizationInfo();
  }, []);

  const loadPersonalizationInfo = async () => {
    try {
      const info = await getPersonalizationInfo();
      if (info) {
        setName(info.name || '');
        setAbout(info.about || '');
      }
    } catch (error) {
      console.error('Failed to load personalization info:', error);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      await savePersonalizationInfo(name, about);
      setToast({ visible: true, message: '个性化信息已保存', type: 'success' });
    } catch (error) {
      console.error('Failed to save personalization info:', error);
      setToast({ visible: true, message: '保存失败，请稍后重试', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <CustomHeader
          title="个性化信息"
          showBackButton
          rightElement={<Check size={24} color={colors.text} />}
          onRightPress={handleSave}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            填写以下信息，帮助AI更好地了解你，提供更个性化的服务
          </Text>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>姓名</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surface,
                color: colors.text,
              }]}
              value={name}
              onChangeText={setName}
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
              value={about}
              onChangeText={setAbout}
              placeholder="介绍一下你自己，包括职业、兴趣爱好、目标等"
              placeholderTextColor={colors.textQuaternary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
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
