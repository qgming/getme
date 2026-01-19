import { Stack, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { Toast } from '../components/Toast';
import { DefaultModelSection, PersonalizationSection } from '../components/model-config';
import { savePersonalizationInfo } from '../database/personalization';
import { useTheme } from '../hooks/useTheme';
import { useAIStore } from '../stores/aiStore';
import { useDefaultModelStore } from '../stores/defaultModelStore';

export default function ModelConfigScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { loadProviders } = useAIStore();
  const { loadDefaultModels } = useDefaultModelStore();
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  const personalizationDataRef = useRef<{ name: string; about: string }>({ name: '', about: '' });

  useEffect(() => {
    loadProviders();
    loadDefaultModels();
  }, [loadProviders, loadDefaultModels]);

  const handlePersonalizationChange = (name: string, about: string) => {
    personalizationDataRef.current = { name, about };
  };

  const handleSave = async () => {
    try {
      const { name, about } = personalizationDataRef.current;
      await savePersonalizationInfo(name, about);
      setToast({ visible: true, message: '个性化信息已保存', type: 'success' });
    } catch (error) {
      console.error('Failed to save personalization info:', error);
      setToast({ visible: true, message: '保存失败，请稍后重试', type: 'error' });
    }
  };

  const handleBackPress = async () => {
    try {
      const { name, about } = personalizationDataRef.current;
      await savePersonalizationInfo(name, about);
    } catch (error) {
      console.error('Failed to save personalization info on exit:', error);
    }
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <CustomHeader
          title="AI设置"
          showBackButton
          onBackPress={handleBackPress}
          rightElement={<Check size={20} color={colors.text} />}
          onRightPress={handleSave}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <PersonalizationSection
            onChange={handlePersonalizationChange}
          />
          <DefaultModelSection />
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
    paddingTop: 12,
  },
});
