import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomHeader } from '../components/CustomHeader';
import { DefaultModelSection } from '../components/model-config';
import { useTheme } from '../hooks/useTheme';
import { useAIStore } from '../stores/aiStore';
import { useDefaultModelStore } from '../stores/defaultModelStore';

export default function ModelConfigScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { loadProviders } = useAIStore();
  const { loadDefaultModels } = useDefaultModelStore();

  useEffect(() => {
    loadProviders();
    loadDefaultModels();
  }, [loadProviders, loadDefaultModels]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <DefaultModelSection />
        </ScrollView>

        <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
          <CustomHeader
            title="模型配置"
            showBackButton
            onBackPress={() => router.back()}
          />
        </SafeAreaView>
      </View>
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
