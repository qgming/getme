import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useNoteStore, useThemeStore, useAIStore } from '../stores';
import { useDefaultModelStore } from '../stores/defaultModelStore';
import { initializeDefaultProviders } from '../database/seed';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const initialize = useNoteStore(state => state.initialize);
  const loadThemeMode = useThemeStore(state => state.loadThemeMode);
  const updateColorScheme = useThemeStore(state => state.updateColorScheme);
  const colorScheme = useThemeStore(state => state.colorScheme);
  const loadProviders = useAIStore(state => state.loadProviders);
  const loadDefaultModels = useDefaultModelStore(state => state.loadDefaultModels);

  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
        await initializeDefaultProviders();
        await loadProviders();
        await loadDefaultModels();
        loadThemeMode();
      } finally {
        setAppReady(true);
      }
    };
    init();
  }, [initialize, loadThemeMode, loadProviders, loadDefaultModels]);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      updateColorScheme();
    });
    return () => subscription.remove();
  }, [updateColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="ai-insights" options={{ headerShown: false }} />
        <Stack.Screen name="ai-settings" options={{ headerShown: false }} />
        <Stack.Screen name="statistics" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="note-editor" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen name="tag-notes" options={{ headerShown: false }} />
        <Stack.Screen name="insight-result" options={{ headerShown: false }} />
        <Stack.Screen name="insight-history" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}