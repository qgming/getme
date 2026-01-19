import { Stack, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { Toast } from '../components/Toast';
import { PersonalizationSection } from '../components/model-config';
import { savePersonalizationInfo } from '../database/personalization';
import { useTheme } from '../hooks/useTheme';

export default function PersonalizationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  const personalizationDataRef = useRef<{ name: string; about: string }>({ name: '', about: '' });

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
      <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <PersonalizationSection
            onChange={handlePersonalizationChange}
          />
        </ScrollView>

        <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
          <CustomHeader
            title="个性化信息"
            showBackButton
            onBackPress={handleBackPress}
            rightElement={<Check size={20} color={colors.text} />}
            onRightPress={handleSave}
          />
        </SafeAreaView>
      </View>

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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 20,
  },
});
